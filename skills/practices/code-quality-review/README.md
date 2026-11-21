# 🔎 Code Quality Review (`code-quality-review`)

> **Quality review of a change (branch, PR or paths) that orchestrates the `practices` skills: it sets the scope, picks the lenses that fit what changed and delivers a single prioritized, deduplicated report. Read-only by default.**

| Property | Value |
| :--- | :--- |
| **Name** | `code-quality-review` |
| **Category** | `practices` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requires skills** | `clean-code`, `solid-principles`, `design-patterns`, `tdd-workflow`, `frontend-best-practices`, `backend-best-practices` |

---

## 📦 Installation

```bash
# Install the skill and the lenses it uses:
npx skills add bryanus1/agent-skills --skill code-quality-review
npx skills add bryanus1/agent-skills --skill clean-code
npx skills add bryanus1/agent-skills --skill solid-principles
npx skills add bryanus1/agent-skills --skill design-patterns
npx skills add bryanus1/agent-skills --skill tdd-workflow
npx skills add bryanus1/agent-skills --skill frontend-best-practices
npx skills add bryanus1/agent-skills --skill backend-best-practices
```

If a lens is missing, the review continues with the rest and says so in the report.

---

## 💡 Usage Examples with AI Agents

* **Before opening a PR**:
  > *"Review my branch before I open the PR."*
  >
  > 🤖 Classifies the changed files, runs the tests and `detect-smells`, applies only the relevant lenses and returns a report with a verdict, prioritized findings (no duplicates across lenses) and a fix plan.

* **Reviewing specific paths**:
  > *"Do a quality review of `src/orders`."*

* **A trivial change**:
  > *"Review this copy change."*
  >
  > 🤖 Reports "no relevant findings" instead of triggering every lens.

---

## 🧭 How It Works

1. **Scope**: `scripts/collect-scope.mjs` (read-only) lists and classifies the changed files.
2. **Lenses**: picks only the ones the change justifies ([lens-routing](references/lens-routing.md)).
3. **Evidence**: runs the project's real tests, typecheck and lint.
4. **Diagnosis**: applies each sibling skill without modifying anything.
5. **Report**: merges, deduplicates and prioritizes ([severity-and-report](references/severity-and-report.md)).

## 🚫 What It Does NOT Do

- It does not modify code, commit or push: it proposes a plan and asks.
- It is not for a single aspect (SOLID, security…): the specific skills cover that.
- It does not review what did not change (pre-existing problems go under "Out of scope").

---

## 📁 Structure

```
code-quality-review/
├── SKILL.md
├── README.md
├── scripts/collect-scope.mjs
├── references/
├── examples/review-orders-branch.md
└── evals/            # evals.json + fixtures
```
