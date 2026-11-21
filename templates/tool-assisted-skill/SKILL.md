---
name: tool-assisted-skill-template
version: 1.1.0
description: >-
  Advanced template for skills that combine step-by-step instructions with executable scripts and supporting documentation.
tags: [tools, scripts, template]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - tool assisted
  - ejecutar script
requirements:
  tools: [run_command, view_file, replace_file_content]
  bins: [bash]
---

# Tool-Assisted Skill

## 🎯 Purpose
Describe the automated workflow, which combines the model's reasoning with deterministic script runs.

## ⚡ When to Trigger
- When the task needs automatic diagnostics, validations or transformations through the bundled scripts.

## 📋 Workflow

1. **Step 1: Diagnose and prepare**:
   - Run the initial diagnostic script:
     ```bash
     bash <skill-dir>/scripts/run.sh --check
     ```
2. **Step 2: Apply the workflow**:
   - Read the [Technical Guide](references/guide.md) for details on the architecture or the more complex rules.
3. **Step 3: Final validation**:
   - Run the check script again and confirm it succeeds.

## 🛠️ Helper Scripts

> **Paths:** `<skill-dir>` is the directory that holds this `SKILL.md` (e.g. `.claude/skills/<name>/` or `.agents/skills/<name>/`). Run the scripts from the root of the user's project, not from `<skill-dir>`.

* `scripts/run.sh`: Main automation and validation script.
  * Options: `--check` (diagnose only), `--fix` (apply automatic fixes).

## ⚠️ Critical Rules
- Reply in the user's language, even though this skill is written in English.
- Always run `--check` before `--fix` and review its output.
- Do not run `--fix` or overwrite files without the user's explicit confirmation.

## 📚 References and Examples
* [Technical Guide](references/guide.md)
* [Input/Output Examples](examples/sample.md)
