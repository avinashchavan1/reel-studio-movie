# Style sampler: gentle romantic bed + a soft whoosh/chime at every style change.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audiolib import *

B = beats(); cue = B['cues']; D = B['duration']
mx = Mix(D)
bar = 60 / 84 * 4                                  # 84 bpm, warm and slow
F, Am, Dm, Bb, C = 65, 69, 62, 70, 60
chords = [(F, 'add9'), (Am, 'm7'), (Dm, 'm7'), (Bb, 'M7'), (F, 'add9'), (C, 'sus4')]
prog = [(0.1 + i * bar, bar, *chords[i % len(chords)]) for i in range(int(D / bar) + 1) if 0.1 + i * bar < D]
mx.pads(prog, 0.32, cut=1600)
mx.arp(prog, bar / 8, 0.16, kalimba, 65, 84, (0, 2, 4, 2, 1, 3, 4, 3))
mx.bassline(prog, 0.35, every=bar / 2, dec=4)
for i in range(20):
    t = cue[f's{i + 1}']
    if i: mx.sfx(t - 0.25, whoosh(0.45, True, 0.25), 1, 0.0)
    mx.music(t + 0.08, bell(mf(84 + (i % 3) * 3), 2.2), 0.22)
mx.sfx(cue['s16'] + 0.3, powerup(1.2, 0.3), 1, 0.0)    # neon sign
mx.write(sys.argv[1] if len(sys.argv) > 1 else 'build/audio.wav', fade_out=1.0)
