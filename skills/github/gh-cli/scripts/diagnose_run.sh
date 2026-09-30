#!/usr/bin/env bash
# ==============================================================================
# diagnose_run.sh — Inspects GitHub Actions runs for the current branch (or a PR),
# finds the latest failed run and prints only the failing jobs' logs.
# ==============================================================================
set -euo pipefail

LINES_TO_SHOW=80
RUN_ID=""
JOB_NAME=""
BRANCH=""
PR_NUMBER=""

usage() {
  cat << 'HELP'
Usage: diagnose_run.sh [OPTIONS]

Options:
  -r, --run <id>        Inspect a specific run (default: latest failed run of the branch)
  -j, --job <name>      Only show failed log lines of this job (e.g. lint, test)
  -b, --branch <name>   Branch to inspect (default: current branch)
  -p, --pr <number>     Show the check status of a pull request first
  -n, --lines <num>     Number of log lines to show (default: 80)
  -h, --help            Show this help message
HELP
  exit "${1:-1}"
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -r|--run) RUN_ID="$2"; shift 2 ;;
    -j|--job) JOB_NAME="$2"; shift 2 ;;
    -b|--branch) BRANCH="$2"; shift 2 ;;
    -p|--pr) PR_NUMBER="${2#\#}"; shift 2 ;;
    -n|--lines) LINES_TO_SHOW="$2"; shift 2 ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

if ! [[ "$LINES_TO_SHOW" =~ ^[0-9]+$ ]]; then
  echo "❌ Error: --lines must be a positive number." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ Error: gh CLI is not installed or not in PATH." >&2
  exit 1
fi

if [ -n "$PR_NUMBER" ]; then
  echo "🔍 Checks for PR #$PR_NUMBER:"
  gh pr checks "$PR_NUMBER" || true
  echo ""
  if [ -z "$BRANCH" ]; then
    BRANCH=$(gh pr view "$PR_NUMBER" --json headRefName --jq '.headRefName')
  fi
fi

if [ -z "$BRANCH" ]; then
  BRANCH=$(git branch --show-current)
fi

if [ -z "$RUN_ID" ]; then
  RUN_ID=$(gh run list --branch "$BRANCH" --status failure --limit 1 --json databaseId --jq '.[0].databaseId // empty')
  if [ -z "$RUN_ID" ]; then
    echo "✅ No failed workflow runs found for branch '$BRANCH'. Recent runs:"
    gh run list --branch "$BRANCH" --limit 5
    exit 0
  fi
fi

echo "📊 Run $RUN_ID summary:"
gh run view "$RUN_ID"

echo ""
if [ -n "$JOB_NAME" ]; then
  echo "📜 Failed log lines for job '$JOB_NAME' (last $LINES_TO_SHOW lines):"
  # --log-failed prints "<job>\t<step>\t<line>"; keep only the requested job.
  gh run view "$RUN_ID" --log-failed | awk -F'\t' -v job="$JOB_NAME" '$1 == job' | tail -n "$LINES_TO_SHOW"
else
  echo "📜 Failed log lines (last $LINES_TO_SHOW lines):"
  gh run view "$RUN_ID" --log-failed | tail -n "$LINES_TO_SHOW"
  echo ""
  echo "💡 Tip: filter by job with --job <name>, or rerun only failed jobs with:"
  echo "   gh run rerun $RUN_ID --failed"
fi
