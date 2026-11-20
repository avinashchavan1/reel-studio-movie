#!/usr/bin/env bash
# Strangers to Forever: local AI image studio for Apple Silicon Macs (M1/M2/M3/M4, 16 GB+; 32 GB recommended).
# Installs ComfyUI + open models into ~/claude-projects/2-strangers/ai-studio. Safe to re-run (skips what is already there).
# Usage:  bash local-ai/setup-mac.sh          then:  bash local-ai/start-mac.sh
set -euo pipefail
ROOT="${STF_AI_DIR:-$HOME/claude-projects/2-strangers/ai-studio}"
mkdir -p "$ROOT" && cd "$ROOT"
say() { printf '\n\033[1;35m== %s\033[0m\n' "$*"; }

[[ "$(uname -m)" == "arm64" ]] || { echo "This script is for Apple Silicon Macs."; exit 1; }
FREE_GB=$(df -g "$ROOT" | awk 'NR==2{print $4}')
(( FREE_GB >= 35 )) || { echo "Need about 35 GB free disk, you have ${FREE_GB} GB."; exit 1; }

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

say "Models (about 33 GB, resumable)"
get() { # url  dest
  if [[ -s "$2" ]]; then echo "have $(basename "$2")"; else echo "downloading $(basename "$2")"; curl -L --fail -C - -o "$2.part" "$1" && mv "$2.part" "$2"; fi
}
HF=https://huggingface.co
# Qwen-Image 2.1 (Sep 2026, Qwen research licence: non-commercial), full bf16 precision for Apple GPUs, ~33 GB.
#   qwen_image_2.1_bf16 + qwen3vl_8b text encoder + VAE; turbo LoRA for fast 8-step drafts.
#   (The int8 files in the template need NVIDIA kernels, so the Mac uses bf16.)
QI="$HF/Comfy-Org/Qwen-Image-2.1/resolve/main"
mkdir -p models/diffusion_models models/text_encoders models/vae models/loras
get "$QI/vae/qwen_image_2.1_vae_bf16.safetensors" models/vae/qwen_image_2.1_vae_bf16.safetensors
get "$QI/loras/qwen_image_2.1_turbo_lora_avg_rank_178_bf16.safetensors" models/loras/qwen_image_2.1_turbo_lora_avg_rank_178_bf16.safetensors
get "$QI/diffusion_models/qwen_image_2.1_bf16.safetensors" models/diffusion_models/qwen_image_2.1_bf16.safetensors
get "$QI/text_encoders/qwen3vl_8b_bf16.safetensors" models/text_encoders/qwen3vl_8b_bf16.safetensors
# Optional anime model (STF_ANIME=1): NoobAI-XL 1.1, a top Illustrious-family anime model (~7 GB)
if [[ "${STF_ANIME:-0}" == "1" ]]; then
  get "$HF/Laxhar/noobai-XL-1.1/resolve/main/NoobAI-XL-v1.1.safetensors" models/checkpoints/NoobAI-XL-v1.1.safetensors
fi

say "Done"
echo "Installed in $ROOT/ComfyUI. Start it with:  bash local-ai/start-mac.sh"
