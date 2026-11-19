#!/usr/bin/env python3
"""Generate episode voice lines with ElevenLabs (key is injected by the session proxy).

Usage: python3 production/voices/make_voices.py ep01
Reads LINES[ep] below, writes production/voices/<ep>/NN-<role>.mp3 and <ep>-all.mp3 (with pauses).
"""
import json, os, subprocess, sys, urllib.request

CAST = {  # role -> (voice_id, settings)
    "narrator": ("ADd2WEtjmwokqUr0Y5Ad", {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35}),  # Zara: soft, serene storyteller
    "tara":     ("P7vsEyTOpZ6YUTulin8m", {"stability": 0.40, "similarity_boost": 0.8, "style": 0.45}),  # young, expressive
    "zoya":     ("1ea3IFhmSWgw8sJkSvfJ", {"stability": 0.35, "similarity_boost": 0.8, "style": 0.55}),  # Simran: cheerful best friend
    "kabir":    ("XPqjYvTqfyUQr09yCpCY", {"stability": 0.45, "similarity_boost": 0.8, "style": 0.40}),  # Kartik: warm, young Indian male
    "appa":     ("Qc0h5B5Mqs8oaH4sFZ9X", {"stability": 0.60, "similarity_boost": 0.8, "style": 0.30}),  # Sagar: formal, middle-aged Indian male
}

LINES = {
    "ep01": [
        ("narrator", "Two strangers... same city, same college... and no idea they were made for each other."),
        ("narrator", "This is Tara. A simple girl from a small town called Chandangaon."),
        ("appa",     "Engineering. Final."),
        ("tara",     "But Appa... I never wanted engineering."),
        ("narrator", "With one suitcase and a heavy heart... she left for the big city, Neelpur."),
        ("narrator", "Everything was so big... so fast... so new."),
        ("zoya",     "Relax, roomie! It's just engineering. What's the worst that could happen?"),
        ("narrator", "Same college. Different blocks. Total strangers."),
        ("narrator", "But a tiny little thing... was about to change everything."),
    ],
}

def tts(voice_id, settings, text, out):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=json.dumps({"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": settings}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r, open(out, "wb") as f:
        f.write(r.read())

ep = sys.argv[1] if len(sys.argv) > 1 else "ep01"
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), ep)
os.makedirs(d, exist_ok=True)
files = []
for i, (role, text) in enumerate(LINES[ep], 1):
    out = os.path.join(d, f"{i:02d}-{role}.mp3")
    if not os.path.exists(out):
        vid, st = CAST[role]
        tts(vid, st, text, out)
    files.append(out)
    print("ok", os.path.basename(out))
# join with 0.6s pauses for a quick listen
inputs, parts = [], []
for i, f in enumerate(files):
    inputs += ["-i", f]
    parts.append(f"[{i}:a]aresample=44100,apad=pad_dur=0.6[a{i}]")
filt = ";".join(parts) + ";" + "".join(f"[a{i}]" for i in range(len(files))) + f"concat=n={len(files)}:v=0:a=1[out]"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", filt, "-map", "[out]", os.path.join(d, f"{ep}-all.mp3")], check=True)
print("wrote", os.path.join(d, f"{ep}-all.mp3"))
