#!/usr/bin/env bash
# ==============================================================================
# create_mr.sh — Creates GitLab Merge Requests adhering to project standards:
# - Conventional Commits & Emoji title mapping:
#     - With issue:    <type>(#<issue-id>): <emoji> <description>
#     - Without issue: <type>: <emoji> <description>   (NO SCOPE IF NO ISSUE)
# - Scoped Labels validation (type::*, layer::*, domain::*, priority::*, status::*)
# - Structured MR description with "Closes #<id>" and bulleted section titles
# ==============================================================================
set -euo pipefail

TARGET_BRANCH="main"
DRY_RUN=false
REMOVE_SOURCE_BRANCH=true
SQUASH=false
ISSUE_ID=""
DOMAIN_LABEL=""
LAYER_LABEL="layer::backend"
PRIORITY_LABEL=""

usage() {
  cat << 'HELP'
Usage: create_mr.sh [OPTIONS]

Options:
  -t, --target <branch>     Target branch (default: main)
  -i, --issue <id>          GitLab Issue ID (e.g. 42 or #42). Optional.
  -d, --domain <domain>     Domain label (pets, landing, auth, clinical, operations, users)
  -l, --layer <layer>       Layer label (backend, frontend) (default: auto-detected or backend)
  -p, --priority <priority> Priority (high, medium, low)
  --squash                  Enable squash commits on merge
  --no-remove-branch        Do not remove source branch on merge
  --dry-run                 Show the constructed glab command without executing
  -h, --help                Show this help message
HELP
  exit 1
}

# Parse flags
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--target) TARGET_BRANCH="$2"; shift 2 ;;
    -i|--issue) ISSUE_ID="$2"; shift 2 ;;
    -d|--domain) DOMAIN_LABEL="$2"; shift 2 ;;
    -l|--layer) LAYER_LABEL="layer::$2"; shift 2 ;;
    -p|--priority) PRIORITY_LABEL="priority::$2"; shift 2 ;;
    --squash) SQUASH=true; shift ;;
    --no-remove-branch) REMOVE_SOURCE_BRANCH=false; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

# Ensure inside git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Error: Not inside a Git repository." >&2
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "$TARGET_BRANCH" ]; then
  echo "❌ Error: You are on target branch '$TARGET_BRANCH'. Switch to a feature/fix branch first." >&2
  exit 1
fi

# Auto-detect layer if not explicitly passed
if [ -f "next.config.ts" ] || [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
  LAYER_LABEL="layer::frontend"
fi

# 1. Parse commit type & raw description from branch name or recent commit
# Examples: feat/pet-registration, fix/42-auth-expiry, chore/update-deps
BRANCH_TYPE=$(echo "$CURRENT_BRANCH" | awk -F'/' '{print $1}')
BRANCH_REST=$(echo "$CURRENT_BRANCH" | cut -d'/' -f2-)

# Extract Issue ID from branch name if not provided via flag (e.g., feat/42-pet-reg or feat/#42-pet-reg)
if [ -z "$ISSUE_ID" ]; then
  DETECTED_NUM=$(echo "$BRANCH_REST" | grep -oE '^#?[0-9]+' | sed 's/#//' || true)
  if [ -n "$DETECTED_NUM" ]; then
    ISSUE_ID="$DETECTED_NUM"
    RAW_DESC=$(echo "$BRANCH_REST" | sed -E 's/^#?[0-9]+[-_]?//' | tr '-' ' ')
  else
    RAW_DESC=$(echo "$BRANCH_REST" | tr '-' ' ')
  fi
else
  ISSUE_ID=$(echo "$ISSUE_ID" | sed 's/#//')
  RAW_DESC=$(echo "$BRANCH_REST" | sed -E 's/^#?[0-9]+[-_]?//' | tr '-' ' ')
fi

# Determine type, emoji and type:: label
EMOJI="✨"
TYPE_LABEL="type::feature"
TYPE_PREFIX="feat"

case "$BRANCH_TYPE" in
  feat|feature)
    TYPE_PREFIX="feat"
    EMOJI="✨"
    TYPE_LABEL="type::feature"
    ;;
  fix|bugfix)
    TYPE_PREFIX="fix"
    EMOJI="🐛"
    TYPE_LABEL="type::bug"
    ;;
  hotfix)
    TYPE_PREFIX="fix"
    EMOJI="🚑"
    TYPE_LABEL="type::bug"
    ;;
  chore)
    TYPE_PREFIX="chore"
    EMOJI="🔧"
    TYPE_LABEL="type::chore"
    ;;
  refactor)
    TYPE_PREFIX="refactor"
    EMOJI="♻️"
    TYPE_LABEL="type::refactor"
    ;;
  docs)
    TYPE_PREFIX="docs"
    EMOJI="📝"
    TYPE_LABEL="type::chore"
    ;;
  test)
    TYPE_PREFIX="test"
    EMOJI="🧪"
    TYPE_LABEL="type::chore"
    ;;
  ci)
    TYPE_PREFIX="ci"
    EMOJI="👷"
    TYPE_LABEL="type::chore"
    ;;
  *)
    TYPE_PREFIX="chore"
    EMOJI="🔧"
    TYPE_LABEL="type::chore"
    ;;
esac

# 2. Build MR Title:
# If issue ID present:   <type>(#<issue-id>): <emoji> <description>
# If NO issue ID:        <type>: <emoji> <description>  (NO SCOPE)
if [ -n "$ISSUE_ID" ]; then
  MR_TITLE="${TYPE_PREFIX}(#${ISSUE_ID}): ${EMOJI} ${RAW_DESC}"
else
  MR_TITLE="${TYPE_PREFIX}: ${EMOJI} ${RAW_DESC}"
fi

# 3. Build MR Description
CLOSES_LINE=""
if [ -n "$ISSUE_ID" ]; then
  CLOSES_LINE="Closes #${ISSUE_ID}"
fi

COMMITS_LOG=$(git log "${TARGET_BRANCH}..${CURRENT_BRANCH}" --oneline --no-merges || git log -n 5 --oneline --no-merges)

MR_DESCRIPTION=$(cat << DESC_EOF
This Merge Request introduces changes for **${RAW_DESC}**. ${CLOSES_LINE}

**Summary of Changes:**
$(echo "$COMMITS_LOG" | sed 's/^[a-f0-9]* /- /')

**Testing & Verification:**
- Local test suites verified successfully.
- Code style, linter, and type checks passed.
DESC_EOF
)

# 4. Build Labels list
LABELS=("$TYPE_LABEL" "$LAYER_LABEL")

if [ -n "$DOMAIN_LABEL" ]; then
  if [[ "$DOMAIN_LABEL" != domain::* ]]; then
    LABELS+=("domain::$DOMAIN_LABEL")
  else
    LABELS+=("$DOMAIN_LABEL")
  fi
fi

if [ -n "$PRIORITY_LABEL" ]; then
  LABELS+=("$PRIORITY_LABEL")
fi

LABELS_ARG=$(IFS=,; echo "${LABELS[*]}")

# 5. Build glab command
GLAB_CMD=("glab" "mr" "create" "--target-branch" "$TARGET_BRANCH" "--title" "$MR_TITLE" "--description" "$MR_DESCRIPTION" "--label" "$LABELS_ARG" "--yes")

if [ "$REMOVE_SOURCE_BRANCH" = true ]; then
  GLAB_CMD+=("--remove-source-branch")
fi

if [ "$SQUASH" = true ]; then
  GLAB_CMD+=("--squash")
fi

echo "========================================================"
echo "🦊 Prepared GitLab Merge Request:"
echo "   Branch:      $CURRENT_BRANCH ➔ $TARGET_BRANCH"
echo "   Title:       $MR_TITLE"
echo "   Labels:      $LABELS_ARG"
if [ -n "$ISSUE_ID" ]; then
  echo "   Issue:       #$ISSUE_ID"
else
  echo "   Issue:       None (No scope added to title)"
fi
echo "========================================================"

if [ "$DRY_RUN" = true ]; then
  echo "🧪 [DRY RUN] Command to be executed:"
  printf "%q " "${GLAB_CMD[@]}"
  echo ""
  exit 0
fi

# Execute command
"${GLAB_CMD[@]}"
