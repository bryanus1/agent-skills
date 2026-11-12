# 🏝️ Islas y Renderizado en Astro

## 1. Zero-JS by Default

En Astro, todos los componentes `.astro` se renderizan en tiempo de compilación (SSG) o en el servidor (SSR) y **no envían JavaScript al navegador** a menos que se indique explícitamente.

### Regla de decisión: ¿Necesito una isla?

| Caso de uso | Solución recomendada | JS enviado |
| :--- | :--- | :--- |
| Hero, Features, Pricing estático, Footer | Componente `.astro` puro | `0 KB` |
| Acordeón de FAQ | HTML nativo `<details>` y `<summary>` | `0 KB` |
| Menú móvil simple | Checkbox/CSS o `<details>` | `0 KB` |
| Tabs o filtros interactivos con estado | Isla React/Svelte/Solid/Vue (`client:visible`) | Solo la isla |
| Formulario multi-paso / calculadora | Isla (`client:visible`) | Solo la isla |
| Modal de autenticación o búsqueda global | Isla (`client:idle`) | Solo la isla |
| Carrusel / gráfico *above-the-fold* | Isla (`client:load`) | Solo la isla |

---

## 2. Directivas `client:*`

- **`client:visible`**: Hidrata cuando el componente entra en el viewport. **Opción por defecto** para cualquier isla *below-the-fold* (FAQs complejos, calculadoras de precios, formularios de contacto al final de la página).
- **`client:idle`**: Hidrata cuando el hilo principal del navegador queda libre. Ideal para widgets no críticos (chat, banners de cookies, barra de búsqueda).
- **`client:media="(max-width: 768px)"`**: Hidrata solo cuando coincide la media query (por ejemplo, un drawer móvil).
- **`client:load`**: Hidrata inmediatamente al cargar la página. **Usar con extrema moderación**, solo si el usuario interactúa en el primer segundo *above-the-fold*.
- **`client:only="react"`**: Omite el renderizado en servidor. Evitar en landing pages porque perjudica SEO y LCP.

---

## 3. Modos de Renderizado (`astro.config.mjs`)

- **Static (`output: 'static'`)**: Predeterminado y recomendado para landing pages, blogs y documentación. Máxima velocidad desde CDN.
- **SSR / Hybrid (`output: 'server'` + `export const prerender = true`)**: Úsalo únicamente cuando necesites endpoints `/api/*` con lógica dinámica (envío de formularios con secretos, webhooks, personalización por request). En modo `server`, marca las páginas estáticas de la landing con `export const prerender = true`.
