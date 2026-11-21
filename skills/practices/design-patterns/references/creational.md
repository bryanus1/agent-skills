# Creational Patterns

## Contents

1. [Factory / Factory Method](#factory--factory-method)
2. [Builder](#builder)
3. [Singleton: why to avoid it](#singleton-why-to-avoid-it)

## Factory / Factory Method

**Problem:** the concrete type to create depends on data or configuration, and the client code should not know the concrete classes or the selection logic.

**When yes:** there are several implementations chosen by configuration or input (`pdf`/`csv`/`xlsx`, `stripe`/`paypal`) and the choice would be repeated in several places.

**When not:** a single type, or a single creation at one point. A direct `new` is clearer.

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

A function with a map of constructors **is** the pattern in TS; it needs no `ExporterFactory`/`CsvExporterFactory` hierarchy. Use it at the **composition root** (where the app is wired), not scattered through the business logic.

**The classic Factory Method** (a subclass decides what to create) is rarely worth it in modern code; prefer passing the factory as a parameter.

## Builder

**Problem:** objects with many optional parameters or construction steps that must follow an order or a validation.

**Simpler alternative (use it first):** an options object with defaults.

```ts
// Enough in most cases
function createClient({ baseUrl, timeoutMs = 5000, retries = 2, headers = {} }: ClientOptions) { /* ... */ }
```

**When yes:** construction is genuinely incremental or has rules between parts (SQL/ORM queries, email messages, configurations validated at the end, immutable objects composed in steps).

```ts
class QueryBuilder {
  private filters: string[] = [];
  private limitValue?: number;
  where(clause: string) { this.filters.push(clause); return this; }
  limit(n: number) { this.limitValue = n; return this; }
  build(): Query { return new Query(this.filters, this.limitValue); } // validate here
}
```

**Test builders** are also useful (`buildOrder({ total: 120 })`): valid defaults, overriding only what matters for the case.

## Singleton: why to avoid it

**The problem it claims to solve:** a single shared instance.

**Why it hurts:** hidden global state, dependencies invisible in signatures, tests that contaminate each other, impossible to replace in tests.

**Alternative:** create **one instance at the composition root** and pass it through the constructor or a context. You get a single instance without coupling the code to it.

```ts
// Avoid
export class Db { private static instance = new Db(); static get() { return Db.instance; } }

// Prefer
const db = new Db(config.databaseUrl);          // once, in main.ts
const orders = new PgOrderRepository(db);       // passed in, not looked up
```

In Node, a module that exports an instance is already a singleton through the module cache; if you do that, make sure it has no mutable state that other parts modify.
