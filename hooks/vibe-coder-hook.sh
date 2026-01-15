#!/bin/bash
# Vibe Coder XP Hook - sends events to the game server
# This script is called by Claude Code hooks with event data on stdin

# Read the event data from stdin
EVENT_DATA=$(cat)

# Extract the event type from the hook name (passed as $1 or from environment)
EVENT_TYPE="${CLAUDE_HOOK_EVENT:-unknown}"

# Send to the Vibe Coder server (silent, non-blocking)
curl -s -X POST http://localhost:3333/event \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"$EVENT_TYPE\", \"data\": $EVENT_DATA}" \
  --connect-timeout 1 \
  --max-time 2 \
  > /dev/null 2>&1 &

# Always exit 0 so we don't block Claude Code
exit 0
