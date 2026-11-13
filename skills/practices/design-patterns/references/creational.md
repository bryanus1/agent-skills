# Patrones creacionales

## Contenido

1. [Factory / Factory Method](#factory--factory-method)
2. [Builder](#builder)
3. [Singleton: por qué evitarlo](#singleton-por-qué-evitarlo)

## Factory / Factory Method

**Problema:** el tipo concreto a crear depende de datos o configuración, y el código cliente no debería conocer las clases concretas ni la lógica de elección.

**Cuándo sí:** hay varias implementaciones elegidas por configuración o entrada (`pdf`/`csv`/`xlsx`, `stripe`/`paypal`) y la elección se repetiría en varios sitios.

**Cuándo no:** un solo tipo, o una única creación en un punto. Un `new` directo es más claro.

```ts
interface Exporter { export(rows: Row[]): Buffer; }

const EXPORTERS: Record<ExportFormat, () => Exporter> = {
  csv: () => new CsvExporter(),
  xlsx: () => new XlsxExporter(),
  pdf: () => new PdfExporter(),
};

export function createExporter(format: ExportFormat): Exporter {
  const create = EXPORTERS[format];
  if (!create) throw new UnsupportedFormatError(format);
  return create();
}
```

Una función con un mapa de constructores **es** el patrón en TS; no necesita una jerarquía `ExporterFactory`/`CsvExporterFactory`. Úsala en la **raíz de composición** (donde se arma la app), no repartida por la lógica de negocio.

**Factory Method clásico** (una subclase decide qué crear) casi nunca compensa en código moderno; prefiere pasar la fábrica como parámetro.

## Builder

**Problema:** objetos con muchos parámetros opcionales o con pasos de construcción que deben respetar un orden o una validación.

**Alternativa más simple (úsala primero):** un objeto de opciones con valores por defecto.

```ts
// Suficiente en la mayoría de casos
function createClient({ baseUrl, timeoutMs = 5000, retries = 2, headers = {} }: ClientOptions) { /* ... */ }
```

**Cuándo sí:** la construcción es genuinamente incremental o tiene reglas entre partes (consultas SQL/ORM, mensajes de correo, configuraciones validadas al final, objetos inmutables que se componen en pasos).

```ts
class QueryBuilder {
  private filters: string[] = [];
  private limitValue?: number;
  where(clause: string) { this.filters.push(clause); return this; }
  limit(n: number) { this.limitValue = n; return this; }
  build(): Query { return new Query(this.filters, this.limitValue); } // valida aquí
}
```

También son útiles los **builders en tests** (`buildOrder({ total: 120 })`): valores por defecto válidos, sobrescribiendo solo lo relevante para el caso.

## Singleton: por qué evitarlo

**Problema que dice resolver:** una única instancia compartida.

**Por qué hace daño:** estado global oculto, dependencias invisibles en las firmas, tests que se contaminan entre sí, imposible sustituir en pruebas.

**Alternativa:** crea **una instancia en la raíz de composición** y pásala por constructor o por contexto. Obtienes una sola instancia sin acoplar el código a ella.

```ts
// Evitar
export class Db { private static instance = new Db(); static get() { return Db.instance; } }

// Preferir
const db = new Db(config.databaseUrl);          // una vez, en main.ts
const orders = new PgOrderRepository(db);       // se pasa, no se busca
```

En Node, un módulo que exporta una instancia ya es un singleton por caché de módulos; si lo haces, que no tenga estado mutable que otras partes modifiquen.
