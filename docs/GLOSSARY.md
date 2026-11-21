# 📖 Glossary and Translation Style Guide

Skills in this catalog are written in English, because agents follow English instructions most reliably. This file keeps the wording consistent across skills, and it is the reference for translating the skills that were first written in Spanish.

---

## 1. Style

- **Imperative and direct**: "Run the linter", not "The linter should be run" or "You may want to run the linter".
- **Short sentences, one instruction each.** Numbered steps for anything the agent must do in order.
- **Keep MUST / NEVER / ALWAYS** where the Spanish source uses *DEBE / NUNCA / SIEMPRE* as hard rules. Do not add new ones.
- **Meaning over wording**: translate what the rule asks for, not word by word. Never drop a rule, an example or a caveat.
- **Code stays as it is**: code blocks, identifiers, file names, CLI flags and commands are not translated. Comments inside code samples are translated.
- **Reply language**: every skill's Critical Rules include `Reply in the user's language, even though this skill is written in English.`

---

## 2. What NOT to Translate

| Keep as is | Why |
| :--- | :--- |
| Skill `name`, folder names, script names and flags | Other skills and users call them (`monorepo-architecture` runs its siblings' scripts) |
| Spanish `triggers` | Users type in Spanish; add English triggers next to them |
| Strings a script reads or writes in the user's project (labels, tracker property names, file paths such as `docs/specs/`) | Changing them breaks existing projects; if one has to change, make it a **major** bump |
| Conventional Commit types, emoji conventions, Git/GitHub terms | They are already English identifiers |
| Brand and product names (Notion, Linear, GitHub Projects, NestJS…) | Proper nouns |

---

## 3. Section Headings

| Spanish | English |
| :--- | :--- |
| `## 🎯 Propósito` | `## 🎯 Purpose` |
| `## ⚡ Cuándo Activar esta Skill` | `## ⚡ When to Trigger` |
| `## 📋 Flujo de Trabajo Paso a Paso` | `## 📋 Workflow` |
| `## ⚠️ Reglas Críticas` / `Reglas y Consideraciones Críticas` | `## ⚠️ Critical Rules` |
| `## 🛠️ Scripts y Herramientas Auxiliares` | `## 🛠️ Helper Scripts` |
| `## 📚 Referencias` / `Referencias Adicionales` | `## 📚 References` |
| `## 📤 Reporte` | `## 📤 Report` |
| `### Paso N: …` | `### Step N: …` |

### Report templates

Some skills give the agent a template for its final report (`### Resumen`, `### Hallazgos`…). Write the template in English; the agent renders it in the user's language when it replies.

| Spanish | English |
| :--- | :--- |
| Resumen | Summary |
| Hallazgos | Findings |
| Veredicto | Verdict |
| Cambios aplicados | Changes applied |
| Plan de correcciones sugerido | Suggested fix plan |
| No verificado / fuera de alcance | Not verified / out of scope |
| Aplazado / fuera de alcance | Deferred / out of scope |
| Problema / Resultado | Problem / Result |

---

## 4. Shared Terms

### Workflow and IDD

| Spanish | English | Notes |
| :--- | :--- | :--- |
| ficha técnica | technical spec | Output of `idd-explore` |
| requerimiento | requirement | |
| herramienta de seguimiento / tracker | tracker | Notion, Linear, GitHub Issues/Projects |
| fuente de verdad | source of truth | |
| notas sueltas / brain dump | loose notes / brain dump | |
| puerta de revisión | review gate | Step where the agent stops for user approval |
| persistir | persist / save | "Persist (tracker first)" |
| detenerse | stop | |
| alcance | scope | |
| criterios de aceptación | acceptance criteria | |
| estimación | estimate | |

### Code quality and review

| Spanish | English |
| :--- | :--- |
| hallazgo | finding |
| severidad | severity |
| red de seguridad | safety net (usually: tests in place before refactoring) |
| olor de código | code smell |
| deuda técnica | technical debt |
| refactorizar | refactor |
| priorizar | prioritize |
| verificar y reportar | verify and report |
| prueba / test | test |
| caso borde | edge case |

### Architecture

| Spanish | English |
| :--- | :--- |
| capa | layer |
| módulo | module |
| límite / frontera | boundary |
| acoplamiento / cohesión | coupling / cohesion |
| inyección de dependencias | dependency injection |
| caso de uso | use case |
| dominio / infraestructura | domain / infrastructure |
| andamiaje / scaffolding | scaffolding / scaffold |
| archivo destino | target file |

### Generic

| Spanish | English |
| :--- | :--- |
| el usuario | the user |
| confirmación explícita | explicit confirmation |
| sobrescribir | overwrite |
| raíz del proyecto | project root |
| si aplica | if any / if applicable |
| p. ej. | e.g. |

---

## 5. Translation Checklist (per skill)

1. Translate `description`, the body, `references/`, `examples/` and `README.md`; keep the meaning of every rule.
2. Keep the Spanish `triggers` and add their English equivalents.
3. Add the reply-language line to Critical Rules.
4. Translate script output (help, errors, warnings, generated code comments) and update the tests that assert on it.
5. Translate `expected_output` in `evals/evals.json`; keep some prompts in Spanish.
6. Bump the skill version (**minor**), then run `pnpm test`, `pnpm lint:shell` and `pnpm catalog`.
7. Search for leftovers: `grep -rnE '[áéíóúñ¿¡]' <skill-dir>` should only hit triggers and evals.
