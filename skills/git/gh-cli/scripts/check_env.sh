#!/usr/bin/env bash
# ==============================================================================
# check_env.sh — Validates prerequisites for the GitHub CLI (gh) workflow
# ==============================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED_ERR='\033[0;31m'
NC='\033[0m'

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: check_env.sh"
  echo "Checks git, gh, the current repository and gh authentication. Exits 1 on problems."
  exit 0
fi

echo "🔍 Checking GitHub CLI environment & configuration..."

ERRORS=0

# 1. Check Git
if command -v git >/dev/null 2>&1; then
  echo -e "  ✅ Git installed: ${GREEN}$(git --version)${NC}"
else
  echo -e "  ❌ ${RED_ERR}Git is not installed or not in PATH.${NC}"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check gh CLI
if command -v gh >/dev/null 2>&1; then
  echo -e "  ✅ gh installed: ${GREEN}$(gh --version | head -n 1)${NC}"
else
  echo -e "  ❌ ${RED_ERR}gh CLI is not installed. Install via 'brew install gh' or https://cli.github.com.${NC}"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check inside Git repo
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo -e "  ✅ Inside Git Repository: ${GREEN}$(git rev-parse --show-toplevel)${NC}"
  echo -e "     Current Branch: ${YELLOW}$(git branch --show-current)${NC}"
  echo -e "     Origin URL: ${YELLOW}$(git remote get-url origin 2>/dev/null || echo "no-remote")${NC}"
else
  echo -e "  ⚠️  ${YELLOW}Not currently inside a Git repository.${NC}"
fi

# 4. Check gh authentication and the GitHub repository behind origin
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    echo -e "  ✅ GitHub Authentication: ${GREEN}Active & Authenticated${NC}"
    gh auth status 2>&1 | grep -E "Logged in to|Active account|Token scopes" | sed 's/^ */     /' || true

    if REPO_INFO=$(gh repo view --json nameWithOwner,defaultBranchRef --jq '.nameWithOwner + " (default branch: " + .defaultBranchRef.name + ")"' 2>/dev/null); then
      echo -e "  ✅ GitHub Repository: ${GREEN}${REPO_INFO}${NC}"
    else
      echo -e "  ⚠️  ${YELLOW}origin is not a GitHub repository gh can access.${NC}"
    fi
  else
    echo -e "  ❌ ${RED_ERR}GitHub Authentication failed. Run 'gh auth login' or export GH_TOKEN.${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi

echo "--------------------------------------------------------"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "✨ ${GREEN}All prerequisites satisfied! Ready to use gh-cli workflows.${NC}"
  exit 0
else
  echo -e "❌ ${RED_ERR}Found $ERRORS issue(s). Please resolve before proceeding.${NC}"
  exit 1
fi
