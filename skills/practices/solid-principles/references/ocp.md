# OCP: abierto/cerrado

> Una unidad debe estar **abierta a extensión y cerrada a modificación**: añadir un comportamiento nuevo no debería obligar a editar código ya probado y estable.

OCP **no** es "no tocar nunca un archivo". Se aplica en los **puntos de variación reales**: donde ya han aparecido (o van a aparecer pronto) nuevas variantes. Abrir todo a extensión por si acaso es sobreingeniería.

## Cómo detectarlo

- El mismo `switch (type)` o cadena `if/else if` aparece en varios archivos.
- Añadir un método de pago, formato de exportación o tipo de notificación obliga a editar la lógica central.
- Una función central conoce los detalles de cada variante.

## Backend

### Antes

```ts
function shippingCost(order: Order): number {
  switch (order.carrier) {
    case 'standard': return 4.99;
    case 'express':  return order.weight * 2 + 9.99;
    case 'pickup':   return 0;
  }
}
```

Con 3 casos estables en **un solo sitio**, esto está bien (ver "Cuándo no"). Pasa a ser un problema cuando el `switch` se repite (cálculo, etiquetas, plazos de entrega) y cada transportista nuevo exige editar todos.

### Después: Strategy / tabla de estrategias

```ts
interface ShippingRule {
  cost(order: Order): number;
  eta(order: Order): number;
}

const SHIPPING_RULES: Record<Carrier, ShippingRule> = {
  standard: { cost: () => 4.99, eta: () => 5 },
  express:  { cost: (o) => o.weight * 2 + 9.99, eta: () => 1 },
  pickup:   { cost: () => 0, eta: () => 2 },
};

const shippingCost = (order: Order) => SHIPPING_RULES[order.carrier].cost(order);
```

Añadir `drone` es **añadir una entrada**; `Record<Carrier, …>` hace que el compilador avise de las que falten. Si las variantes necesitan estado o dependencias propias, pásalas a clases que implementen la interfaz y regístralas en el punto de composición.

## Frontend

### Antes

```tsx
function Field({ field }: { field: FieldConfig }) {
  if (field.type === 'text') return <input type="text" ... />;
  if (field.type === 'select') return <select ...>...</select>;
  if (field.type === 'date') return <DatePicker ... />;
  return null;
}
```

### Después: registro de componentes

```tsx
const FIELD_RENDERERS: Record<FieldType, React.ComponentType<FieldProps>> = {
  text: TextField,
  select: SelectField,
  date: DateField,
};

function Field({ field }: { field: FieldConfig }) {
  const Renderer = FIELD_RENDERERS[field.type];
  return <Renderer {...field} />;
}
```

También cuenta como OCP: aceptar `children`/`render props` para que el consumidor extienda sin editar el componente.

## Cómo refactorizar

1. Confirma que hay variación real: ¿cuántos casos hay y cuántos sitios los conocen?
2. Define la interfaz mínima con lo que el cliente necesita (ver [ISP](isp.md)).
3. Mueve cada rama a su implementación (o entrada de la tabla) **sin cambiar el comportamiento**; tests entre pasos.
4. Si las variantes son datos (tarifas, textos), prefiere una **tabla de datos** a clases.

## Cuándo no aplicarlo

- Un `switch` pequeño, estable y en un único sitio: es más legible que N clases.
- Variantes que cambian siempre a la vez que el código cliente: la abstracción no aísla nada.
- Antes de la segunda variante: espera a conocerla; la forma correcta de la abstracción se ve con dos casos, no con uno.
