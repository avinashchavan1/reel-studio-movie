#!/usr/bin/env python3
"""Generate character design options with the local ComfyUI server (start it first: bash local-ai/start-mac.sh).

  python3 local-ai/generate.py                       # Ishita + Vihaan, full Z-Image (40 steps), 4 styles x 2 options
  python3 local-ai/generate.py -m zimage            # Qwen-Image 2.1 + turbo LoRA (only if its files are installed)
  python3 local-ai/generate.py ishita -s pixar -n 8  # 8 Pixar-style options of one character
  python3 local-ai/generate.py all -m noobai         # whole cast with the anime SDXL model

Images land in local-ai/out/<character>/. Uses only the Python standard library.
"""
import argparse, json, os, random, time, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER = os.environ.get("COMFY_URL", "http://127.0.0.1:8188")
MODELS = {"qwen": None, "qwen-fast": None, "zimage": None, "zimage-hq": None, "noobai": "NoobAI-XL-v1.1.safetensors", "animagine": "animagine-xl-4.0-opt.safetensors"}
STYLES = {  # used with Z-Image (natural-language prompts)
    "pixar": "3D animated film still, stylized feature-animation character, soft subsurface skin, expressive big eyes, cinematic lighting, highly detailed",
    "anime": "high quality modern anime illustration, clean lineart, cel shading, detailed eyes, beautiful background",
    "ghibli": "hand-painted 2D animation film still, warm watercolor backgrounds, gentle soft colors, whimsical storybook feel",
    "semireal": "semi-realistic digital painting, Indian webtoon style, soft painterly shading, detailed face, natural proportions",
}


def workflow(ckpt, pos, neg, seed, w=832, h=1216, steps=28, cfg=5.0):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": pos, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["1", 1]}},
        "4": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "5": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0],
                                                    "seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "euler_ancestral", "scheduler": "normal", "denoise": 1.0}},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": "stf"}},
    }


def zimage_workflow(pos, neg, seed, w=896, h=1280, hq=False):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "z_image_bf16.safetensors" if hq else "z_image_turbo_bf16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "z_image_ae.safetensors"}},
        "4": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3.0}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": pos, "clip": ["2", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["2", 0]}} if hq else {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["5", 0]}},
        "7": {"class_type": "EmptySD3LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "8": {"class_type": "KSampler", "inputs": {"model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0],
                                                    "seed": seed, "steps": 40 if hq else 8, "cfg": 4.0 if hq else 1.0, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1.0}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": "stf"}},
    }


TURBO_SIGMAS = "1.0, 0.978453, 0.95418, 0.926626, 0.89508, 0.845148, 0.704534, 0.414568, 0"


def qwen_workflow(pos, neg, seed, w=928, h=1664, fast=False):
    """Qwen-Image 2.1 text-to-image (mirrors ComfyUI's official template, bf16 files for Apple GPUs)."""
    wf = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2.1_bf16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_8b_bf16.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_2.1_vae_bf16.safetensors"}},
        "4": {"class_type": "TextEncodeQwenImage21", "inputs": {"clip": ["2", 0], "prompt": pos, "negative_prompt": neg, "resolution": 1024}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": "stf"}},
    }
    if fast:
        wf["6"] = {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "qwen_image_2.1_turbo_lora_avg_rank_178_bf16.safetensors", "strength_model": 1.0}}
        wf["11"] = {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}}
        wf["12"] = {"class_type": "CFGGuider", "inputs": {"model": ["6", 0], "positive": ["4", 0], "negative": ["4", 1], "cfg": 1.0}}
        wf["13"] = {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}}
        wf["14"] = {"class_type": "ManualSigmas", "inputs": {"sigmas": TURBO_SIGMAS}}
        wf["8"] = {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["11", 0], "guider": ["12", 0], "sampler": ["13", 0], "sigmas": ["14", 0], "latent_image": ["5", 0]}}
    else:
        wf["8"] = {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["4", 0], "negative": ["4", 1], "latent_image": ["5", 0],
                                                         "seed": seed, "steps": 25, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}}
    return wf


def call(path, data=None):
    req = urllib.request.Request(SERVER + path, data=json.dumps(data).encode() if data else None, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def run(wf, dest):
    pid = json.loads(call("/prompt", {"prompt": wf}))["prompt_id"]
    while True:
        hist = json.loads(call(f"/history/{pid}"))
        if pid in hist:
            break
        time.sleep(2)
    for out in hist[pid]["outputs"].values():
        for img in out.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img["subfolder"], "type": img["type"]})
            with open(dest, "wb") as f:
                f.write(call(f"/view?{q}"))
            return dest


def main():
    cfg = json.load(open(os.path.join(HERE, "characters.json")))
    ap = argparse.ArgumentParser()
    ap.add_argument("who", nargs="?", default="leads", help="character id, 'leads' (ishita+vihaan) or 'all'")
    ap.add_argument("-n", type=int, default=2, help="options per character per style")
    ap.add_argument("-m", choices=list(MODELS), default="zimage-hq")
    ap.add_argument("-s", "--style", default="all", help="zimage style: " + ", ".join(STYLES) + " or all")
    a = ap.parse_args()
    who = ["ishita", "vihaan"] if a.who == "leads" else list(cfg["characters"]) if a.who == "all" else [a.who]
    styles = list(STYLES) if a.style == "all" else a.style.split(",")
    try:
        call("/system_stats")
    except Exception:
        raise SystemExit(f"ComfyUI is not running at {SERVER}. Start it in another terminal: bash local-ai/start-mac.sh")
    for c in who:
        os.makedirs(os.path.join(HERE, "out", c), exist_ok=True)
        for st in (styles if a.m.startswith(("zimage", "qwen")) else [a.m]):
            for i in range(a.n):
                seed = random.randint(1, 2**31)
                dest = os.path.join(HERE, "out", c, f"{c}-{st}-{seed}.png")
                t = time.time()
                if a.m.startswith("qwen"):
                    wf = qwen_workflow(f"{STYLES[st]}. {cfg['characters'][c]}. Clearly Indian features and natural Indian skin tone, wholesome, vertical 9:16 frame, no text or watermark.", cfg["negative"], seed, fast=a.m == "qwen-fast")
                elif a.m.startswith("zimage"):
                    wf = zimage_workflow(f"{STYLES[st]}. {cfg['characters'][c]}. Indian features, natural Indian skin tone, wholesome, no text", cfg["negative"], seed, hq=a.m == "zimage-hq")
                else:
                    wf = workflow(MODELS[a.m], f"{cfg['characters'][c]}, {cfg['quality']}", cfg["negative"], seed)
                run(wf, dest)
                print(f"{os.path.relpath(dest, HERE)}  ({time.time() - t:.0f}s)", flush=True)


if __name__ == "__main__":
    main()
