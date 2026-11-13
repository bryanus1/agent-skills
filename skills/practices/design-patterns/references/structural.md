# Patrones estructurales

## Contenido

1. [Adapter (puerto y adaptador)](#adapter-puerto-y-adaptador)
2. [Decorator](#decorator)
3. [Facade](#facade)

## Adapter (puerto y adaptador)

**Problema:** el código de negocio depende de la forma de un SDK, API o librería de terceros; cambiar de proveedor o probar sin red obliga a editar la lógica.

**Cuándo sí:** integraciones externas (pagos, correo, almacenamiento, IA, APIs de terceros), formatos de datos de otro sistema que no quieres propagar.

**Cuándo no:** librerías estables y de utilidad (`lodash`, `date-fns`) que no justifican un envoltorio.

```ts
// Puerto: lo define el dominio, con su lenguaje
export interface EmailSender {
  send(input: { to: string; subject: string; html: string }): Promise<void>;
}

// Adaptador: traduce al SDK concreto
export class SendGridEmailSender implements EmailSender {
  constructor(private readonly client: MailService) {}
  async send({ to, subject, html }: { to: string; subject: string; html: string }) {
    await this.client.send({ to, from: this.from, subject, html });
  }
}
```

Reglas: la interfaz habla el idioma del negocio, **no copia la API del SDK**; el adaptador es el único archivo que importa el SDK; los errores del SDK se traducen a errores del dominio. Es la base de DIP (ver `solid-principles`).

**Adaptador de datos (anticorruption layer):** convierte la respuesta de una API externa al modelo de tu dominio en un único sitio (`toUser(dto)`), para que el resto no dependa de nombres de campo ajenos.

## Decorator

**Problema:** añadir un comportamiento transversal (caché, logs, métricas, reintentos, autorización) sin modificar ni heredar del original.

**En TS/JS casi siempre es una función de orden superior o un objeto que envuelve a otro con la misma interfaz.**

```ts
interface UserRepository { findById(id: string): Promise<User | null>; }

class CachedUserRepository implements UserRepository {
  private cache = new Map<string, User | null>();
  constructor(private readonly inner: UserRepository) {}
  async findById(id: string) {
    if (!this.cache.has(id)) this.cache.set(id, await this.inner.findById(id));
    return this.cache.get(id)!;
  }
}

// composición: new CachedUserRepository(new PgUserRepository(db))
```

Versión funcional:

```ts
const withRetry = <A extends unknown[], R>(fn: (...a: A) => Promise<R>, retries = 2) =>
  async (...args: A): Promise<R> => {
    for (let attempt = 0; ; attempt++) {
      try { return await fn(...args); } catch (e) { if (attempt >= retries) throw e; }
    }
  };
```

**Variantes que ya son Decorator:** middleware de Express/Koa/Nest (guards, interceptors), HOCs y wrappers de React, `withAuth(handler)`. **Evita** apilar más de 3 decoradores sin tests de la composición (el orden importa: ¿reintento dentro o fuera de la caché?).

## Facade

**Problema:** un subsistema con muchas piezas obliga al cliente a conocer el orden y los detalles de cada una.

**Cuándo sí:** un caso de uso que coordina 3+ servicios y se repite en varios sitios; una API simple sobre una librería compleja.

```ts
export class CheckoutFacade {
  constructor(private cart: CartService, private pricing: PricingService, private payments: PaymentGateway, private orders: OrderRepository) {}
  async checkout(cartId: string, token: string) {
    const cart = await this.cart.get(cartId);
    const total = this.pricing.total(cart);
    await this.payments.charge({ amountCents: toCents(total), token });
    return this.orders.create({ cartId, total });
  }
}
```

**Cuándo no:** si solo reenvía llamadas sin simplificar (capa vacía), o si se convierte en un "dios" que acumula lógica de negocio: la fachada **orquesta**, no decide.
