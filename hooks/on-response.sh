#!/bin/bash
# Called when Claude finishes responding
export CLAUDE_HOOK_EVENT="response"
exec ~/vibe-coder/hooks/vibe-coder-hook.sh
