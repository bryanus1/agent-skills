# Fixture: branch-discounts

Simula una rama que añade descuentos por cupón y fidelidad a los pedidos. No es un repositorio git: el alcance es todo `src/` (archivos nuevos o modificados por la rama). `src/components/CartSummary.tsx` no es ejecutable (sin React instalado) y se revisa solo por lectura.

Tests: `npm test` (Node con TypeScript "strip-only": sin enums ni parameter properties). Los tests existentes pasan, pero **no ejercitan** la lógica de cupones.
