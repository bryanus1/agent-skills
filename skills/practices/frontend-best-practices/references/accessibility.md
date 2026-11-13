# Accesibilidad

Objetivo mínimo razonable: **WCAG 2.2 AA**. Lo más rentable es el HTML semántico correcto.

## Comprobaciones por prioridad

1. **Semántica antes que ARIA.** `<button>` para acciones, `<a href>` para navegación, `<label>`, `<nav>`, `<main>`, `<h1..h6>` en orden. Un `<div onClick>` no es enfocable ni responde a Enter/Espacio: cámbialo por `<button type="button">`.
2. **Teclado**: todo lo interactivo se alcanza con Tab, se activa con Enter/Espacio y tiene **foco visible**. No quites `outline` sin sustituirlo. No uses `tabIndex` positivo.
3. **Nombres accesibles**: botones solo con icono llevan `aria-label` (o texto oculto visualmente); campos con `<label>`; enlaces con texto que tenga sentido fuera de contexto (no "haz clic aquí").
4. **Imágenes**: `alt` descriptivo si aportan información; `alt=""` si son decorativas. Nunca omitir el atributo.
5. **Color y contraste**: texto 4.5:1 (3:1 si es grande); la información no se transmite solo por color (errores, estados).
6. **Foco y anuncios**: al abrir un diálogo, mueve el foco dentro, atrápalo y devuélvelo al cerrar; usa `<dialog>` o una librería headless (Radix, React Aria) en vez de implementarlo a mano. Los cambios dinámicos importantes (errores de formulario, resultados) se anuncian con `role="status"` / `aria-live="polite"`.
7. **Navegación entre rutas** en SPAs: mueve el foco al encabezado principal o anuncia el cambio de título.
8. **Movimiento y tiempos**: respeta `prefers-reduced-motion`; no cortes sesiones sin aviso.
9. **Objetivos táctiles** de al menos 24×24 px (WCAG 2.2), mejor 44 px en móvil.

## ARIA: reglas

- La primera regla de ARIA es no usar ARIA si existe un elemento nativo.
- Si usas un rol (`role="tablist"`), debes implementar su patrón de teclado completo. Un rol a medias es peor que ninguno.
- `aria-hidden="true"` nunca en elementos enfocables.

## Cómo verificar

- Automático (axe, `eslint-plugin-jsx-a11y`, Lighthouse) detecta ~30-40 % de los problemas: úsalo, pero no basta.
- Manual: recorre la pantalla solo con teclado; prueba con un lector de pantalla (VoiceOver, NVDA); amplía el zoom al 200 %.
- Si no puedes ejecutar estas pruebas, **dilo en el reporte** en lugar de afirmar que cumple.
