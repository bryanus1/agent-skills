# 🛠️ Tool-Assisted Skill Template

> **Advanced template for skills that combine step-by-step instructions with executable scripts (`scripts/`), technical references (`references/`) and examples (`examples/`).**

| Property | Value |
| :--- | :--- |
| **Name** | `tool-assisted-skill-template` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | `bash` |

---

## 📦 Installation

```bash
# Install into the current project with skills.sh:
npx skills add bryanus1/agent-skills --skill <your-skill-name>

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill <your-skill-name> -g
```

---

## 💡 Usage Examples with AI Agents

* **Diagnose without changing files**:
  > *"Run the `<your-skill-name>` diagnostic in read-only mode"*
  >
  > 🤖 **The agent runs**: `bash <skill-dir>/scripts/run.sh --check`

---

## 🛠️ Scripts and CLI Options

- **[`scripts/run.sh`](scripts/run.sh)**: Main automation script (`--check` to diagnose, `--fix` to apply fixes).

---

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: Operating instructions and critical rules for the AI agent.
- **[Technical Guide](references/guide.md)**: Detailed reference documentation.
- **[Input/Output Examples](examples/sample.md)**: Example use cases.
