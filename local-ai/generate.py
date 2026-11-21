#!/usr/bin/env python3
"""Generate character design options with the local ComfyUI server (start it first: bash local-ai/start-mac.sh).

  python3 local-ai/generate.py                       # Ishita + Vihaan, full Z-Image (50 steps, 832x1472), 4 styles x 2 options
  python3 local-ai/generate.py -m zimage            # Z-Image Turbo, 8 steps (fast drafts)
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
    "anime": "high quality modern anime film still of young adult characters, mature adult proportions, clean lineart, cel shading, detailed expressive eyes, soft cinematic lighting, beautiful detailed background",
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


def zimage_workflow(pos, neg, seed, w=1088, h=1920, hq=False):  # full 9:16 reel resolution
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "z_image_bf16.safetensors" if hq else "z_image_turbo_bf16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "z_image_ae.safetensors"}},
        "4": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3.0}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": pos, "clip": ["2", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["2", 0]}} if hq else {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["5", 0]}},
        "7": {"class_type": "EmptySD3LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "8": {"class_type": "KSampler", "inputs": {"model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0],
                                                    "seed": seed, "steps": 50 if hq else 8, "cfg": 4.0 if hq else 1.0, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1.0}},
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


def refine_workflow(image_name, pos, neg, seed, denoise=0.4, steps=20):  # ComfyUI runs exactly `steps` over the top `denoise` share of the schedule
    """Full Z-Image img2img pass over a chosen draft: keeps the face/composition, adds full-model detail."""
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "z_image_bf16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "z_image_ae.safetensors"}},
        "4": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3.0}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": pos, "clip": ["2", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["2", 0]}},
        "7": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "11": {"class_type": "VAEEncode", "inputs": {"pixels": ["7", 0], "vae": ["3", 0]}},
        "8": {"class_type": "KSampler", "inputs": {"model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["11", 0],
                                                    "seed": seed, "steps": steps, "cfg": 4.0, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": denoise}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": "stf_final"}},
    }


WAN_NEG = "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走"


def wan_i2v_workflow(image_name, prompt, seed, w=544, h=960, length=121, steps=20, cfg=5.0):
    """Wan 2.2 TI2V-5B image-to-video (mirrors ComfyUI's official template): painted shot -> 5 s clip at 24 fps."""
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "wan2.2_ti2v_5B_fp16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "wan2.2_vae.safetensors"}},
        "4": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1", 0], "shift": 8.0}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": WAN_NEG, "clip": ["2", 0]}},
        "7": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "8": {"class_type": "Wan22ImageToVideoLatent", "inputs": {"vae": ["3", 0], "width": w, "height": h, "length": length, "batch_size": 1, "start_image": ["7", 0]}},
        "9": {"class_type": "KSampler", "inputs": {"model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["8", 0],
                                                    "seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "uni_pc", "scheduler": "simple", "denoise": 1.0}},
        "10": {"class_type": "VAEDecode", "inputs": {"samples": ["9", 0], "vae": ["3", 0]}},
        "11": {"class_type": "CreateVideo", "inputs": {"images": ["10", 0], "fps": 24.0}},
        "12": {"class_type": "SaveVideo", "inputs": {"video": ["11", 0], "filename_prefix": "video/stf", "format": "mp4", "codec": "h264"}},
    }


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
        for img in out.get("images", []) + out.get("videos", []) + out.get("gifs", []):
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
    ap.add_argument("--size", default="832x1472", help="WxH; 832x1472 fits a 32 GB Mac comfortably, 1088x1920 is full reel size (needs lots of free RAM)")
    ap.add_argument("--shots", metavar="JSON", help="render an episode shot list, e.g. shots/ep01.json")
    ap.add_argument("--animate", action="store_true", help="with --shots: turn each painted shot into a moving clip (Wan 2.2 5B)")
    ap.add_argument("--frames", type=int, default=121, help="clip length in frames at 24 fps (121 = 5 s)")
    ap.add_argument("--vsize", default="544x960", help="clip size WxH (multiples of 32)")
    ap.add_argument("--vsteps", type=int, default=20)
    ap.add_argument("--only", default="", help="with --shots: shot numbers, e.g. 1-4 or 2,5")
    ap.add_argument("--refine", metavar="PNG", help="refine a chosen draft with the full model (keeps the face); use with one character id")
    ap.add_argument("--steps", type=int, default=20, help="refine steps (14-20 fits one 30-min run on an M1 Pro)")
    ap.add_argument("--denoise", type=float, default=0.4, help="refine strength: 0.3 subtle .. 0.5 stronger")
    ap.add_argument("-s", "--style", default="all", help="zimage style: " + ", ".join(STYLES) + " or all")
    a = ap.parse_args()
    who = ["ishita", "vihaan"] if a.who == "leads" else list(cfg["characters"]) if a.who == "all" else [a.who]
    W, H = (int(v) for v in a.size.lower().split("x"))
    styles = list(STYLES) if a.style == "all" else a.style.split(",")
    try:
        call("/system_stats")
    except Exception:
        raise SystemExit(f"ComfyUI is not running at {SERVER}. Start it in another terminal: bash local-ai/start-mac.sh")
    if a.shots:
        sp = json.load(open(a.shots if os.path.isabs(a.shots) else os.path.join(HERE, a.shots)))
        pick = set()
        for part in filter(None, a.only.split(",")):
            lo, _, hi = part.partition("-"); pick.update(range(int(lo), int(hi or lo) + 1))
        outdir = os.path.join(HERE, "shots-out", sp["episode"]); os.makedirs(outdir, exist_ok=True)
        st = a.style if a.style != "all" else "anime"
        if a.animate:
            import shutil
            inp = os.path.join(os.environ.get("STF_AI_DIR", os.path.expanduser("~/claude-projects/2-strangers/ai-studio")), "ComfyUI", "input")
            os.makedirs(inp, exist_ok=True)
            vw, vh = (int(v) for v in a.vsize.lower().split("x"))
            vdir = os.path.join(HERE, "clips-out", sp["episode"]); os.makedirs(vdir, exist_ok=True)
            for i, shot in enumerate(sp["shots"], 1):
                if pick and i not in pick:
                    continue
                src = os.path.join(HERE, "..", "studio", "data", "media", "shots", sp["episode"], shot["id"] + ".png")
                name = f"stf_{sp['episode']}_{shot['id']}.png"; shutil.copy(src, os.path.join(inp, name))
                seed = random.randint(1, 2**31); dest = os.path.join(vdir, f"{shot['id']}.mp4"); t = time.time()
                run(wan_i2v_workflow(name, shot.get("motion", "subtle natural motion, blinking, breathing, gentle breeze") + ". Anime style, consistent characters, smooth natural motion", seed, vw, vh, a.frames, a.vsteps), dest)
                print(f"{os.path.relpath(dest, HERE)}  ({time.time() - t:.0f}s)", flush=True)
            return
        for i, shot in enumerate(sp["shots"], 1):
            if pick and i not in pick:
                continue
            prompt = shot["prompt"]
            for tag, desc in sp["cast"].items():
                prompt = prompt.replace(tag, f"{desc} ({tag.title()})")
            for k in range(a.n if a.n != 2 else 1):
                seed = random.randint(1, 2**31)
                dest = os.path.join(outdir, f"{shot['id']}-{seed}.png")
                t = time.time()
                run(zimage_workflow(f"{STYLES[st]}. {prompt}. Indian setting, vertical 9:16 frame, no text, no watermark", cfg["negative"], seed, w=W, h=H, hq=a.m == "zimage-hq"), dest)
                print(f"{os.path.relpath(dest, HERE)}  ({time.time() - t:.0f}s)", flush=True)
        return
    if a.refine:
        import shutil
        c, st = who[0], (styles[0] if a.style != "all" else "anime")
        inp = os.path.join(os.environ.get("STF_AI_DIR", os.path.expanduser("~/claude-projects/2-strangers/ai-studio")), "ComfyUI", "input")
        os.makedirs(inp, exist_ok=True)
        name = "stf_ref_" + os.path.basename(a.refine)
        shutil.copy(a.refine, os.path.join(inp, name))
        os.makedirs(os.path.join(HERE, "final"), exist_ok=True)
        dest = os.path.join(HERE, "final", f"{c}-{st}-final.png")
        t = time.time()
        run(refine_workflow(name, f"{STYLES[st]}. {cfg['characters'][c]}. Indian features, natural Indian skin tone, wholesome, no text", cfg["negative"], random.randint(1, 2**31), a.denoise, a.steps), dest)
        print(f"{os.path.relpath(dest, HERE)}  ({time.time() - t:.0f}s)", flush=True)
        return
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
                    wf = zimage_workflow(f"{STYLES[st]}. {cfg['characters'][c]}. Indian features, natural Indian skin tone, wholesome, no text", cfg["negative"], seed, w=W, h=H, hq=a.m == "zimage-hq")
                else:
                    wf = workflow(MODELS[a.m], f"{cfg['characters'][c]}, {cfg['quality']}", cfg["negative"], seed)
                run(wf, dest)
                print(f"{os.path.relpath(dest, HERE)}  ({time.time() - t:.0f}s)", flush=True)


if __name__ == "__main__":
    main()
