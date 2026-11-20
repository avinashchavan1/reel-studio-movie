# 🎨 Style Guide: "AI 2D Cartoon Story" look

> **LOCKED (2026-11-20): modern anime film look, generated locally with Z-Image on the user's Mac.**
> - Pipeline: `local-ai/` (ComfyUI + Z-Image full + Turbo, installed to `~/claude-projects/2-strangers/ai-studio`).
>   Drafts with Turbo (`run-mac.sh <char> -m zimage -s anime`), finals by `--refine` with the full model.
> - Approved leads: **Ishita option 2** (`out/ishita/ishita-anime-95592134.png`) and **Vihaan option 2**
>   (`out/vihaan/vihaan-anime-1723354399.png`). Sheets: `output/designs/`.
> - Supporting cast: Zoya draft done (`out/zoya/zoya-anime-204161517.png`); Tanvi, Appa, Amma in progress.
> - Everyone reads as their real age (leads 19–20); prompts live in `local-ai/characters.json`.
> - The 32 GB Mac runs Turbo at ~5 min/image; the full model needs Chrome closed (or an overnight Terminal run).

The look you shared is usually called an **AI 2D animated story** or **Indian cartoon illustration style**:
semi-realistic 2D, clean dark outlines, soft cel shading, warm daylight, detailed Indian streets and
campuses. Every scene is an AI image, animated with an image-to-video tool, then voiced and edited.

## The pipeline (per episode)

| Step | What | Best tools (pick one) |
|---|---|---|
| 1 | **Character sheets**: generate each character ONCE, then reuse that image as the reference in every scene | ChatGPT (image generation), Google Gemini, Ideogram, Leonardo |
| 2 | **Scene images**: one 9:16 image per shot, attach the character sheet(s) and paste the shot prompt | same tool as step 1 (consistency) |
| 3 | **Animate**: image-to-video, 5 seconds per shot, paste the motion prompt | Kling AI, Hailuo (MiniMax), Google Veo / Gemini, Meta AI, Runway |
| 4 | **Voice**: narrator plus character lines | ElevenLabs, Instagram's built-in text-to-speech, or your own voice (best) |
| 5 | **Assemble**: send me the clips and voice files and I'll cut the reel (crossfades, title banner, subtitles) | done here |

## Style block (paste at the END of every image prompt)

```
Style: semi-realistic 2D Indian cartoon illustration, clean bold black outlines, soft cel shading,
flat vibrant colors, warm natural daylight, detailed background, storybook webcomic look,
expressive faces, 9:16 vertical composition, no text except signboards, high detail.
```

## Locked character sheets (generate these FIRST)

Prompt format: `Character reference sheet, full body front view and 3/4 view, plain white background, <description>. <style block>`

**ISHITA (lead, 18)**: young Indian woman, slim, fair-wheatish skin, big expressive dark eyes, small black bindi,
long dark-brown hair in a low side-braid, small pink hair clip, simple gold stud earrings. Outfit: dusty-pink
salwar kurta with a matching pink dupatta, brown flat sandals, black college backpack. Shy, gentle expression.

**VIHAAN (lead, 18)**: young Indian man, lean, warm brown skin, short messy black hair with a slight quiff,
thick eyebrows, light stubble, confident half-smile. Outfit: sky-blue checked shirt, sleeves rolled, over a white
tee, dark jeans, white sneakers, grey backpack on one shoulder, wired earphones around his neck.

**ZOYA (best friend, 18)**: young Indian woman, round face, round black glasses, curly brown hair in a high bun,
cheerful wide grin. Outfit: lavender kurti, blue jeans, a tote bag, always holding a phone or snack.

**TANVI (classmate, 18)**: petite Indian girl, two short braids, mint-green kurti, white leggings, holding a phone.

**APPA (father, 50)**: Indian man, neat moustache, greying side hair, spectacles, cream half-sleeve shirt, strict but loving.

**AMMA (mother, 45)**: Indian woman, hair in a bun with jasmine flowers, green cotton saree with gold border, red bindi, warm worried smile.

## Recurring sets
- **Dharwad**: small Indian town lane, tiled-roof houses, a kirana shop, electric poles and wires, mango tree, autos and scooters.
- **Ishita's home**: modest living room, cream walls, wall calendar, framed family photo, steel tumblers on a table.
- **Dharwad station / Bangalore City station**: Indian railway platform, yellow edge line, departure board, two trains.
- **Bangalore**: busy Indian metro city, flyovers, glass towers, traffic, metro line.
- **Silicon Valley Institute of Technology**: big red-brick gate with the sign "SILICON VALLEY INSTITUTE OF TECHNOLOGY", a cream
  colonial-style main building, green lawns; **Lotus Block** (pink trim) and **Orchid Block** (blue trim).

## Title banner (same on every episode)
Navy box, white bold text: **Strangers to *Forever*** with "Forever" in gold, plus a small "Ep N" tag.
