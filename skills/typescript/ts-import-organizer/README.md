# 🟦 TS/JS Import Organizer (`ts-import-organizer`)

> **Organiza imports en TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`). Se aplica siempre DESPUÉS de formatear el código. Agrupa en 4 bloques: `builtins` → `externos` → `path aliases` → `side-effects`. Ordena líneas y miembros (`{ ... }`) por longitud ascendente, elimina unused y convierte rutas relativas profundas a aliases.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `ts-import-organizer` |
| **Categoría** | `typescript` |
| **Versión** | `1.1.1` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill ts-import-organizer

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill ts-import-organizer -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/typescript/ts-import-organizer .agents/skills/ts-import-organizer

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/ts-import-organizer .claude/skills/ts-import-organizer
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Limpiar y ordenar imports (Post-formateo)**:
  > *"Organiza los imports de este archivo `Dashboard.tsx`, elimina los que no use y cambia las rutas relativas `../../../` por `@/`"*
  >
  > 🤖 **El agente aplicará**:
  > 1. Formateo previo del código (sintaxis y cuerpo del archivo asegurados primero).
  > 2. Depuración de imports: elimina unused, consolida duplicados y convierte rutas relativas de 2+ niveles (`../../`) a `@/`.
  > 3. Conversión a `import type` para interfaces y tipos puros de TypeScript.
  > 4. Agrupación en 4 bloques: `builtins` (`node:*`) ➔ `externos` (`node_modules`) ➔ `@/ aliases y relativos de 1 nivel` ➔ `side-effects`.
  > 5. Jerarquía dentro del grupo: imports multilínea primero y monolíneas después, con todos los miembros internos (`{ ... }`) ordenados por longitud ascendente.

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, reglas de agrupación y ordenamiento por longitud.
- **[Ejemplos de Transformación](examples/transformations.md)**: Casos prácticos de antes y después en TypeScript y React.
