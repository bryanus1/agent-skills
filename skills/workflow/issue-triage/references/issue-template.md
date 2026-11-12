# Plantilla Estándar de Issue Triage

Esta plantilla define la estructura canónica que genera la skill `issue-triage` para documentar issues en cualquier tracker (Linear, GitHub, GitLab, Jira) o notas locales.

---

## 📄 Plantilla Markdown (Copiar / Persistir)

```markdown
## 🎯 Objetivo
<!-- Descripción concisa del problema que se resuelve y por qué es necesario ahora. -->

## 🛡️ Restricciones Arquitectónicas
<!-- Restricciones de capa (ej. backend vs frontend), seguridad, persistencia o rendimiento. -->
- **Ubicación:** 
- **Límites de capa:** 
- **Seguridad / Permisos:** 

## 📋 Reglas de Negocio Clave
<!-- Criterios funcionales específicos, fórmulas, casos de borde y consideraciones de dominio. -->
- **Regla 1:** 
- **Casos de borde:** 

## 🧭 Contexto Técnico en el Repo
<!-- Archivos, módulos, tablas o funciones existentes identificados durante la inspección. -->
- **Archivos / Módulos:** `path/to/module`
- **Patrón existente:** 
- **Dependencias involucradas:** 

## 📦 Alcance Propuesto
### Dentro del alcance (In Scope)
- [ ] Entregable o funcionalidad 1
- [ ] Entregable o funcionalidad 2

### Fuera de alcance (Out of Scope)
- Exclusiones deliberadas para esta fase o ticket.

## 🗓️ Metadatos & Planificación
<!-- Preservación obligatoria de notas de tracking que venían en el ticket original. -->
- **Estimación:** 
- **Ventana temporal / Hito:** 
- **Fase / Epic:** 
- **Prioridad / Etiquetas:** 

## ❓ Preguntas / Decisiones Abiertas
<!-- Dudas pendientes para alinear con el equipo antes o durante la especificación. -->
- 
```

---

## 📌 Ejemplo Realista

```markdown
## 🎯 Objetivo
Calcular plazos y términos (días hábiles/calendario, horas, meses y años) con trazabilidad de reglas y versiones, centralizado exclusivamente en el backend.

## 🛡️ Restricciones Arquitectónicas
- **Ubicación:** Backend (Edge Function TypeScript/Deno o función Postgres).
- **Límites de capa:** La app web y móvil son solo consumidoras; ninguna regla de fechas corre en el cliente.
- **Trazabilidad:** Guardar junto a la fecha calculada el fundamento y versión de la regla aplicada.

## 📋 Reglas de Negocio Clave
- Distinción estricta entre días hábiles vs. días calendario (feriados y fines de semana).
- Cálculo de meses: un mes no equivale a 30 días calendario fijos.
- Suite de pruebas automatizadas con casos de borde y fechas reales.

## 🧭 Contexto Técnico en el Repo
- **Módulos detectados:** `supabase/functions/terms-calculator/` y migraciones en `supabase/migrations/`.
- **Librería de fechas actual:** `date-fns` en dependencias del proyecto.

## 📦 Alcance Propuesto
### Dentro del alcance (In Scope)
- [ ] Endpoint backend para cálculo de plazos temporales.
- [ ] Persistencia de metadatos de regla y fundamento en la respuesta/registro.
- [ ] Suite de tests unitarios e integración para años bisiestos y feriados.

### Fuera de alcance (Out of Scope)
- Sincronización en tiempo real vía WebSockets.

## 🗓️ Metadatos & Planificación
- **Estimación:** 16 h
- **Ventana temporal:** 16 nov → 19 nov 2026
- **Fase:** F4 · Términos y agenda
- **Slug sugerido:** `bs-521-calculo-terminos`

## ❓ Preguntas / Decisiones Abiertas
- ¿La lista de feriados nacionales se gestiona en tabla Postgres o archivo de configuración estático?
```
