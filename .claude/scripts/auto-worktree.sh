#!/usr/bin/env bash
# PostToolUse hook (ExitPlanMode): create a dedicated branch + worktree so a
# parallel CC instance can implement the approved plan without conflicting.

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
REPO_NAME=$(basename "$REPO_ROOT")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="claude/$TIMESTAMP"

# Create branch from current HEAD
if ! git branch "$BRANCH_NAME" 2>/dev/null; then
  echo "{\"systemMessage\": \"❌ Failed to create branch ${BRANCH_NAME}\"}"
  exit 0
fi

# Worktree lives as a sibling of the repo root
SLUG=$(echo "$BRANCH_NAME" | tr '/' '-')
WORKTREE_PATH="${REPO_ROOT}/../${REPO_NAME}-${SLUG}"

if ! git worktree add "$WORKTREE_PATH" "$BRANCH_NAME" 2>/dev/null; then
  git branch -d "$BRANCH_NAME" 2>/dev/null || true
  echo "{\"systemMessage\": \"❌ Failed to create worktree at ${WORKTREE_PATH}\"}"
  exit 0
fi

echo "{\"systemMessage\": \"🌿 Worktree ready — open a new CC instance to implement in parallel:\\n  Branch: ${BRANCH_NAME}\\n  Path:   ${WORKTREE_PATH}\\n  Run:    cd ${WORKTREE_PATH} && claude\"}"
