# 🔍 PR Plain Review (`pr-plain-review`)

> **Revisión previa a aprobar un Pull Request o rama en lenguaje llano: resume qué cambió, por qué, qué archivos críticos tocó (migraciones, RLS, términos legales, auth, pagos, infra) y qué riesgo real asumes antes de hacer clic en *Approve*.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `pr-plain-review` |
| **Categoría** | `git` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | Herramientas de lectura/shell (`git`; opcionalmente `gh` o `glab` para PRs/MRs) |

---

## 🎯 Diferencia frente a otras skills del catálogo

| Skill | Cuándo usarla |
| :--- | :--- |
| **`pr-plain-review`** | Cuando vas a **revisar o aprobar un PR** y quieres entender rápido en lenguaje llano el impacto real, los archivos críticos tocados y el riesgo |
| [`code-quality-review`](../../practices/code-quality-review/README.md) | Cuando quieres una **auditoría técnica de código** (Clean Code, SOLID, patrones, TDD, frontend/backend) para mejorar la implementación |
| [`gh-cli`](../gh-cli/README.md) | Cuando quieres **crear PRs, depurar GitHub Actions, gestionar issues o publicar releases** |

---

## 📦 Instalación

```bash
# Instalar en el proyecto actual con skills.sh:
npx skills add bryanus1/agent-skills --skill pr-plain-review

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill pr-plain-review -g
```

---

## 💡 Ejemplos de Uso

### 1. Antes de aprobar un PR en GitHub
> *"revisar-pr #88 antes de aprobar"*

Lee título, descripción, checks, comentarios y diff con `gh`, detecta que el PR toca una migración destructiva, una política RLS y la página de términos sin mencionar todo en la descripción, y entrega el informe de riesgo y reversibilidad sin aprobar nada por su cuenta.

### 2. Revisar una rama local antes de fusionar
> *"Resume en lenguaje llano qué cambia esta rama respecto a main y qué riesgo ves"*

Compara la rama contra `main` con `git diff`, traduce el efecto para usuarios/datos/operación y confirma explícitamente si tocó o no archivos críticos.

### 3. Comprobar un diff pegado o PR sensible
> *"¿Qué archivos críticos toca este PR?"*

Cruza el cambio contra las 6 categorías críticas (migraciones, RLS/permisos, legal/términos, auth/secretos, pagos e infra/CI), lee completos los archivos críticos modificados y señala cualquier escenario de fallo con `archivo:línea`.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: instrucciones operativas, flujo paso a paso y reglas críticas de solo lectura.
- **[Catálogo de archivos críticos](references/critical-files.md)**: las 6 categorías sensibles, patrones de rutas, señales de alarma y `CODEOWNERS`.
- **[Plantilla del informe y matriz de riesgo](references/report-template.md)**: formato canónico del brief pre-aprobación y ejemplo completo.
