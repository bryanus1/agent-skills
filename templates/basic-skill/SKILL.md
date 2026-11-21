---
name: basic-skill-template
version: 1.1.0
description: >-
  Short summary (max 350 characters) of what the skill does and when to use it.
  Include keywords that help the AI agent decide when to activate it.
tags: [workflow, template]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - trigger keyword 1
  - palabra clave en español
requirements:
  tools: [view_file, replace_file_content]
---

# Skill Name

## 🎯 Purpose
Briefly describe the specific problem this skill solves and the expected end result.

## ⚡ When to Trigger
- When the user asks to...
- When the pattern or problem ... is detected.

## 📋 Workflow

1. **Step 1: Analyze and inspect**:
   - Inspect the relevant files with the read tools.
2. **Step 2: Plan**:
   - Design the solution within the project's constraints.
3. **Step 3: Execute**:
   - Apply the changes or generate the code.
4. **Step 4: Verify**:
   - Check that the changes build and the relevant tests pass.

## ⚠️ Critical Rules
- Reply in the user's language, even though this skill is written in English.
- Keep the existing code style consistent.
- Do not add dependencies the user has not approved.
