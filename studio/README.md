# 🎬 Reel Studio

The production studio for **Strangers to Forever**: dump story, write episodes with Claude, generate voices and a background score, render animated reels, and publish to Instagram, YouTube and more.

## Run it

```bash
cd studio
npm install
npm i -D playwright && npx playwright install chromium   # renderer (skip if Playwright is already installed)
npm run seed        # first time only: loads the series, cast, knowledge base and Episode 1
ELEVENLABS_API_KEY=... npm run dev
```
Open http://localhost:5173. You also need **ffmpeg** on your PATH.

## What's inside

| Page | What it does |
|---|---|
| **Dashboard** | Production board (draft → published), ElevenLabs balance, Claude queue, schedule, jobs |
| **Story Inbox** | Paste raw story. Real names are swapped for series names automatically. "Ask Claude" queues writing requests |
| **Episodes / Editor** | Shots (drag to reorder), templates (Hook, Scene, Journey, Split, Cliffhanger), places, on-screen cast, per-shot music mood, lines with emotion + voice tags, Hinglish voice script + English on-screen text, per-line voice generation, **Viral Score**, frame previews, render |
| **Cast / Places** | Character looks (live preview), colors, voices; places mapped to backdrops |
| **Voice Lab** | Search the ElevenLabs library, audition with your own line, add voices |
| **Publish** | Caption, hashtags, per-platform CTA, publish now or schedule; YouTube + Instagram direct, export packs for Facebook / TikTok / Moj / Josh / Snapchat |
| **Knowledge** | Editable playbook: hooks, retention, captions, posting times, style, cast, privacy |
| **Settings** | Series info, YouTube / Instagram connections, private name map |

**Two cuts per render:** the Instagram cut ends with **FOLLOW**, the YouTube cut ends with **SUBSCRIBE**.

## Writing with Claude (no API cost)
Click **Ask Claude** in Story Inbox, then tell Claude Code **"check the studio"**. Claude reads `data/project.json`, writes the episode, and marks the request done.

## Privacy
- `data/private/` (name map, tokens, integration secrets) is git-ignored and never leaves the machine.
- Story dumps are anonymized on save; rendering and publishing are blocked if a real name appears.

## Deploy (Railway / Render)
Build from the repo root with `studio/Dockerfile`, mount a persistent volume at `/app/studio/data`, and set:
`STUDIO_PASSWORD` (required, locks the studio), `ELEVENLABS_API_KEY`.
