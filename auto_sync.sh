#!/bin/bash
# CloudPulse Auto-Sync Daemon
# Automatically pulls changes when someone merges a PR or pushes to GitHub

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$PROJECT_DIR"

BRANCH="main"
INTERVAL=15

echo "🔄 CloudPulse Auto-Sync Started (Polling origin/$BRANCH every ${INTERVAL}s)..."

while true; do
  # Fetch latest refs silently
  git fetch origin "$BRANCH" >/dev/null 2>&1

  LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null)
  REMOTE_HASH=$(git rev-parse "origin/$BRANCH" 2>/dev/null)

  if [ -n "$LOCAL_HASH" ] && [ -n "$REMOTE_HASH" ] && [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    # Check if remote has commits we don't have
    BEHIND_COUNT=$(git rev-list --count HEAD..origin/$BRANCH 2>/dev/null)
    
    if [ "$BEHIND_COUNT" -gt 0 ]; then
      echo "[$(date +'%T')] 🚀 New changes detected on GitHub ($BEHIND_COUNT new commit(s)). Pulling..."
      
      # Pull safely (fast-forward if possible)
      PULL_OUTPUT=$(git pull origin "$BRANCH" 2>&1)
      if [ $? -eq 0 ]; then
        LATEST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%an)")
        echo "[$(date +'%T')] ✅ Updated to: $LATEST_COMMIT"
      else
        echo "[$(date +'%T')] ⚠️ Pull conflict or dirty working tree: $PULL_OUTPUT"
      fi
    fi
  fi

  sleep $INTERVAL
done
