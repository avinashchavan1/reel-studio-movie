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
(( FREE_GB >= 36 )) || echo "Note: ${FREE_GB} GB free; a fresh install needs about 36 GB (already-downloaded models are skipped)."

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

say "Models (about 39 GB, resumable)"
get() { # url  dest
  if [[ -s "$2" ]]; then echo "have $(basename "$2")"; else echo "downloading $(basename "$2")"; curl -L --fail -C - -o "$2.part" "$1" && mv "$2.part" "$2"; fi
}
HF=https://huggingface.co
# Z-Image Turbo (Apache-2.0, free for commercial use), bf16, 8 steps (~21 GB). The full Z-Image model is
# skipped: it needs more than 32 GB to run with guidance, so it stalled on the M1 Pro.
ZI="$HF/Comfy-Org/Z-Image-Turbo/resolve/main/split_files"
get "$ZI/text_encoders/qwen_3_4b.safetensors" models/text_encoders/qwen_3_4b.safetensors
get "$ZI/vae/ae.safetensors" models/vae/z_image_ae.safetensors
get "$ZI/diffusion_models/z_image_turbo_bf16.safetensors" models/diffusion_models/z_image_turbo_bf16.safetensors
# Video: Wan 2.2 TI2V 5B (Apache-2.0) image-to-video, ~18 GB
WAN="$HF/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files"
get "$WAN/vae/wan2.2_vae.safetensors" models/vae/wan2.2_vae.safetensors
get "$HF/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors" models/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors
get "$WAN/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors" models/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors
# Optional anime model (STF_ANIME=1): NoobAI-XL 1.1, a top Illustrious-family anime model (~7 GB)
if [[ "${STF_ANIME:-0}" == "1" ]]; then
  get "$HF/Laxhar/noobai-XL-1.1/resolve/main/NoobAI-XL-v1.1.safetensors" models/checkpoints/NoobAI-XL-v1.1.safetensors
fi

say "Done"
echo "Installed in $ROOT/ComfyUI. Start it with:  bash local-ai/start-mac.sh"
