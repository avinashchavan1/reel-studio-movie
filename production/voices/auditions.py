#!/usr/bin/env python3
"""Voice auditions: 3 ElevenLabs options per role, same line, joined into one file per role.
Option A is preceded by 1 beep, B by 2 beeps, C by 3 beeps.
Library voices are added to the account only while generating and removed afterwards (voice-slot limit)."""
import json, os, subprocess, urllib.request

API = "https://api.elevenlabs.io"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auditions")
os.makedirs(OUT, exist_ok=True)

# role -> (line, [(label, owner_id or None if already in account, voice_id)])
F, S = "f87f057c2250691953ac2e6227859706764bd08c88a055a18c74261957885a51", "7398804d9eaf2f463899a907587c33a390591775784f87857b6d0e1e4e3e66f6"
ROLES = {
    "narrator": ("Two strangers... same city, same college... and no idea they were made for each other.",
                 [("A-Zara-soft", None, "ADd2WEtjmwokqUr0Y5Ad"), ("B-Saavi-warm", S, "H8bdWZHK2OgZwTN7ponr"), ("C-Monika-deep", F, "2zRM7PkgwBPiau2jvVXc")]),
    "tara":     ("But Dad... I never wanted engineering.",
                 [("A-Tara-expressive", None, "P7vsEyTOpZ6YUTulin8m"), ("B-Naina-youthful", F, "6BZyx2XekeeXOkTVn8un"), ("C-Anika-sweet", S, "ecp3DWciuUyW7BYM7II1")]),
    "kabir":    ("Hey... I think I'm connected to your hotspot. Hope that's okay?",
                 [("A-Kartik-warm", None, "XPqjYvTqfyUQr09yCpCY"), ("B-Viraj-gentle", F, "1U02n4nD6AdIZ9CjF053"), ("C-Siddhu-friendly", S, "iLrek0aeAREetkK9NhwJ")]),
    "zoya":     ("Relax, roomie! It's just engineering. What's the worst that could happen?",
                 [("A-Simran-cheerful", None, "1ea3IFhmSWgw8sJkSvfJ"), ("B-Neha-relatable", S, "QTKSa2Iyv0yoxvXY2V8a"), ("C-Monika-natural", F, "EaBs7G1VibMrNAuz2Na7")]),
    "dad":     ("Engineering. Final. This is for your future, beta.",
                 [("A-Sagar-formal", None, "Qc0h5B5Mqs8oaH4sFZ9X"), ("B-Ranbir-warm", F, "9PvnT6XRzlljoaDG6Knu"), ("C-Sanjay-mature", None, "PboFIQ6kckfADmG3UQYF")]),
}

def call(path, body=None, method="POST"):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"}, method=method)
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=f=1046:d=0.12", "-af", "afade=t=out:st=0.06:d=0.06",
                "-ar", "44100", "-ac", "1", f"{OUT}/beep.wav"], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.18", f"{OUT}/gap.wav"], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.9", f"{OUT}/pause.wav"], check=True)

for role, (line, opts) in ROLES.items():
    seq = []
    for n, (label, owner, vid) in enumerate(opts, 1):
        mp3 = f"{OUT}/{role}-{label}.mp3"
        if not os.path.exists(mp3):
            if owner:
                call(f"/v1/voices/add/{owner}/{vid}", {"new_name": f"audition {label}"})
            try:
                audio = call(f"/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                             {"text": line, "model_id": "eleven_multilingual_v2",
                              "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4}})
                open(mp3, "wb").write(audio)
            finally:
                if owner:
                    try: call(f"/v1/voices/{vid}", method="DELETE")
                    except Exception as e: print("could not remove", vid, e)
        seq += [f"{OUT}/beep.wav", f"{OUT}/gap.wav"] * n + [mp3, f"{OUT}/pause.wav"]
        print("ok", role, label)
    ins = sum([["-i", s] for s in seq], [])
    filt = "".join(f"[{i}:a]aresample=44100,aformat=channel_layouts=mono[a{i}];" for i in range(len(seq)))
    filt += "".join(f"[a{i}]" for i in range(len(seq))) + f"concat=n={len(seq)}:v=0:a=1[o]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", filt, "-map", "[o]", "-b:a", "160k",
                    f"{OUT}/AUDITION-{role}.mp3"], check=True)
print("done")
