# Strangers to Forever: working rules for Claude

This repo is the production studio for an animated Hinglish love-story reel series.
Claude is the writer, voice director, animator and editor; the user publishes from the Publish Hub.

## Never lose data (standing instruction from the user)
- After EVERY change (new episode, re-render, voices, score, studio code, docs, plan/profile edits), run:
  1. `cd studio && npm run prune` (removes superseded media so the repo stays lean)
  2. privacy check: `git grep -I -i -w <name> HEAD` for every PERSON name in PRIVATE-name-map.md must return nothing
     (Bangalore is kept real by choice; Facebook only appears as a publishing platform)
  3. `git add -A && git commit` (with the session attribution lines) and `git push`
- Finished reels ARE committed: `studio/data/media/renders/` (both cuts + posters), voices (`audio/`), scores (`music/`), and copies in `output/`.
- `studio/data/project.json` is the single source of truth for series, cast, places, plan, calendar, profiles, stats, episodes.

## Privacy (the repo is PUBLIC)
- Real names, the real hometown and the real college never go into git, code, renders, captions or the hub.
- Real ↔ series names live only in `PRIVATE-name-map.md` and `studio/data/private/` (both git-ignored).
- Series names: Ishita (lead), Vihaan (lead), Zoya (roommate), Tanvi (classmate), Appa, Amma. Hometown: Dharwad. City: Bangalore. College: Silicon Valley Institute of Technology.

## Workflow
- Studio: `cd studio && node --no-warnings server/index.js` (API :5174) and `npx vite` (UI :5173).
- Voices: ElevenLabs, model eleven_v3, Hinglish voice script in Devanagari + English-letter on-screen text (`subtitle`).
  Cast voices are in `studio/data/project.json` → characters[].voice.
- Every episode: hook shot first (text on screen from frame 1) → scenes → cliffhanger with NEXT + platform CTA.
  Target 30–45s, no shot over 6.5s, Viral Score ≥ 90 (`GET /api/episodes/:id/analysis`).
- Render both cuts: `POST /api/episodes/:id/render` (Instagram ends FOLLOW, YouTube ends SUBSCRIBE).
- Publish Hub (Netlify, PIN-locked): `cd studio && npm run hub` after any new render.
  URL: https://stf-hub-f82adfcb.netlify.app
- "Check the studio" = process pending `claudeRequests` in project.json (write episodes from story dumps, plan the season, punch up hooks), then mark them done with a short `result`.
