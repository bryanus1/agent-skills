# Seguridad en el frontend

El frontend no es una frontera de confianza: todo lo que hace el cliente puede ser manipulado. La autorización real vive en el servidor; aquí se evita **exponer** y **ejecutar** contenido hostil.

## XSS (lo más importante)

- React escapa por defecto el texto interpolado `{value}`. El peligro está en saltarse eso:
  - `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `document.write`.
  - `href`/`src` con valores del usuario (`javascript:` URLs): valida el protocolo (`https:`/`http:`/`mailto:`).
  - `eval`, `new Function`, `setTimeout("string")`.
- Si se debe renderizar HTML de terceros (CMS, Markdown), **sanéalo** con una librería mantenida (DOMPurify o la que ya use el proyecto) y con una lista de etiquetas permitidas; mejor aún, convertir Markdown a elementos React (react-markdown) en lugar de HTML.
- Una política **CSP** estricta reduce el daño de un XSS que se escape; configúrala en el servidor/framework.

## Tokens y sesiones

- Evita guardar tokens de sesión en `localStorage`/`sessionStorage`: cualquier XSS los lee. Prefiere **cookies `HttpOnly; Secure; SameSite`** gestionadas por el servidor.
- Si usas cookies para autenticar, protege las mutaciones contra CSRF (SameSite, tokens).
- No registres tokens ni datos personales en consola, analítica ni mensajes de error.

## Secretos y configuración

- Todo lo que está en el bundle es público. Las variables con prefijo público (`NEXT_PUBLIC_`, `VITE_`) **no son secretos**; las claves privadas (Stripe secret, base de datos, tokens de servicio) solo en el servidor.
- No incluyas URLs internas ni claves de administración en el código cliente.

## Enlaces, iframes y terceros

- `target="_blank"` con `rel="noopener noreferrer"`.
- `iframe` de terceros con `sandbox` y permisos mínimos.
- Scripts externos con Subresource Integrity cuando sea posible; minimiza el número de terceros.
- Valida y limita redirecciones (`?next=`) a rutas internas para evitar redirecciones abiertas.

## Datos del usuario

- No confíes en `window.location`, `postMessage` ni `localStorage` como entrada: valida y tipa lo que lees (Zod).
- Los mensajes de error al usuario no deben revelar detalles internos.
