#!/usr/bin/env python3
"""Join AI-generated shot clips into a finished reel.

Usage: python3 production/assemble.py EP_NUM shot1.mp4 shot2.mp4 ... [--vo voice.mp3] [--music music.mp3] [-o out.mp4]

- scales/crops every clip to 1080x1920, 30fps
- 0.5s crossfades between shots
- fixed "Strangers to Forever" title banner + "Ep N" tag
- mixes voiceover (full volume) and music (low) if given
"""
import argparse, subprocess, json

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
XF = 0.5

def dur(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", p],
                         capture_output=True, text=True, check=True).stdout
    return float(json.loads(out)["format"]["duration"])

ap = argparse.ArgumentParser()
ap.add_argument("ep", type=int); ap.add_argument("clips", nargs="+")
ap.add_argument("--vo"); ap.add_argument("--music"); ap.add_argument("-o", default=None)
a = ap.parse_args()
out = a.o or f"output/ep{a.ep:02d}-final.mp4"

inputs, filt = [], []
for i, c in enumerate(a.clips):
    inputs += ["-i", c]
    filt.append(f"[{i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,format=yuv420p[v{i}]")
durs = [dur(c) for c in a.clips]
last, offset = "v0", 0.0
for i in range(1, len(a.clips)):
    offset += durs[i - 1] - XF
    filt.append(f"[{last}][v{i}]xfade=transition=fade:duration={XF}:offset={offset:.3f}[x{i}]")
    last = f"x{i}"
total = sum(durs) - XF * (len(a.clips) - 1)
banner = (f"drawbox=x=110:y=300:w=860:h=120:color=0x0b1a7a@1:t=fill,"
          f"drawbox=x=110:y=300:w=860:h=120:color=white@1:t=4,"
          f"drawtext=fontfile={FONT}:text='Strangers to':fontcolor=white:fontsize=62:x=150:y=328,"
          f"drawtext=fontfile={FONT}:text='Forever':fontcolor=0xffc93c:fontsize=62:x=615:y=328,"
          f"drawbox=x=880:y=430:w=90:h=50:color=0xff5d8f@1:t=fill,"
          f"drawtext=fontfile={FONT}:text='Ep {a.ep}':fontcolor=white:fontsize=30:x=893:y=440")
filt.append(f"[{last}]{banner}[vout]")

n = len(a.clips); amaps = []
if a.vo:
    inputs += ["-i", a.vo]; amaps.append(f"[{n}:a]volume=1.0[vo]"); n += 1
if a.music:
    inputs += ["-stream_loop", "-1", "-i", a.music]; amaps.append(f"[{n}:a]volume=0.18[mu]"); n += 1
if len(amaps) == 2:
    filt += amaps + ["[vo][mu]amix=inputs=2:duration=first:dropout_transition=0[aout]"]
elif len(amaps) == 1:
    filt += [amaps[0].rsplit("[", 1)[0] + "[aout]"]

cmd = ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[vout]"]
if amaps:
    cmd += ["-map", "[aout]", "-c:a", "aac", "-b:a", "192k"]
cmd += ["-t", f"{total:.3f}", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", out]
subprocess.run(cmd, check=True)
print(f"wrote {out} ({total:.1f}s from {len(a.clips)} shots)")
