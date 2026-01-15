#!/bin/bash
# Called when user sends a message to Claude
export CLAUDE_HOOK_EVENT="message"
exec ~/vibe-coder/hooks/vibe-coder-hook.sh
