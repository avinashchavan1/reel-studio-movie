# 🎬 Reel Studio: Strangers to Forever

A cute 2D animated Instagram-reel series, rendered from code (canvas, then Playwright, then ffmpeg).

- `STORY-BIBLE.md`: characters, environments, voice casting, episode guide
- `character-mindmap.mmd`: character and story mind map (Mermaid)
- `engine/`: drawing library (characters, sets, captions) and renderer
- `episodes/epNN.js`: one file per episode (scenes and timings)
- `output/`: rendered 1080×1920 MP4s
- `production/`: **AI 2D cartoon style** kit: style guide, locked character prompts, shot lists, and `assemble.py` to cut AI clips into the final reel

## Render
```bash
node engine/render.js ep01                    # → output/ep01.mp4
node engine/render.js ep01 --stills 2,10,20   # preview frames
```
Needs Node, Playwright (Chromium) and ffmpeg.
