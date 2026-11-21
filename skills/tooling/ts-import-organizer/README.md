# 🟦 TS/JS Import Organizer (`ts-import-organizer`)

> **Organizes imports in TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`), always AFTER the code is formatted. Groups them into 4 blocks: `builtins` → `external` → `path aliases` → `side effects`. Sorts lines and members (`{ ... }`) by ascending length, removes unused imports and turns deep relative paths into aliases.**

| Property | Value |
| :--- | :--- |
| **Name** | `ts-import-organizer` |
| **Category** | `tooling` |
| **Version** | `1.2.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Installation

### With the `skills.sh` CLI (recommended)

```bash
# Install into the current project:
npx skills add bryanus1/agent-skills --skill ts-import-organizer

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill ts-import-organizer -g
```

### With a local symlink

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /path/to/agent-skills/skills/tooling/ts-import-organizer .agents/skills/ts-import-organizer

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/ts-import-organizer .claude/skills/ts-import-organizer
```

---

## 💡 Usage Examples with AI Agents

The skill replies in the user's language, so you can ask in English or Spanish.

* **Clean up and sort imports (after formatting)**:
  > *"Organize the imports in `Dashboard.tsx`, remove the unused ones and replace the `../../../` relative paths with `@/`"*
  >
  > 🤖 **The agent will**:
  > 1. Format the code first (syntax and file body settled before anything else).
  > 2. Clean up the imports: remove unused ones, merge duplicates and convert relative paths of 2+ levels (`../../`) to `@/`.
  > 3. Use `import type` for pure TypeScript interfaces and types.
  > 4. Group into 4 blocks: `builtins` (`node:*`) ➔ `external` (`node_modules`) ➔ `@/ aliases and one-level relative paths` ➔ `side effects`.
  > 5. Order within each group: multi-line imports first, then single-line ones, with every member (`{ ... }`) sorted by ascending length.

---

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: Full operating spec, grouping rules and length-based ordering.
- **[Transformation examples](examples/transformations.md)**: Before/after cases in TypeScript and React.
