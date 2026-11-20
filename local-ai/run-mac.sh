#!/usr/bin/env bash
# One shot: start ComfyUI, generate character options, stop ComfyUI.
#   bash local-ai/run-mac.sh                 -> Ishita + Vihaan, 4 per model
#   bash local-ai/run-mac.sh ishita -n 6 -m animagine
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
AI="${STF_AI_DIR:-$HOME/claude-projects/2-strangers/ai-studio}/ComfyUI"
cd "$AI" && source .venv/bin/activate
export PYTORCH_ENABLE_MPS_FALLBACK=1
python main.py --listen 127.0.0.1 --port 8188 --force-fp16 > "$HERE/comfy.log" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT
for i in $(seq 1 120); do curl -s -o /dev/null http://127.0.0.1:8188/system_stats && break; sleep 2; done
python3 "$HERE/generate.py" "$@"
