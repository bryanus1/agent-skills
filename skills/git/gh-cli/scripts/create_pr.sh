#!/usr/bin/env bash
# ==============================================================================
# create_pr.sh — Creates GitHub Pull Requests adhering to project standards:
# - Conventional Commits & Emoji title mapping:
#     - With issue:    <type>(#<issue-id>): <emoji> <description>
#     - Without issue: <type>: <emoji> <description>   (NO SCOPE IF NO ISSUE)
# - Labels: type label mapped to GitHub's defaults + optional "domain: <name>",
#   verified to exist in the repository (labels are never created here)
# - Body with "Closes #<id>", commit summary and the repo's PR template if any
# ==============================================================================
set -euo pipefail

BASE_BRANCH=""
DRY_RUN=false
DRAFT=false
PUSH=false
ASSIGN_ME=false
ISSUE_ID=""
DOMAIN=""
DOMAINS_FILE=""
REVIEWERS=()
EXTRA_LABELS=()

usage() {
  cat << 'HELP'
Usage: create_pr.sh [OPTIONS]

Options:
  -b, --base <branch>         Base branch (default: origin's default branch, else main)
  -i, --issue <id>            GitHub issue number (e.g. 42 or #42). Optional; detected
                              from branch names like feat/42-login
  -d, --domain <domain>       Adds the label "domain: <domain>" (kebab-case). If a domains
                              file exists, the value must be listed in it
  --domains-file <path>       Allowed domains, one per line (default: .gh-domains at the
                              repository root; if absent, any kebab-case domain is accepted)
  -l, --label <name>          Extra label (repeatable). Must already exist in the repo
  -r, --reviewer <handle>     Request a review from a user or org/team (repeatable)
  --assign-me                 Assign the PR to yourself
  --draft                     Open the PR as a draft
  --push                      Push the branch to origin (git push -u origin HEAD) if it
                              has no upstream yet. Never force-pushes
  --dry-run                   Print the PR and the gh command without calling GitHub
  -h, --help                  Show this help message
HELP
  exit "${1:-1}"
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -b|--base) BASE_BRANCH="$2"; shift 2 ;;
    -i|--issue) ISSUE_ID="$2"; shift 2 ;;
    -d|--domain) DOMAIN="$2"; shift 2 ;;
    --domains-file) DOMAINS_FILE="$2"; shift 2 ;;
    -l|--label) EXTRA_LABELS+=("$2"); shift 2 ;;
    -r|--reviewer) REVIEWERS+=("$2"); shift 2 ;;
    --assign-me) ASSIGN_ME=true; shift ;;
    --draft) DRAFT=true; shift ;;
    --push) PUSH=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Error: Not inside a Git repository." >&2
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git branch --show-current)

if [ -z "$CURRENT_BRANCH" ]; then
  echo "❌ Error: Detached HEAD. Check out a branch first." >&2
  exit 1
fi

if [ -z "$BASE_BRANCH" ]; then
  DEFAULT_REF=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)
  BASE_BRANCH="${DEFAULT_REF#origin/}"
  BASE_BRANCH="${BASE_BRANCH:-main}"
fi

if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
  echo "❌ Error: You are on base branch '$BASE_BRANCH'. Switch to a feature/fix branch first." >&2
  exit 1
fi

# Compare against the remote base when it is known locally, else the local branch
if git rev-parse --verify --quiet "refs/remotes/origin/${BASE_BRANCH}" >/dev/null; then
  BASE_REF="origin/${BASE_BRANCH}"
else
  BASE_REF="$BASE_BRANCH"
fi

# 1. Parse commit type & description from the branch name (feat/42-login-form)
BRANCH_TYPE="${CURRENT_BRANCH%%/*}"
if [[ "$CURRENT_BRANCH" == */* ]]; then
  BRANCH_REST="${CURRENT_BRANCH#*/}"
else
  BRANCH_TYPE=""
  BRANCH_REST="$CURRENT_BRANCH"
fi

if [ -z "$ISSUE_ID" ]; then
  ISSUE_ID=$(echo "$BRANCH_REST" | grep -oE '^#?[0-9]+' | tr -d '#' || true)
else
  ISSUE_ID="${ISSUE_ID#\#}"
fi
if [ -n "$ISSUE_ID" ] && ! [[ "$ISSUE_ID" =~ ^[0-9]+$ ]]; then
  echo "❌ Error: Issue '$ISSUE_ID' must be a number." >&2
  exit 1
fi
RAW_DESC=$(echo "$BRANCH_REST" | sed -E 's/^#?[0-9]+[-_]?//' | tr '_-' '  ')

# 2. Type, emoji and GitHub's default type label (empty when there is no match)
case "$BRANCH_TYPE" in
  feat|feature) TYPE_PREFIX="feat";     EMOJI="✨"; TYPE_LABEL="enhancement" ;;
  fix|bugfix)   TYPE_PREFIX="fix";      EMOJI="🐛"; TYPE_LABEL="bug" ;;
  hotfix)       TYPE_PREFIX="fix";      EMOJI="🚑"; TYPE_LABEL="bug" ;;
  perf)         TYPE_PREFIX="perf";     EMOJI="⚡"; TYPE_LABEL="enhancement" ;;
  refactor)     TYPE_PREFIX="refactor"; EMOJI="♻️"; TYPE_LABEL="" ;;
  docs)         TYPE_PREFIX="docs";     EMOJI="📝"; TYPE_LABEL="documentation" ;;
  test)         TYPE_PREFIX="test";     EMOJI="🧪"; TYPE_LABEL="" ;;
  ci)           TYPE_PREFIX="ci";       EMOJI="👷"; TYPE_LABEL="" ;;
  *)            TYPE_PREFIX="chore";    EMOJI="🔧"; TYPE_LABEL="" ;;
esac

# 3. Validate the domain against the project's allowed domains, if configured
DOMAIN_LABEL=""
if [ -n "$DOMAIN" ]; then
  DOMAIN="${DOMAIN#domain: }"
  if ! [[ "$DOMAIN" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    echo "❌ Error: Domain '$DOMAIN' must be kebab-case (e.g. auth, user-profile)." >&2
    exit 1
  fi
  if [ -z "$DOMAINS_FILE" ]; then
    DOMAINS_FILE="$REPO_ROOT/.gh-domains"
  elif [ ! -f "$DOMAINS_FILE" ]; then
    echo "❌ Error: Domains file '$DOMAINS_FILE' not found." >&2
    exit 1
  fi
  if [ -f "$DOMAINS_FILE" ]; then
    ALLOWED_DOMAINS=$(sed -e 's/#.*//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' "$DOMAINS_FILE" | grep -v '^$' || true)
    if ! grep -qxF "$DOMAIN" <<< "$ALLOWED_DOMAINS"; then
      echo "❌ Error: Domain '$DOMAIN' is not listed in $DOMAINS_FILE." >&2
      echo "   Allowed domains: $(echo "$ALLOWED_DOMAINS" | paste -sd ',' - | sed 's/,/, /g')" >&2
      exit 1
    fi
  fi
  DOMAIN_LABEL="domain: $DOMAIN"
fi

LABELS=()
[ -n "$TYPE_LABEL" ] && LABELS+=("$TYPE_LABEL")
[ -n "$DOMAIN_LABEL" ] && LABELS+=("$DOMAIN_LABEL")
LABELS+=("${EXTRA_LABELS[@]+"${EXTRA_LABELS[@]}"}")

# 4. Title and body
if [ -n "$ISSUE_ID" ]; then
  PR_TITLE="${TYPE_PREFIX}(#${ISSUE_ID}): ${EMOJI} ${RAW_DESC}"
else
  PR_TITLE="${TYPE_PREFIX}: ${EMOJI} ${RAW_DESC}"
fi

COMMITS_LOG=$(git log "${BASE_REF}..HEAD" --pretty='- %s' --no-merges 2>/dev/null || true)
if [ -z "$COMMITS_LOG" ]; then
  echo "❌ Error: No commits on '$CURRENT_BRANCH' ahead of '$BASE_REF'." >&2
  exit 1
fi

PR_BODY="This Pull Request introduces changes for **${RAW_DESC}**."
if [ -n "$ISSUE_ID" ]; then
  PR_BODY+=$'\n\n'"Closes #${ISSUE_ID}"
fi
PR_BODY+=$'\n\n'"**Summary of Changes:**"$'\n'"${COMMITS_LOG}"

TEMPLATE=""
for candidate in .github/pull_request_template.md .github/PULL_REQUEST_TEMPLATE.md docs/pull_request_template.md pull_request_template.md; do
  if [ -f "$REPO_ROOT/$candidate" ]; then
    TEMPLATE="$candidate"
    break
  fi
done
if [ -n "$TEMPLATE" ]; then
  PR_BODY+=$'\n\n'"$(cat "$REPO_ROOT/$TEMPLATE")"
else
  PR_BODY+=$'\n\n'"**Testing & Verification:**"$'\n'"- [ ] Tests pass locally"$'\n'"- [ ] Linter and type checks pass"
fi

# 5. Build the gh command
GH_CMD=(gh pr create --base "$BASE_BRANCH" --head "$CURRENT_BRANCH" --title "$PR_TITLE" --body "$PR_BODY")
for label in "${LABELS[@]+"${LABELS[@]}"}"; do GH_CMD+=(--label "$label"); done
for reviewer in "${REVIEWERS[@]+"${REVIEWERS[@]}"}"; do GH_CMD+=(--reviewer "$reviewer"); done
[ "$ASSIGN_ME" = true ] && GH_CMD+=(--assignee "@me")
[ "$DRAFT" = true ] && GH_CMD+=(--draft)

LABELS_TEXT=$(printf '%s, ' "${LABELS[@]+"${LABELS[@]}"}" | sed 's/, $//')
HAS_UPSTREAM=true
git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1 || HAS_UPSTREAM=false

echo "========================================================"
echo "🐙 Prepared GitHub Pull Request:"
echo "   Branch:      $CURRENT_BRANCH ➔ $BASE_BRANCH"
echo "   Title:       $PR_TITLE"
echo "   Labels:      ${LABELS_TEXT:-none}"
if [ -n "$ISSUE_ID" ]; then
  echo "   Issue:       #$ISSUE_ID (Closes #$ISSUE_ID)"
else
  echo "   Issue:       None (No scope added to title)"
fi
echo "   Draft:       $DRAFT"
echo "   Template:    ${TEMPLATE:-none}"
echo "   Upstream:    $([ "$HAS_UPSTREAM" = true ] && echo "yes" || echo "no (use --push to publish the branch)")"
echo "========================================================"

if [ "$DRY_RUN" = true ]; then
  echo "🧪 [DRY RUN] Labels were not checked against GitHub. Command to be executed:"
  printf "%q " "${GH_CMD[@]}"
  echo ""
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ Error: gh CLI is not installed or not in PATH." >&2
  exit 1
fi

# 6. Refuse duplicates and missing labels before touching anything
if EXISTING_URL=$(gh pr view "$CURRENT_BRANCH" --json url,state --jq 'select(.state == "OPEN") | .url' 2>/dev/null) && [ -n "$EXISTING_URL" ]; then
  echo "❌ Error: An open PR already exists for '$CURRENT_BRANCH': $EXISTING_URL" >&2
  exit 1
fi

if [ "${#LABELS[@]}" -gt 0 ]; then
  REPO_LABELS=$(gh label list --limit 1000 --json name --jq '.[].name')
  MISSING=()
  for label in "${LABELS[@]}"; do
    grep -qxF "$label" <<< "$REPO_LABELS" || MISSING+=("$label")
  done
  if [ "${#MISSING[@]}" -gt 0 ]; then
    echo "❌ Error: These labels do not exist in the repository: ${MISSING[*]}" >&2
    echo "   Ask a maintainer to create them (gh label create \"<name>\") or drop them." >&2
    exit 1
  fi
fi

if [ "$HAS_UPSTREAM" = false ]; then
  if [ "$PUSH" = true ]; then
    echo "⬆️  Pushing '$CURRENT_BRANCH' to origin..."
    git push -u origin HEAD
  else
    echo "❌ Error: '$CURRENT_BRANCH' has no upstream. Push it first (git push -u origin HEAD) or re-run with --push." >&2
    exit 1
  fi
fi

"${GH_CMD[@]}"
