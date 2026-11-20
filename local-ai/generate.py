#!/usr/bin/env python3
"""Generate character design options with the local ComfyUI server (start it first: bash local-ai/start-mac.sh).

  python3 local-ai/generate.py                     # Ishita + Vihaan, 4 options each, both models
  python3 local-ai/generate.py ishita -n 8         # 8 options of one character
  python3 local-ai/generate.py all -m animagine    # whole cast, one model

Images land in local-ai/out/<character>/. Uses only the Python standard library.
"""
import argparse, json, os, random, time, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER = os.environ.get("COMFY_URL", "http://127.0.0.1:8188")
MODELS = {"animagine": "animagine-xl-4.0-opt.safetensors", "illustrious": "Illustrious-XL-v0.1.safetensors"}


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
    ap.add_argument("-n", type=int, default=4, help="options per character per model")
    ap.add_argument("-m", choices=[*MODELS, "both"], default="both")
    a = ap.parse_args()
    who = ["ishita", "vihaan"] if a.who == "leads" else list(cfg["characters"]) if a.who == "all" else [a.who]
    models = list(MODELS) if a.m == "both" else [a.m]
    try:
        call("/system_stats")
    except Exception:
        raise SystemExit(f"ComfyUI is not running at {SERVER}. Start it in another terminal: bash local-ai/start-mac.sh")
    for c in who:
        os.makedirs(os.path.join(HERE, "out", c), exist_ok=True)
        for m in models:
            for i in range(a.n):
                seed = random.randint(1, 2**31)
                dest = os.path.join(HERE, "out", c, f"{c}-{m}-{seed}.png")
                t = time.time()
                run(workflow(MODELS[m], f"{cfg['characters'][c]}, {cfg['quality']}", cfg["negative"], seed), dest)
                print(f"{os.path.relpath(dest, HERE)}  ({time.time() - t:.0f}s)", flush=True)


if __name__ == "__main__":
    main()
