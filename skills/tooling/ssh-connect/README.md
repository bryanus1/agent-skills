# 🖥️ Connecting to and Operating Remote Servers (`ssh-connect`)

> **Manages, connects to and runs commands on SSH servers with `ssh-connect`. Supports `.pem` keys with locked-down permissions (`chmod 600`), automated passwords (Keychain) and persistent multiplexing (`ControlMaster`) with no TTY hangs.**

| Property | Value |
| :--- | :--- |
| **Name** | `ssh-connect` |
| **Category** | `tooling` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | `ssh-connect`, `ssh`, `bash` |

---

## 📦 Installation

### With the `skills.sh` CLI (recommended)

```bash
# Install into the current project:
npx skills add bryanus1/agent-skills --skill ssh-connect

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill ssh-connect -g
```

### With a local symlink

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /path/to/agent-skills/skills/tooling/ssh-connect .agents/skills/ssh-connect

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/ssh-connect .claude/skills/ssh-connect
```

---

## 💡 Usage Examples with AI Agents

The skill replies in the user's language, so you can ask in English or Spanish.

* **Diagnose a server without blocking the TTY**:
  > *"Connect to the prod-api server and tell me its disk and memory usage"*
  >
  > 🤖 **The agent runs**: `ssh-connect --exec prod-api "df -h && free -m"`  
  > ➔ No interactive prompts: it checks the `.pem` key permissions or Keychain credentials and reuses the `ControlMaster` socket for instant runs.

* **Download remote logs**:
  > *"Download the Nginx error logs from prod-api to my machine"*
  >
  > 🤖 **The agent runs**: `ssh-connect --download prod-api /var/log/nginx/error.log ./logs/`

* **Register a new server with a `.pem` key**:
  > *"Register the prod-api server with IP 54.123.45.67, user ubuntu and the key ~/.ssh/aws.pem"*
  >
  > 🤖 **The agent runs**: `ssh-connect --add --alias prod-api --host 54.123.45.67 --user ubuntu --port 22 --type pem --key ~/.ssh/aws.pem`

---

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: Full operating spec, the 6-step workflow and the critical rules for safe, non-interactive use.
- **[Remote Commands and Diagnostics Cheat Sheet](references/commands_cheatsheet.md)**: Diagnostic recipes for Docker, systemd, databases and network.
