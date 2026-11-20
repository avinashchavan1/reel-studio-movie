#!/usr/bin/env python3
"""Voice auditions: 3 ElevenLabs options per role, same line, joined into one file per role.
Option A is preceded by 1 beep, B by 2 beeps, C by 3 beeps.
Library voices are added to the account only while generating and removed afterwards (voice-slot limit)."""
import json, os, subprocess, urllib.request

API = "https://api.elevenlabs.io"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auditions-hinglish")
os.makedirs(OUT, exist_ok=True)

# role -> (line, [(label, owner_id or None if already in account, voice_id)])
F, S = "f87f057c2250691953ac2e6227859706764bd08c88a055a18c74261957885a51", "7398804d9eaf2f463899a907587c33a390591775784f87857b6d0e1e4e3e66f6"
ROLES = {
    "narrator": ("दो अजनबी... एक ही शहर, एक ही college... और उन्हें पता ही नहीं था कि वो एक-दूसरे के लिए बने हैं।",
                 [("A-Kanika-warm", S, "C2S5J6WvmHnrQWjUu6Rg"), ("B-Monika-calm", F, "1qEiC6qsybMkmnNdVMbK"), ("C-Anjali-cheerful", F, "gHu9GtaHOXcSqFTK06ux")]),
    "ishita":   ("लेकिन Dad... मुझे engineering कभी करनी ही नहीं थी।",
                 [("A-Simran-young", S, "9w21nMuk8CWXIME31V1S"), ("B-Tarini-calm", S, "kiaJRdXJzloFWi6AtFBf"), ("C-Sia-friendly", S, "KYiVPerWcenyBTIvWbfY")]),
    "vihaan":   ("Hey... लगता है मैं तुम्हारे hotspot से connected हूँ। चलेगा ना?",
                 [("A-Viraj-expressive", S, "3AMU7jXQuQa3oRvRqUmb"), ("B-Viraj-lively", F, "iWNf11sz1GrUE4ppxTOL"), ("C-Niraj-romantic", F, "zgqefOY5FPQ3bB7OZTVR")]),
    "zoya":     ("Relax yaar, roomie! बस engineering ही तो है... worst क्या हो सकता है?",
                 [("A-Nikita-excited", S, "7w5JDCUNbeKrn4ySFgfu"), ("B-Monika-friendly", S, "2bNrEsM0omyhLiEyOwqY"), ("C-Simran-bestie", None, "1ea3IFhmSWgw8sJkSvfJ")]),
    "dad":     ("Engineering. Final. ये तुम्हारे future के लिए है, बेटा।",
                 [("A-Raju-warm", F, "zT03pEAEi0VHKciJODfn"), ("B-Raghav-calm", S, "4BoDaQ6aygOP6fpsUmJe"), ("C-Sanjay-mature", None, "PboFIQ6kckfADmG3UQYF")]),
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
                             {"text": line, "model_id": "eleven_v3", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}})
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
