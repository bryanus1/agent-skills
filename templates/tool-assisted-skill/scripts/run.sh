#!/usr/bin/env bash
set -euo pipefail

# Example helper script for the skill
echo "==> [tool-assisted-skill] Running diagnostic..."
MODE="${1:---check}"

if [ "$MODE" = "--check" ]; then
    echo "✔ Check finished with no issues."
    exit 0
elif [ "$MODE" = "--fix" ]; then
    echo "✔ Fixes applied."
    exit 0
else
    echo "Unknown mode: $MODE. Use --check or --fix" >&2
    exit 1
fi
