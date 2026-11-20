#!/usr/bin/env bash
# One shot: start ComfyUI, generate character options, stop ComfyUI.
#   bash local-ai/run-mac.sh                 -> Ishita + Vihaan, 4 per model
#   bash local-ai/run-mac.sh ishita -n 6 -m animagine
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
AI="${STF_AI_DIR:-$HOME/claude-projects/2-strangers/ai-studio}/ComfyUI"
cd "$AI" && source .venv/bin/activate
export PYTORCH_ENABLE_MPS_FALLBACK=1
PORT="${COMFY_PORT:-$((8200 + RANDOM % 600))}"  # own port per run, so a leftover server never blocks a new one
export COMFY_URL="http://127.0.0.1:$PORT"
python main.py --listen 127.0.0.1 --port "$PORT" > "$HERE/comfy.log" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT INT TERM HUP
for i in $(seq 1 120); do curl -s -o /dev/null "$COMFY_URL/system_stats" && break; sleep 2; done
python3 "$HERE/generate.py" "$@"
