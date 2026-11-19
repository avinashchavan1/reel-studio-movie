// Default knowledge base (editable in the app). Seeded once into project.json.
export const KNOWLEDGE = [
  { id: 'kb-hooks', title: 'Hooks: win the first 2 seconds', tags: ['viral', 'hook'], body: `People decide to stay or scroll in about 1 second. Every episode must open with a HOOK shot.

**Rules**
- Text on screen from frame 1 (big, 4–8 words). Never start on a blank or slow fade.
- First spoken word within 0.5–0.8s.
- Open a loop: a question the viewer needs answered.
- Start in the middle of the action or with the twist, then rewind ("3 saal pehle…").

**Hook formulas that work for love-story series**
1. Flash-forward: "Aaj hum shaadi kar rahe hain… par shuruaat ek WiFi hotspot se hui thi."
2. Mystery object: "Ek password-less hotspot ne meri zindagi badal di."
3. POV: "POV: tumhara future husband tumhara hotspot use kar raha hai 😭"
4. Contradiction: "Mujhe engineering nahi karni thi… aur wahi meri love story ban gayi."
5. Direct question: "Kya ek stranger ka friend request accept karna chahiye?"
6. Countdown: "Strangers se forever tak: Part 3."
7. Callback: "Pichle part mein hotspot connect hua tha… aaj kuch aur connect hua."` },
  { id: 'kb-retention', title: 'Retention: keep them till the end', tags: ['viral', 'editing'], body: `- Length: 20–45s per episode (sweet spot about 30s).
- Change the visual every 2–5s (new shot, zoom or camera move). No shot longer than 6.5s.
- Subtitles always on (most people watch muted). Big, high-contrast, inside the safe zone.
- Mix narration with character dialogue; real voices and emotions keep attention.
- Music: mood shifts per scene, ducked under voices; a sting or rise right before the cliffhanger.
- End on a cliffhanger plus "Next: Ep N". Never resolve the question in the same episode.
- Make the ending loop: the last frame should make sense going back into the first (boosts replays).` },
  { id: 'kb-series', title: 'Series strategy', tags: ['viral', 'growth'], body: `- Post as numbered parts ("Part 1", "Ep 1") so people binge and follow.
- Pin Part 1 to the top of the profile; create an Instagram highlight or YouTube playlist "Strangers to Forever".
- Post consistently: same time, every 1–2 days while the series is running.
- Reply to comments with the next part's teaser; ask viewers to guess what happens.
- Repost the best moment as a standalone teaser reel ("the hotspot moment").` },
  { id: 'kb-captions', title: 'Captions & hashtags', tags: ['viral', 'publish'], body: `**Caption formula:** Hook line + 1 line of context + question/CTA + "Follow for Part N".
Example: "He connected to my hotspot before he connected to my heart 📶❤️ Would YOU accept a stranger's request? 👇 Follow for Part 2"

**Hashtags (5–12):** mix big plus niche.
- Big: #lovestory #reels #trending #couplegoals
- Niche: #engineeringlove #collegelovestory #bangalorelove #strangerstolovers #animatedstory #hinglishstory
- Series tag: #StrangersToForever` },
  { id: 'kb-timing', title: 'Posting times (India)', tags: ['publish'], body: `- Best windows: 7–9 PM IST (prime), 12–2 PM IST (lunch), 9–11 PM on weekends.
- YouTube Shorts: same reel, add #Shorts and a searchable title.
- Instagram: share to feed ON, add the series cover, use a trending audio at low volume only if it doesn't fight the voices.` },
  { id: 'kb-style', title: 'Style guide', tags: ['production'], body: `- 1080×1920, 30fps. Keep text inside the safe zone: away from the top 250px and the bottom 420px (Instagram UI).
- Colour code: pink = Ishita's world, blue = Vihaan's world, purple = when they're together.
- Title banner: navy box, "Strangers to Forever", "Forever" in gold, with the episode tag.
- Language: Hinglish (Devanagari for Hindi, English words in English).
- Voice tags for eleven_v3: [softly], [warmly], [whispers], [sad], [cheerful], [firmly], [laughs], [pause].` },
  { id: 'kb-cast', title: 'Voice cast', tags: ['production', 'voice'], body: `- Narrator: Yatin (Sacred & Divine Love Storyteller). Warm, soothing male storyteller.
- Ishita: Tarini (Calm and Measured).
- Vihaan: Amit Gupta (Lover Boy Romantic).
- Zoya: Monika Sogam (Friendly and Reassuring).
- Appa: Shardul K (deep, authoritative).
- Amma, Tanvi: cast when they first speak.` },
  { id: 'kb-privacy', title: 'Privacy rules', tags: ['privacy'], body: `- Never use real names of people, the real hometown, or the real college. Real ↔ series names live only in the private name map (Settings → Privacy), never committed to git.
- Story dumps are auto-anonymized when saved.
- Every episode is leak-scanned before publishing; publishing is blocked if a real name is found.
- Avoid identifiable details: exact train numbers, real college logos, faces of real people.` },
  { id: 'kb-workflow', title: 'Production workflow', tags: ['production'], body: `1. Dump the story in **Story Inbox** (any language, as messy as you like).
2. Click **Ask Claude**, then tell Claude Code "check the studio". Claude writes the episode (hook, shots, Hinglish lines, moods, caption).
3. Review in **Episode Editor**: tweak lines, emotions, moods.
4. **Generate voices** (ElevenLabs), then **Generate score**.
5. Check the **Viral Score**; fix anything red.
6. **Render**, preview, and **Publish** or schedule (YouTube and Instagram direct; export pack for the rest).` },
];
