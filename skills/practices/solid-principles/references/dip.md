# DIP: inversión de dependencias

> Los módulos de alto nivel (reglas de negocio) no deben depender de los de bajo nivel (BD, red, SDKs). **Ambos dependen de abstracciones**, y la abstracción pertenece al lado de alto nivel.

La "inversión" es de **propiedad de la interfaz**: el dominio define lo que necesita (`OrderRepository`, `PaymentGateway`) y la infraestructura lo implementa. No es lo mismo que "inyección de dependencias" (una técnica para suministrarlas), ni exige un contenedor DI.

## Cómo detectarlo

- `new Stripe()`, `new PrismaClient()`, `fetch(...)` o `process.env` dentro de reglas de negocio.
- El dominio importa del ORM, del framework web o de un SDK.
- Probar una regla exige BD, red o variables de entorno; o se parchea el módulo (`jest.mock('stripe')`) para poder testear.
- Cambiar de proveedor obliga a editar la lógica de negocio.

## Backend

### Antes

```ts
import Stripe from 'stripe';

export class CheckoutService {
  private stripe = new Stripe(process.env.STRIPE_KEY!);

  async pay(order: Order) {
    const charge = await this.stripe.charges.create({ amount: order.total * 100, currency: 'eur', source: order.token });
    return charge.id;
  }
}
```

### Después

```ts
// checkout.service.ts: el dominio define la abstracción que necesita
export interface PaymentGateway {
  charge(input: { amountCents: number; currency: string; token: string }): Promise<{ id: string }>;
}

export class CheckoutService {
  constructor(private readonly payments: PaymentGateway) {}

  async pay(order: Order) {
    const { id } = await this.payments.charge({ amountCents: Math.round(order.total * 100), currency: 'eur', token: order.token });
    return id;
  }
}

// infra/stripe.gateway.ts: el detalle depende de la abstracción
export class StripeGateway implements PaymentGateway {
  constructor(private readonly stripe: Stripe) {}
  async charge({ amountCents, currency, token }: ChargeInput) {
    const c = await this.stripe.charges.create({ amount: amountCents, currency, source: token });
    return { id: c.id };
  }
}

// composición en un único punto (main.ts / módulo DI)
const checkout = new CheckoutService(new StripeGateway(new Stripe(config.stripeKey)));
```

Test: `new CheckoutService({ charge: async () => ({ id: 'ch_1' }) })`, sin mocks de módulo.

### NestJS

Usa un token de inyección para la interfaz (las interfaces no existen en runtime):

```ts
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
// provider: { provide: PAYMENT_GATEWAY, useClass: StripeGateway }
constructor(@Inject(PAYMENT_GATEWAY) private readonly payments: PaymentGateway) {}
```

## Frontend

- **Funciones de acceso a datos inyectables**: el hook recibe el cliente o se obtiene de un contexto, en lugar de importar `axios` directo en cada componente.
- **Servicios a través de contexto/proveedor** (`<ApiProvider client={...}>`), de modo que los tests y Storybook usan un cliente falso.
- **Adaptadores** entre la forma del API y la del dominio (`toUser(dto)`), para que los componentes no dependan del formato del backend.

```tsx
const ApiContext = createContext<Api>(defaultApi);
function useOrders() { const api = useContext(ApiContext); return useQuery(['orders'], () => api.listOrders()); }
```

## Cómo refactorizar

1. Localiza la dependencia concreta dentro de la lógica de negocio.
2. Define una interfaz **pequeña, con lenguaje del dominio** (ver [ISP](isp.md)); no copies la API del SDK.
3. Haz que la clase reciba la interfaz por constructor (o por parámetro, o por contexto en React).
4. Mueve el uso del SDK a un adaptador en la capa de infraestructura.
5. Compón las piezas en la raíz de la aplicación. Si el proyecto ya usa un contenedor DI, regístralo allí.

## Cuándo no aplicarlo

- Dependencias estables y de la plataforma (`Math`, `Array`, `Date` si no necesitas controlar el tiempo).
- Un único uso sin costura de test necesaria ni segundo proveedor: una función con un parámetro (`now: () => Date`) suele bastar sin interfaz.
- No introduzcas un contenedor de DI ni decoradores solo para esto: el constructor y la composición manual son suficientes.
