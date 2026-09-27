#!/bin/bash
# CloudPulse Auto-Sync Daemon
# Automatically pulls changes when someone merges a PR or pushes to GitHub

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$PROJECT_DIR"

BRANCH="main"
INTERVAL=10

echo "🔄 CloudPulse Auto-Sync Active (Checking GitHub every ${INTERVAL}s)..."

while true; do
  # Fetch latest refs from remote origin
  git fetch origin "$BRANCH" >/dev/null 2>&1

  LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null)
  REMOTE_HASH=$(git rev-parse "origin/$BRANCH" 2>/dev/null)

  if [ -n "$LOCAL_HASH" ] && [ -n "$REMOTE_HASH" ] && [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    BEHIND_COUNT=$(git rev-list --count HEAD..origin/$BRANCH 2>/dev/null)
    
    if [ "$BEHIND_COUNT" -gt 0 ]; then
      echo "[$(date +'%T')] 🚀 New commits detected on GitHub ($BEHIND_COUNT new commit(s)). Pulling..."
      
      # Pull with autostash so uncommitted local edits are never lost
      PULL_OUTPUT=$(git pull --rebase --autostash origin "$BRANCH" 2>&1)
      PULL_STATUS=$?
      
      if [ $PULL_STATUS -eq 0 ]; then
        LATEST_COMMIT=$(git log -1 --pretty=format:"%s (%an)")
        COMMIT_HASH=$(git log -1 --pretty=format:"%h")
        echo "[$(date +'%T')] ✅ Code successfully updated! [$COMMIT_HASH] $LATEST_COMMIT"
        
        # Mac desktop notification
        osascript -e "display notification \"$LATEST_COMMIT\" with title \"CloudPulse Auto-Updated ($COMMIT_HASH)\"" 2>/dev/null || true
      else
        echo "[$(date +'%T')] ⚠️ Notice: $PULL_OUTPUT"
      fi
    fi
  fi

  sleep $INTERVAL
done
