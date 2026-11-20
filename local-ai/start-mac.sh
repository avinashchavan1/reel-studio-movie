#!/usr/bin/env bash
# Start the local ComfyUI server (http://127.0.0.1:8188). Leave this terminal open while generating.
set -euo pipefail
cd "${STF_AI_DIR:-$HOME/claude-projects/2-strangers/ai-studio}/ComfyUI"
source .venv/bin/activate
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec python main.py --listen 127.0.0.1 --port 8188 --force-fp16
