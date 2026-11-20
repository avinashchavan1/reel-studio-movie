#!/usr/bin/env bash
# Strangers to Forever: local AI image studio for Apple Silicon Macs (M1/M2/M3/M4, 16 GB+; 32 GB recommended).
# Installs ComfyUI + open models into ~/claude-projects/stf-ai. Safe to re-run (skips what is already there).
# Usage:  bash local-ai/setup-mac.sh          then:  bash local-ai/start-mac.sh
set -euo pipefail
ROOT="${STF_AI_DIR:-$HOME/claude-projects/stf-ai}"
mkdir -p "$ROOT" && cd "$ROOT"
say() { printf '\n\033[1;35m== %s\033[0m\n' "$*"; }

[[ "$(uname -m)" == "arm64" ]] || { echo "This script is for Apple Silicon Macs."; exit 1; }
FREE_GB=$(df -g "$ROOT" | awk 'NR==2{print $4}')
(( FREE_GB >= 25 )) || { echo "Need about 25 GB free disk, you have ${FREE_GB} GB."; exit 1; }

say "Python"
PY=""
for c in python3.12 python3.11 python3.10 python3; do
  if command -v "$c" >/dev/null && "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)'; then PY="$c"; break; fi
done
if [[ -z "$PY" ]]; then
  command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh  (then re-run this script)"; exit 1; }
  brew install python@3.12 git; PY=python3.12
fi
echo "using $($PY --version)"

say "ComfyUI"
[[ -d ComfyUI ]] || git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
[[ -d .venv ]] || "$PY" -m venv .venv
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q torch torchvision torchaudio
pip install -q -r requirements.txt
python -c "import torch; print('Apple GPU (MPS) available:', torch.backends.mps.is_available())"

say "Models (about 13 GB, resumable)"
get() { # url  dest
  if [[ -s "$2" ]]; then echo "have $(basename "$2")"; else echo "downloading $(basename "$2")"; curl -L --fail -C - -o "$2.part" "$1" && mv "$2.part" "$2"; fi
}
HF=https://huggingface.co
# Anime: Animagine XL 4.0 (opt) and Illustrious XL: clean modern anime characters
get "$HF/cagliostrolab/animagine-xl-4.0/resolve/main/animagine-xl-4.0-opt.safetensors" models/checkpoints/animagine-xl-4.0-opt.safetensors
get "$HF/OnomaAIResearch/Illustrious-xl-early-release-v0/resolve/main/Illustrious-XL-v0.1.safetensors" models/checkpoints/Illustrious-XL-v0.1.safetensors

say "Done"
echo "Installed in $ROOT/ComfyUI. Start it with:  bash local-ai/start-mac.sh"
