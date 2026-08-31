#!/usr/bin/env bash
# ==============================================================================
# diagnose_pipeline.sh — Inspects GitLab CI pipeline, identifies failed jobs,
# and extracts relevant traces (ESLint, Jest, SWC, Build) for fast troubleshooting.
# ==============================================================================
set -euo pipefail

LINES_TO_SHOW=60
JOB_NAME=""

usage() {
  cat << 'HELP'
Usage: diagnose_pipeline.sh [OPTIONS]

Options:
  -j, --job <name>    Inspect logs for a specific job name (e.g., lint, test:unit, build:app)
  -n, --lines <num>   Number of log lines to show (default: 60)
  -h, --help          Show this help message
HELP
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -j|--job) JOB_NAME="$2"; shift 2 ;;
    -n|--lines) LINES_TO_SHOW="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

if ! command -v glab >/dev/null 2>&1; then
  echo "❌ Error: glab CLI is not installed or not in PATH." >&2
  exit 1
fi

echo "🔍 Checking pipeline status for current branch..."
glab ci status || true

echo ""
echo "📊 Fetching pipeline view..."
glab ci view || true

if [ -n "$JOB_NAME" ]; then
  echo ""
  echo "📜 Inspecting trace for job: $JOB_NAME (last $LINES_TO_SHOW lines)..."
  glab ci trace "$JOB_NAME" | tail -n "$LINES_TO_SHOW" || true
else
  echo ""
  echo "💡 Tip: To inspect a failed job log in detail, run:"
  echo "   ./scripts/diagnose_pipeline.sh -j <job_name>"
  echo "   glab ci trace <job_name>"
fi
