# 🔎 Explain Change (`explain-change`)

> **Auditoría posterior a `/opsx:apply`, `idd-apply` o cualquier implementación asistida por IA: contrasta el código realmente escrito contra la propuesta original y resume qué decisiones tomó la IA por su cuenta (supuestos, límites, contratos, dependencias, alcance extra y atajos).**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `explain-change` |
| **Categoría** | `workflow` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Fuentes Soportadas** | OpenSpec (`openspec/changes/`), IDD (Notion, Linear, GitHub Issues/Projects, `docs/specs/`), planes `.md` o PRs |
| **Modo** | Solo lectura por defecto |

---

## 📦 Instalación

```bash
# Instalar en el proyecto actual con skills.sh:
npx skills add bryanus1/agent-skills --skill explain-change

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill explain-change -g
```

---

## 💡 Ejemplos de Uso

### 1. Justo después de `/opsx:apply`
> *"explicar-cambio después del último /opsx:apply"*

Localiza el cambio activo en `openspec/changes/<nombre>/` (`proposal.md`, `design.md`, `specs/`, `tasks.md`), inspecciona el `git diff` y los archivos nuevos, y te muestra únicamente las decisiones implícitas que tomó la IA (p. ej. una librería instalada fuera de diseño, un límite arbitrario o un refactor colateral).

### 2. Después de implementar un ticket con `idd-apply`
> *"¿Qué decisiones tomó la IA que no estaban en el plan de ENG-104?"*

Lee el plan y los comentarios de progreso/desviaciones del issue en Linear, separa lo que ya habías aprobado en `### Desviaciones` de las decisiones silenciosas o puntos omitidos, y prioriza lo que requiere tu validación.

### 3. Plan local en Markdown o PR
> *"Audita los cambios de esta rama contra docs/specs/2026-11-12-exportar-csv.md"*

Compara la rama actual contra `main` frente a la especificación indicada y pregunta qué decisiones aceptar (con opción a documentarlas tras tu OK) o revertir.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: flujo paso a paso, regla anti-autojustificación y restricciones de solo lectura.
- **[Fuentes de la propuesta](references/proposal-sources.md)**: localización y lectura en OpenSpec, IDD y planes genéricos.
- **[Taxonomía de decisiones e informe](references/decision-taxonomy.md)**: las 6 categorías, criterios 🔴/🟡/🟢, plantilla canónica y ejemplo completo.
