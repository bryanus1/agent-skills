#!/usr/bin/env bash
# ==============================================================================
# check_env.sh — Validates prerequisites for GitLab CLI (glab) workflow
# ==============================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED_ERR='\033[0;31m'
NC='\033[0m'

echo "🔍 Checking GitLab CLI environment & configuration..."

ERRORS=0

# 1. Check Git
if command -v git >/dev/null 2>&1; then
  GIT_VER=$(git --version)
  echo -e "  ✅ Git installed: ${GREEN}${GIT_VER}${NC}"
else
  echo -e "  ❌ ${RED_ERR}Git is not installed or not in PATH.${NC}"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check glab CLI
if command -v glab >/dev/null 2>&1; then
  GLAB_VER=$(glab --version | head -n 1)
  echo -e "  ✅ glab installed: ${GREEN}${GLAB_VER}${NC}"
else
  echo -e "  ❌ ${RED_ERR}glab CLI is not installed. Install via 'brew install glab' or official package.${NC}"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check inside Git repo
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_ROOT=$(git rev-parse --show-toplevel)
  CURRENT_BRANCH=$(git branch --show-current)
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "no-remote")
  echo -e "  ✅ Inside Git Repository: ${GREEN}${REPO_ROOT}${NC}"
  echo -e "     Current Branch: ${YELLOW}${CURRENT_BRANCH}${NC}"
  echo -e "     Origin URL: ${YELLOW}${REMOTE_URL}${NC}"
else
  echo -e "  ⚠️  ${YELLOW}Not currently inside a Git repository.${NC}"
fi

# 4. Check glab authentication
if command -v glab >/dev/null 2>&1; then
  if glab auth status >/dev/null 2>&1; then
    echo -e "  ✅ GitLab Authentication: ${GREEN}Active & Authenticated${NC}"
    glab auth status 2>&1 | grep -E "Logged in to|Active account:" | sed 's/^/     /' || true
  else
    echo -e "  ❌ ${RED_ERR}GitLab Authentication failed. Run 'glab auth login' or export GITLAB_TOKEN.${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi

echo "--------------------------------------------------------"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "✨ ${GREEN}All prerequisites satisfied! Ready to use glab-cli workflows.${NC}"
  exit 0
else
  echo -e "❌ ${RED_ERR}Found $ERRORS issue(s). Please resolve before proceeding.${NC}"
  exit 1
fi
