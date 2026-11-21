# 🔍 PR Plain Review (`pr-plain-review`)

> **Plain-language review before approving a Pull Request or branch: sums up what changed, why, which critical files it touched (migrations, RLS, legal terms, auth, payments, infra) and what real risk you take on before clicking *Approve*.**

| Property | Value |
| :--- | :--- |
| **Name** | `pr-plain-review` |
| **Category** | `git` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | Read/shell tools (`git`; optionally `gh` or `glab` for PRs/MRs) |

---

## 🎯 How It Differs from Other Skills in the Catalog

| Skill | When to use it |
| :--- | :--- |
| **`pr-plain-review`** | When you are about to **review or approve a PR** and want a quick plain-language view of the real impact, the critical files touched and the risk |
| [`code-quality-review`](../../practices/code-quality-review/README.md) | When you want a **technical code audit** (Clean Code, SOLID, patterns, TDD, frontend/backend) to improve the implementation |
| [`gh-cli`](../gh-cli/README.md) | When you want to **create PRs, debug GitHub Actions, manage issues or publish releases** |

---

## 📦 Installation

```bash
# Install into the current project with skills.sh:
npx skills add bryanus1/agent-skills --skill pr-plain-review

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill pr-plain-review -g
```

---

## 💡 Usage Examples

The skill replies in the user's language, so you can ask in English or Spanish.

### 1. Before approving a GitHub PR
> *"revisar-pr #88 before I approve it"*

Reads the title, description, checks, comments and diff with `gh`, finds that the PR touches a destructive migration, an RLS policy and the terms page without mentioning all of it in the description, and delivers the risk and reversibility report without approving anything on its own.

### 2. Review a local branch before merging
> *"Sum up in plain language what this branch changes compared to main and what risk you see"*

Compares the branch against `main` with `git diff`, translates the effect for users/data/operations and states explicitly whether it touched critical files.

### 3. Check a pasted diff or a sensitive PR
> *"Which critical files does this PR touch?"*

Checks the change against the 6 critical categories (migrations, RLS/permissions, legal/terms, auth/secrets, payments and infra/CI), reads the modified critical files in full and points out any failure scenario with `file:line`.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: operating instructions, step-by-step workflow and read-only critical rules.
- **[Critical files catalog](references/critical-files.md)**: the 6 sensitive categories, path patterns, red flags and `CODEOWNERS`.
- **[Report template and risk matrix](references/report-template.md)**: canonical pre-approval brief format and a full example.
