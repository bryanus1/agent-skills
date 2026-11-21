# LSP: Liskov Substitution

> Any implementation (or subtype) must be usable wherever its base type is expected **without the client noticing surprises**. It respects the contract: it does not tighten preconditions, weaken postconditions or break invariants.

LSP is about **behavior**, not about the compiler accepting the inheritance. A subtype that compiles but breaks what the client takes for granted violates LSP.

## How to detect it

- An overridden method that throws `NotImplemented`/`Unsupported` or does nothing.
- A subclass that adds stricter validations (it rejects inputs the base accepts).
- `instanceof` or type checks in the client code "to handle the special case".
- Base contract tests that fail with some implementation.
- An implementation that returns `null` where the interface promises a value, or throws undocumented errors.

## Backend

### Before

```ts
interface FileStorage {
  save(path: string, data: Buffer): Promise<void>;
  delete(path: string): Promise<void>;
}

class ReadOnlyArchiveStorage implements FileStorage {
  async save() { throw new Error('read only'); }      // 💥 the client does not expect it
  async delete() { throw new Error('read only'); }
}
```

Any code that receives a `FileStorage` and calls `save` may fail depending on the implementation.

### After: split the contracts (LSP + ISP)

```ts
interface FileReader { read(path: string): Promise<Buffer>; }
interface FileWriter { save(path: string, data: Buffer): Promise<void>; delete(path: string): Promise<void>; }

class DiskStorage implements FileReader, FileWriter { /* ... */ }
class ReadOnlyArchiveStorage implements FileReader { /* ... */ }
```

Whoever only reads depends on `FileReader`; whoever writes requires `FileWriter`. No implementation lies.

### Inheritance that breaks invariants

```ts
class Rectangle { setWidth(w) {...} setHeight(h) {...} }
class Square extends Rectangle { setWidth(w) { super.setWidth(w); super.setHeight(w); } } // breaks what the client expects
```

Fix: don't inherit because of a real-world "is a"; model by behavior (`Shape` with `area()`), or prefer composition.

## Frontend

- **A "variant" component that changes the contract**: a `<Button>` that, when replaced by `<LinkButton>`, no longer accepts `onClick` or ignores `disabled`. A component that wraps another must respect its props (`...rest`, `ref`, accessibility).
- **Hooks with the same shape but different behavior**: a `useStorage()` that is synchronous in one implementation and returns promises in another. Consumers cannot treat them the same way.
- **Props that are accepted but ignored** (a `disabled` that does not disable): a surprise for the client.

## How to refactor

1. Write (or find) **contract** tests that any implementation should pass, and run them against all of them.
2. If an implementation cannot meet the contract, **don't force it**: split the interface (ISP) or replace the hierarchy with composition.
3. Remove the `instanceof` checks from the client: if they are needed, the contract is badly designed.
4. Document preconditions, postconditions and expected errors in the interface.

## When not to apply it

- There is no inheritance or polymorphism in the code: LSP barely applies; don't force it.
- In structural TypeScript, substitution "by shape" is not enough: check the behavior, not just the types.
