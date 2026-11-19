# Destinos y Preservación de Notas (`architecture-map`)

Guía para elegir dónde vive la página de arquitectura, leer su contenido actual y actualizarla sin destruir conocimiento escrito por el equipo.

---

## 🎯 Detección del Destino

| Situación | Destino elegido | Acción |
|---|---|---|
| El usuario pasa una URL/ID de Notion o pide usar Notion | **Notion (MCP)** | Leer con `notion-fetch`; si es nueva, preguntar página padre o base de datos |
| El usuario indica una ruta concreta (ej. `ARCHITECTURE.md`) | **Archivo local indicado** | Leer si existe para actualizar; si no, crear tras confirmar |
| Sin destino explícito y existe `docs/ARCHITECTURE.md`, `ARCHITECTURE.md` o `docs/architecture.md` | **Archivo local existente** | Actualizar **ese mismo archivo** sin crear duplicados |
| Sin destino explícito y no existe archivo local | **Por defecto `docs/ARCHITECTURE.md`** | Si hay Notion MCP conectado, ofrecer elegir entre `docs/ARCHITECTURE.md` y Notion antes de generar/guardar |

---

## 1. Notion (MCP)

- **Leer página existente:** `notion-fetch` con la URL o el ID de página.
- **Crear página nueva:** `notion-create-pages` dentro de la página padre o base de datos que confirme el usuario.
- **Actualizar página existente:**
  1. Identifica bloques o secciones manuales existentes (ADRs, roadmap, notas operativas, enlaces a Figma/Linear, propietarios).
  2. Muestra al usuario el resumen de deriva, los cambios propuestos y qué secciones se conservan intactas.
  3. Tras la confirmación explícita, vuelve a llamar a `notion-fetch` justo antes de escribir para asegurar que nadie editó la página mientras tanto, y aplica el cambio con `notion-update-page`.

---

## 2. Archivo Local Markdown

- **Crear:** si la carpeta `docs/` no existe, el agente la crea al confirmar el usuario el borrador de `docs/ARCHITECTURE.md`.
- **Actualizar:** editar el archivo existente (`docs/ARCHITECTURE.md`, `ARCHITECTURE.md` o `docs/architecture.md`) reemplazando solo las secciones técnicas derivadas del código y conservando los bloques manuales.

---

## 🛡️ Regla de Preservación de Contenido Humano

Nunca sobrescribas a ciegas toda la página en una actualización:
- **Secciones regenerables desde el repo:** Resumen técnico, Diagrama de alto nivel, Apps y módulos, Stack verificado, Persistencia/Auth (observables en código), Flujos clave, Integraciones/Env vars, Comandos/Despliegue y fecha/commit de vigencia.
- **Secciones humanas que SIEMPRE se preservan:**
  - `Decisiones y Notas del Equipo` / ADRs.
  - Contexto de negocio, SLAs, costos, roadmap o deuda aceptada escrita por personas.
  - Enlaces a tableros, runbooks externos o diagramas enlazados.
- Si una nota manual contradice algo obvio del código actual (p. ej. menciona un servicio ya eliminado en `package.json`), **no la borres**: consérvala y señala la discrepancia al usuario para que decida si retirarla.
