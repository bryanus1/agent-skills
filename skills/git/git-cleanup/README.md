# 🧹 Local Git Branch Cleanup and Hygiene (`git-cleanup`)

> **Safely cleans up local Git branches after PRs are merged (squash or merge). Protects the main branches (`main`/`master`/`develop`), detects branches deleted on `origin` and removes stale branches without the false negatives of `git branch --merged`.**

| Property | Value |
| :--- | :--- |
| **Name** | `git-cleanup` |
| **Category** | `git` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | `git`, `bash` |

---

## 📦 Installation

### With the `skills.sh` CLI (recommended)

```bash
# Install into the current project:
npx skills add bryanus1/agent-skills --skill git-cleanup

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill git-cleanup -g
```

### With a local symlink

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /path/to/agent-skills/skills/git/git-cleanup .agents/skills/git-cleanup

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/git-cleanup .claude/skills/git-cleanup
```

---

## 💡 Usage Examples with AI Agents

The skill replies in the user's language, so you can ask in English or Spanish.

* **Clean up after merging a PR**:
  > *"I just merged my PR on GitHub, update main and clean up the local branches"*
  >
  > 🤖 **The agent runs**: `git switch main && git pull && git-cleanup` (or the native procedure with `git fetch --prune` if `git-cleanup` is not installed)  
  > ➔ Updates from `origin`, prunes stale refs (`fetch --prune`), protects `main`/`master`/`develop` and safely deletes the local branches that no longer exist on the remote.

* **Protect extra branches permanently**:
  > *"Set up git-cleanup so it never deletes the release/v2 branch"*
  >
  > 🤖 **The agent runs**: `git config --add cleanup.protected release/v2`

---

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: Full operating spec, CLI mode and standalone native fallback.
- **[Branch Hygiene and Squash Merge Guide](references/branch_hygiene.md)**: The squash-merge problem and the difference between `git branch -d` and `git branch -D`.
