# Ejemplo: de `switch` repetido a estrategias (y cuándo quedarse en una tabla)

**Pedido:** "Tenemos transportistas y cada vez que añadimos uno hay que tocar medio código. Aplica el patrón Strategy."

## Problema

```ts
// shipping.ts
export function shippingCost(o: Order) {
  switch (o.carrier) {
    case 'standard': return 4.99;
    case 'express': return 9.99 + o.weightKg * 2;
    case 'pickup': return 0;
  }
}
// eta.ts
export function etaDays(o: Order) {
  switch (o.carrier) { case 'standard': return 5; case 'express': return 1; case 'pickup': return 2; }
}
// labels.ts
export function carrierLabel(o: Order) {
  switch (o.carrier) { case 'standard': return 'Estándar'; case 'express': return 'Exprés'; case 'pickup': return 'Recogida'; }
}
```

- **Qué duele:** el mismo `switch` en tres archivos; un transportista nuevo exige editar los tres y es fácil olvidar uno.
- **Qué varía:** coste, plazo y etiqueta por transportista. **Qué es estable:** el modelo `Order` y quién consume estos datos.
- **Variantes reales:** 3 hoy, 2 más previstas este trimestre.
- **Convenciones del proyecto:** TypeScript funcional, sin contenedor DI.

## Decisión

| Candidato | Alternativa simple | Veredicto | Razón |
|---|---|---|---|
| Strategy con clases (`ExpressShipping implements ShippingStrategy`) | Tabla de funciones `Record<Carrier, CarrierRule>` | **Tabla** | Las variantes no tienen estado ni dependencias; el proyecto es funcional. Las clases añadirían 4 archivos sin beneficio. |
| Factory para elegir la estrategia | `CARRIERS[order.carrier]` | **No aplicar** | La tabla ya es la selección. |

Se **reevaluará** pasar a clases si algún transportista necesita llamar a una API externa (estado o dependencias propias): entonces cada regla se convierte en una clase que recibe su cliente por constructor y la tabla se compone en `main.ts`.

## Resultado

```ts
// carriers.ts: un único lugar que conoce a los transportistas
export interface CarrierRule {
  label: string;
  cost(order: Order): number;
  etaDays: number;
}

export const CARRIERS: Record<Carrier, CarrierRule> = {
  standard: { label: 'Estándar', cost: () => 4.99, etaDays: 5 },
  express: { label: 'Exprés', cost: (o) => 9.99 + o.weightKg * 2, etaDays: 1 },
  pickup: { label: 'Recogida', cost: () => 0, etaDays: 2 },
};

export const shippingCost = (o: Order) => CARRIERS[o.carrier].cost(o);
export const etaDays = (o: Order) => CARRIERS[o.carrier].etaDays;
export const carrierLabel = (o: Order) => CARRIERS[o.carrier].label;
```

Añadir `drone` es una entrada en `CARRIERS`; el tipo `Record<Carrier, …>` hace que el compilador avise si falta. Los tests existentes de `shippingCost` siguen pasando sin cambios (mismo comportamiento, misma API).

## Reporte (resumen)

- **Cambios aplicados:** tabla `CARRIERS`; los tres `switch` delegan en ella. Tests: ✅ 12/12.
- **No aplicado:** clases Strategy y Factory (justificado arriba).
- **Aplazado:** reevaluar clases cuando un transportista requiera una API externa.
- **Fuera de alcance:** el redondeo de `weightKg * 2` con decimales y la ausencia de validación de peso negativo.
