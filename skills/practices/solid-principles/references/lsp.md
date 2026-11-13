# LSP: sustitución de Liskov

> Cualquier implementación (o subtipo) debe poder usarse donde se espera su tipo base **sin que el cliente note sorpresas**. Respeta el contrato: no endurece precondiciones, no debilita postcondiciones, no rompe invariantes.

LSP trata del **comportamiento**, no de que el compilador acepte la herencia. Un subtipo que compila pero rompe lo que el cliente da por hecho viola LSP.

## Cómo detectarlo

- Un método sobrescrito que lanza `NotImplemented`/`Unsupported` o no hace nada.
- Una subclase que añade validaciones más estrictas (rechaza entradas que la base acepta).
- `instanceof` o comprobaciones de tipo en el código cliente "para tratar el caso especial".
- Tests del contrato base que fallan con alguna implementación.
- Una implementación que devuelve `null` donde la interfaz promete un valor, o lanza errores no documentados.

## Backend

### Antes

```ts
interface FileStorage {
  save(path: string, data: Buffer): Promise<void>;
  delete(path: string): Promise<void>;
}

class ReadOnlyArchiveStorage implements FileStorage {
  async save() { throw new Error('read only'); }      // 💥 el cliente no lo espera
  async delete() { throw new Error('read only'); }
}
```

Cualquier código que reciba un `FileStorage` y llame a `save` puede fallar según la implementación.

### Después: separar contratos (LSP + ISP)

```ts
interface FileReader { read(path: string): Promise<Buffer>; }
interface FileWriter { save(path: string, data: Buffer): Promise<void>; delete(path: string): Promise<void>; }

class DiskStorage implements FileReader, FileWriter { /* ... */ }
class ReadOnlyArchiveStorage implements FileReader { /* ... */ }
```

Quien solo lee depende de `FileReader`; quien escribe exige `FileWriter`. Ninguna implementación miente.

### Herencia que rompe invariantes

```ts
class Rectangle { setWidth(w) {...} setHeight(h) {...} }
class Square extends Rectangle { setWidth(w) { super.setWidth(w); super.setHeight(w); } } // rompe lo que espera el cliente
```

Arreglo: no heredes por "es un" en el mundo real; modela por comportamiento (`Shape` con `area()`), o prefiere composición.

## Frontend

- **Componente "variante" que cambia el contrato**: `<Button>` que sustituido por `<LinkButton>` deja de aceptar `onClick` o ignora `disabled`. Un componente que envuelve a otro debe respetar sus props (`...rest`, `ref`, accesibilidad).
- **Hooks con la misma forma, comportamiento distinto**: `useStorage()` que en una implementación es síncrono y en otra devuelve promesas. Los consumidores no pueden tratarlos por igual.
- **Props que se aceptan pero se ignoran** (`disabled` que no deshabilita): sorpresa para el cliente.

## Cómo refactorizar

1. Escribe (o localiza) tests de **contrato** que cualquier implementación debería pasar, y ejecútalos contra todas.
2. Si una implementación no puede cumplir el contrato, **no la fuerces**: divide la interfaz (ISP) o cambia la jerarquía por composición.
3. Elimina los `instanceof` del cliente: si hacen falta, el contrato está mal planteado.
4. Documenta precondiciones, postcondiciones y errores esperados en la interfaz.

## Cuándo no aplicarlo

- No hay herencia ni polimorfismo en el código: LSP casi no aplica; no lo fuerces.
- En TypeScript estructural, la sustitución "por forma" no basta: revisa el comportamiento, no solo los tipos.
