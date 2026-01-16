#!/bin/bash
# Called when user submits a prompt
export CLAUDE_HOOK_EVENT="message"
exec ~/vibe-coder/hooks/vibe-coder-hook.sh
