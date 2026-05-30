#!/usr/bin/env bash
# Stop hook: rebase onto origin/main, then auto-create/update a PR.
#
# Flow:
#   1. Auto-commit any uncommitted changes.
#   2. Fetch origin/main and rebase HEAD onto it (surfaces conflicts early).
#      - Clean rebase  -> push (--force-with-lease) and create/update the PR.
#      - Conflicts     -> leave the rebase in progress and BLOCK back to Claude
#                         so it can resolve the conflicts; the next Stop re-runs
#                         this hook, finishes the rebase, and opens the PR.
#   3. If Claude committed directly to main, a claude/YYYYMMDD-HHMMSS branch is
#      created/pushed and main is reset back to origin/main so it stays clean.

set -euo pipefail

DEFAULT_BRANCH="main"

# Read the hook payload from stdin so we can detect re-entrancy.
INPUT="$(cat 2>/dev/null || true)"
STOP_HOOK_ACTIVE=$(printf '%s' "$INPUT" \
  | grep -o '"stop_hook_active"[[:space:]]*:[[:space:]]*\(true\|false\)' \
  | grep -o 'true\|false' || true)

# Need gh CLI
if ! command -v gh &>/dev/null; then
  echo '{"systemMessage": "⚠️  gh CLI not found — skipping auto-PR creation."}'
  exit 0
fi

# Need a git repo
if ! git rev-parse --git-dir &>/dev/null 2>&1; then
  exit 0
fi

REBASE_MERGE_DIR="$(git rev-parse --git-path rebase-merge 2>/dev/null)"
REBASE_APPLY_DIR="$(git rev-parse --git-path rebase-apply 2>/dev/null)"

rebase_in_progress() {
  [ -d "$REBASE_MERGE_DIR" ] || [ -d "$REBASE_APPLY_DIR" ]
}

unresolved_conflicts() {
  [ -n "$(git diff --name-only --diff-filter=U 2>/dev/null)" ]
}

# Emit a Stop-hook "block" so Claude is re-invoked to resolve the conflicts.
block_for_conflicts() {
  local files
  files=$(git diff --name-only --diff-filter=U 2>/dev/null | sed 's/^/  - /')
  local reason="Rebase onto ${DEFAULT_BRANCH} hit merge conflicts. Resolve them, then run \`git rebase --continue\` (or just stage the resolved files and stop again). Conflicted files:
${files}"
  # JSON-escape the reason (newlines -> \n, quotes/backslashes escaped).
  reason=$(printf '%s' "$reason" \
    | sed 's/\\/\\\\/g; s/"/\\"/g' \
    | awk 'BEGIN{ORS="\\n"} {print}' \
    | sed 's/\\n$//')
  printf '{"decision": "block", "reason": "%s"}\n' "$reason"
  exit 0
}

# --- Handle a rebase left in progress by a previous Stop (conflict pass) ------
if rebase_in_progress; then
  if unresolved_conflicts; then
    # Still conflicted. Avoid an infinite Stop loop: if we already handed this
    # back to Claude once and it's still stuck, pause instead of re-blocking.
    if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
      echo '{"systemMessage": "⚠️  Rebase conflicts still unresolved — pausing auto-PR. Resolve them and stop again."}'
      exit 0
    fi
    block_for_conflicts
  fi
  # Conflicts resolved but rebase not yet continued — finish it.
  git add -A
  if ! GIT_EDITOR=true GIT_SEQUENCE_EDITOR=true git rebase --continue 2>/dev/null; then
    if unresolved_conflicts; then
      [ "$STOP_HOOK_ACTIVE" = "true" ] && {
        echo '{"systemMessage": "⚠️  Rebase still has conflicts — pausing auto-PR."}'
        exit 0
      }
      block_for_conflicts
    fi
    echo '{"systemMessage": "❌ git rebase --continue failed — resolve manually."}'
    exit 0
  fi
fi

# --- Auto-commit any uncommitted changes -------------------------------------
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  ALL_FILES=$(git diff --cached --name-only)
  FILE_COUNT=$(echo "$ALL_FILES" | wc -l | tr -d ' ')
  CHANGED_FILES=$(echo "$ALL_FILES" | head -5 | tr '\n' ' ' | sed 's/ $//')
  [ "$FILE_COUNT" -gt 5 ] && CHANGED_FILES="${CHANGED_FILES} (+$((FILE_COUNT - 5)) more)"
  git commit -m "chore: auto-commit implementation changes

Files: ${CHANGED_FILES}

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" 2>/dev/null || true
fi

# Bring remote refs up to date (ignore network errors)
git fetch origin "$DEFAULT_BRANCH" 2>/dev/null || true

# --- Rebase HEAD onto origin/main so conflicts surface now -------------------
# Only rebase if there is actually new upstream work to land on; this keeps a
# linear history and lets force-with-lease pushes stay safe.
if [ -n "$(git log "HEAD..origin/$DEFAULT_BRANCH" --oneline 2>/dev/null)" ]; then
  if ! GIT_EDITOR=true GIT_SEQUENCE_EDITOR=true git rebase "origin/$DEFAULT_BRANCH" 2>/dev/null; then
    if unresolved_conflicts; then
      block_for_conflicts
    fi
    git rebase --abort 2>/dev/null || true
    echo '{"systemMessage": "❌ Rebase onto main failed (non-conflict) — skipping auto-PR."}'
    exit 0
  fi
fi

# --- Any local commits not on origin/main? -----------------------------------
NEW_COMMITS=$(git log "origin/$DEFAULT_BRANCH..HEAD" --oneline 2>/dev/null || true)
if [ -z "$NEW_COMMITS" ]; then
  exit 0
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)

if [ "$CURRENT_BRANCH" = "$DEFAULT_BRANCH" ] || [ -z "$CURRENT_BRANCH" ]; then
  # Committed directly to main — create a timestamped claude/ branch
  BRANCH_NAME="claude/$(date +%Y%m%d-%H%M%S)"
  git branch "$BRANCH_NAME"
  if ! git push --force-with-lease origin "$BRANCH_NAME" 2>/dev/null; then
    echo '{"systemMessage": "❌ Push failed — auto-PR not created."}'
    exit 0
  fi
  # Reset local main so it stays in sync with origin/main
  git reset --hard "origin/$DEFAULT_BRANCH" 2>/dev/null || true
else
  # Already on a feature branch
  BRANCH_NAME="$CURRENT_BRANCH"
  EXISTING_PR=$(gh pr list --head "$BRANCH_NAME" --base "$DEFAULT_BRANCH" --json number -q '.[0].number' 2>/dev/null || true)
  if [ -n "$EXISTING_PR" ]; then
    # PR exists — push the rebased branch (force-with-lease) to update it
    if ! git push --force-with-lease origin "$BRANCH_NAME" 2>/dev/null; then
      echo '{"systemMessage": "❌ Push to existing PR failed — branch may have diverged."}'
      exit 0
    fi
    echo "{\"systemMessage\": \"🔄 Rebased on ${DEFAULT_BRANCH} and pushed to PR #${EXISTING_PR} (${BRANCH_NAME})\"}"
    exit 0
  fi
  if ! git push --force-with-lease origin "$BRANCH_NAME" 2>/dev/null; then
    echo '{"systemMessage": "❌ Push failed — auto-PR not created."}'
    exit 0
  fi
fi

# Build PR title and body from commits
TITLE=$(git log "origin/${DEFAULT_BRANCH}..${BRANCH_NAME}" --oneline --reverse \
  | head -1 | sed 's/^[a-f0-9]* //')
COUNT=$(git log "origin/${DEFAULT_BRANCH}..${BRANCH_NAME}" --oneline | wc -l | tr -d ' ')
[ "$COUNT" -gt 1 ] && TITLE="${TITLE} (+$((COUNT - 1)) more)"

BODY=$(git log "origin/${DEFAULT_BRANCH}..${BRANCH_NAME}" --oneline --reverse \
  | sed 's/^[a-f0-9]* /- /')
BODY="${BODY}

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

PR_URL=$(gh pr create \
  --base "$DEFAULT_BRANCH" \
  --head "$BRANCH_NAME" \
  --title "$TITLE" \
  --body "$BODY" 2>&1) || {
  echo "{\"systemMessage\": \"❌ gh pr create failed: ${PR_URL}\"}"
  exit 0
}

echo "{\"systemMessage\": \"🔀 PR ready for review: ${PR_URL}\"}"
