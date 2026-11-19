#!/usr/bin/env python3
"""Generate episode voice lines with ElevenLabs (key is injected by the session proxy).

Usage: python3 production/voices/make_voices.py ep01
Reads LINES[ep] below, writes production/voices/<ep>/NN-<role>.mp3 and <ep>-all.mp3 (with pauses).
"""
import json, os, subprocess, sys, urllib.request

V3 = {"stability": 0.5, "similarity_boost": 0.8}
CAST = {  # role -> (voice_id, settings)   final cast, Hinglish, eleven_v3
    "narrator": ("zlREppBW1FE7WsYs43Sz", V3),  # Yatin: sacred & divine love storyteller
    "ishita":   ("kiaJRdXJzloFWi6AtFBf", V3),  # Tarini: calm, measured
    "vihaan":   ("GhcgqZ83VDU5cWonBdAL", V3),  # Amit Gupta: lover-boy romantic
    "zoya":     ("2bNrEsM0omyhLiEyOwqY", V3),  # Monika Sogam: friendly
    "appa":     ("6EphsklDopDQ6eRkwNHT", V3),  # Shardul K: deep, authoritative
}
HOMETOWN = None  # set once chosen; lines containing {HOMETOWN} are skipped until then

LINES = {
    "ep01": [
        ("narrator", "[softly] दो अजनबी... एक ही शहर... एक ही college... [pause] और उन्हें बिल्कुल पता नहीं था... [warmly] कि वो एक-दूसरे के लिए ही बने थे।"),
        ("narrator", "ये है Ishita. {HOMETOWN} की एक सीधी-सादी लड़की... जिसके सपने छोटे थे, पर बहुत प्यारे।"),
        ("appa",     "[firmly] Engineering. Final. ये तुम्हारे future के लिए है, बेटा।"),
        ("ishita",   "[sad, softly] लेकिन Appa... मुझे engineering कभी करनी ही नहीं थी।"),
        ("narrator", "[gently] एक suitcase... और भारी दिल के साथ... वो निकल पड़ी Bangalore की तरफ़।"),
        ("narrator", "[amazed] सब कुछ इतना बड़ा... इतना तेज़... इतना नया था।"),
        ("zoya",     "[cheerful] Relax yaar, roomie! बस engineering ही तो है... worst क्या हो सकता है?"),
        ("narrator", "एक ही college. अलग-अलग blocks. [pause] बिल्कुल अजनबी।"),
        ("narrator", "[whispers] लेकिन एक छोटी सी चीज़... सब कुछ बदलने वाली थी।"),
    ],
}

def tts(voice_id, settings, text, out):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=json.dumps({"text": text, "model_id": "eleven_v3", "voice_settings": settings}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r, open(out, "wb") as f:
        f.write(r.read())

ep = sys.argv[1] if len(sys.argv) > 1 else "ep01"
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), ep)
os.makedirs(d, exist_ok=True)
files = []
for i, (role, text) in enumerate(LINES[ep], 1):
    if "{HOMETOWN}" in text:
        if not HOMETOWN:
            print("skip line", i, "(hometown not chosen yet)"); continue
        text = text.replace("{HOMETOWN}", HOMETOWN)
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
