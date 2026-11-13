# Ejemplo: revisión de una rama que añade descuentos a pedidos

**Pedido:** "Revisa mi rama antes de abrir el PR."

## 1. Alcance

```
Alcance: rama contra main · 4 archivo(s) · +96 −12

frontend (1)
    src/components/OrderSummary.tsx  +30 −4
backend (2)
    src/api/orders.ts  +52 −6
    src/services/pricing.ts  +14 −2
tests (1)
    test/pricing.test.ts  +0 −0   (sin cambios)

Lentes recomendadas: clean-code, frontend-best-practices, backend-best-practices, solid-principles, tdd-workflow
Avisos: ! Cambia código fuente sin tocar ningún test.
```

Decisión: se aplican `clean-code`, `frontend`, `backend` y `tdd-workflow`. `solid-principles` se omite: el cambio añade una función a un servicio existente, sin clases ni dependencias nuevas. `design-patterns` se omite: una sola regla de descuento, sin segunda variante.

## 2. Evidencia

- Tests: ✅ 9/9 (`npm test`). Typecheck: ✅. Lint: ✅.
- `detect-smells`: `orders.ts:34 long-function (58 líneas)`, `pricing.ts:20 magic-number (0.15)`.

## 3. Informe

### Veredicto
**Requiere cambios**: una inyección SQL nueva y lógica de descuentos sin tests.

### Hallazgos
| # | Sev. | Lente | Ubicación | Problema y efecto | Corrección |
|---|---|---|---|---|---|
| 1 | Crítico | backend | src/api/orders.ts:41 | `WHERE coupon = '${req.query.coupon}'`: inyección SQL | Consulta parametrizada |
| 2 | Importante | tdd | src/services/pricing.ts:20-33 | La regla de descuento por cupón no tiene tests; los 9 existentes pasan porque no la ejercitan | Test de cupón válido, caducado y acumulación |
| 3 | Importante | frontend | OrderSummary.tsx:22 | `useEffect` copia `total - discount` a estado: dos renders y valor desfasado un frame | Calcular en el render |
| 4 | Menor | clean-code | pricing.ts:20 | `0.15` sin nombre | `const LOYALTY_DISCOUNT = 0.15` |

El smell `long-function` de `orders.ts:34` se agrupa con el hallazgo 1 (misma función): se corrige primero la inyección y luego se valora extraer; no se reporta como hallazgo aparte porque 58 líneas con una responsabilidad clara no duelen hoy.

### Bien hecho
El cálculo de descuentos es una función pura, fácil de probar.

### Fuera de alcance / no verificado
- Accesibilidad del nuevo desplegable de cupón: requiere navegador.
- `orders.ts` ya tenía otras consultas por interpolación en líneas 12 y 18 (preexistente: se recomienda abrir un issue aparte).

### Plan de correcciones sugerido
1. Hallazgo 1 → `backend-best-practices` (con test que reproduzca la inyección).
2. Hallazgo 2 → `tdd-workflow`.
3. Hallazgos 3 y 4 → `frontend-best-practices` y `clean-code`.

¿Aplico alguno?
