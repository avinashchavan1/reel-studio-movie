// One-time seed: series, cast, places, knowledge base and Episode 1 (with the voices already recorded).
import fs from 'fs';
import path from 'path';
import { load, save, priv, MEDIA, REPO, mediaUrl, newId } from './store.js';
import { duration, envelope } from './audio.js';
import { KNOWLEDGE } from './knowledge.js';

if (load() && !process.argv.includes('--force')) { console.log('project.json already exists (use --force to overwrite)'); process.exit(0); }

const characters = [
  { id: 'narrator', name: 'Narrator', role: 'narrator', description: 'Older-and-wiser storyteller voice', color: '#ffc93c', look: null, voice: { id: 'zlREppBW1FE7WsYs43Sz', name: 'Yatin – Sacred & Divine Love Storyteller', model: 'eleven_v3' } },
  { id: 'ishita', name: 'Ishita', role: 'lead', description: 'Shy, kind small-town girl pushed into engineering. Pink salwar kurta, long braid, pink hair clip.', color: '#ff8fab', look: 'tara', voice: { id: 'kiaJRdXJzloFWi6AtFBf', name: 'Tarini – Calm and Measured', model: 'eleven_v3' } },
  { id: 'vihaan', name: 'Vihaan', role: 'lead', description: 'Calm, cheeky, confident. Sky-blue shirt, messy hair, earphones round his neck.', color: '#6ea8fe', look: 'kabir', voice: { id: 'GhcgqZ83VDU5cWonBdAL', name: 'Amit Gupta – Lover Boy Romantic', model: 'eleven_v3' } },
  { id: 'zoya', name: 'Zoya', role: 'friend', description: "Ishita's roommate and best friend. Loud, loyal, round glasses, high bun.", color: '#b69cff', look: 'zoya', voice: { id: '2bNrEsM0omyhLiEyOwqY', name: 'Monika Sogam – Friendly', model: 'eleven_v3' } },
  { id: 'tanvi', name: 'Tanvi', role: 'classmate', description: 'Chatty classmate, always on 1% battery. Borrowed the hotspot.', color: '#9be3c4', look: 'pihu', voice: null },
  { id: 'appa', name: 'Appa', role: 'parent', description: 'Strict but loving father. Moustache, orange shirt.', color: '#ffb347', look: 'appa', voice: { id: '6EphsklDopDQ6eRkwNHT', name: 'Shardul K – Deep, Authoritative', model: 'eleven_v3' } },
  { id: 'amma', name: 'Amma', role: 'parent', description: 'Caring mother, green saree, jasmine in her hair.', color: '#4fc08d', look: 'amma', voice: null },
];
const places = [
  { id: 'hometown', name: 'Hometown (to choose)', scene: 'town', description: 'Small Karnataka town: tiled roofs, mango tree, kirana shop.' },
  { id: 'home', name: "Ishita's home", scene: 'room', description: 'Modest living room, family photo, window with curtains.' },
  { id: 'train', name: 'Train to Bangalore', scene: 'train', description: 'Pink train at sunset, city rising in the distance.' },
  { id: 'bangalore', name: 'Bangalore', scene: 'city', description: 'Big city: towers, traffic, lights.' },
  { id: 'svit', name: 'Silicon Valley Institute of Technology', scene: 'college', description: 'Grand campus; Lotus Block (pink) and Orchid Block (blue).' },
  { id: 'hostel', name: 'Girls hostel room', scene: 'hostel', description: 'Two beds, fairy lights, posters.' },
  { id: 'station', name: 'Railway platform', scene: 'station', description: 'Two platforms, two trains.' },
];

const L = (speaker, text, emotion = 'neutral', audioFile) => ({ id: newId('ln_'), speaker, text, emotion, _audio: audioFile });
const S = (template, o) => ({ id: newId('sh_'), template, location: '', characters: [], mood: 'dreamy', minDuration: 3, params: {}, lines: [], ...o });
const shots = [
  S('hook', { characters: ['ishita', 'vihaan'], mood: 'tension', minDuration: 3, params: { hook: 'Ek WiFi hotspot ne do strangers ko mila diya...' },
    lines: [L('narrator', '[softly] दो अजनबी... एक ही शहर... एक ही college... [pause] और उन्हें बिल्कुल पता नहीं था... [warmly] कि वो एक-दूसरे के लिए ही बने थे।', 'neutral', '01-narrator.mp3')] }),
  S('scene', { location: 'hometown', characters: ['ishita'], mood: 'homely', params: { showLocation: true },
    lines: [L('narrator', '[warmly] ये है Ishita. एक छोटे से शहर की सीधी-सादी लड़की... जिसके सपने छोटे थे, पर बहुत प्यारे।')] }),
  S('scene', { location: 'home', characters: ['ishita', 'amma', 'appa'], mood: 'emotional',
    lines: [L('appa', '[firmly] Engineering. Final. ये तुम्हारे future के लिए है, बेटा।', 'firm', '03-appa.mp3'), L('ishita', '[sad, softly] लेकिन Appa... मुझे engineering कभी करनी ही नहीं थी।', 'sad', '04-ishita.mp3')] }),
  S('train', { location: 'train', characters: ['ishita'], mood: 'journey', lines: [L('narrator', '[gently] एक suitcase... और भारी दिल के साथ... वो निकल पड़ी Bangalore की तरफ़।', 'neutral', '05-narrator.mp3')] }),
  S('scene', { location: 'bangalore', characters: ['ishita'], mood: 'city', params: { showLocation: true }, lines: [L('narrator', '[amazed] सब कुछ इतना बड़ा... इतना तेज़... इतना नया था।', 'neutral', '06-narrator.mp3')] }),
  S('scene', { location: 'svit', characters: ['ishita', 'zoya'], mood: 'playful', lines: [L('zoya', '[cheerful] Relax yaar, roomie! बस engineering ही तो है... worst क्या हो सकता है?', 'happy', '07-zoya.mp3')] }),
  S('split', { characters: ['ishita', 'vihaan'], mood: 'tension', params: { left: { label: 'LOTUS BLOCK', sub: 'Section 7' }, right: { label: 'ORCHID BLOCK', sub: 'Section 1' } },
    lines: [L('narrator', 'एक ही college. अलग-अलग blocks. [pause] बिल्कुल अजनबी।', 'neutral', '08-narrator.mp3')] }),
  S('cliffhanger', { mood: 'cliffhanger', minDuration: 4.5, params: { text: ['Lekin ek chhoti si cheez...', 'sab kuch badalne wali thi...'], next: 'EP 2 · THE SMARTPHONE' },
    lines: [L('narrator', '[whispers] लेकिन एक छोटी सी चीज़... सब कुछ बदलने वाली थी।', 'neutral', '09-narrator.mp3')] }),
];

const voiceDir = path.join(REPO, 'production', 'voices', 'ep01');
for (const s of shots) for (const l of s.lines) {
  const src = l._audio && path.join(voiceDir, l._audio); delete l._audio;
  if (!src || !fs.existsSync(src)) continue;
  const dst = path.join(MEDIA, 'audio', `seed-ep01-${path.basename(src)}`); fs.copyFileSync(src, dst);
  l.audio = { url: mediaUrl(dst), duration: await duration(dst), env: await envelope(dst), text: l.text, at: new Date().toISOString() };
}

const project = {
  version: 1,
  series: { title: 'Strangers to Forever', tagline: 'From strangers to lifetime partners', language: 'Hinglish', handle: '', hashtags: ['StrangersToForever', 'lovestory', 'collegelove', 'engineeringlove', 'bangalorelove', 'animatedstory', 'hinglishstory', 'reels', 'couplegoals'],
    musicStyle: ['Indian cinematic romance', 'instrumental', 'piano', 'strings', 'flute'] },
  characters, places, stories: [], claudeRequests: [],
  knowledge: KNOWLEDGE,
  episodes: [{
    id: 'ep_01', num: 1, title: 'Two Strangers', status: 'voiced', createdAt: new Date().toISOString(),
    synopsis: 'Ishita, a small-town girl, is pushed into engineering and moves to Bangalore. Same college as Vihaan, but different blocks. Total strangers.',
    shots, musicVolume: 0.22,
    publish: { caption: 'Ek WiFi hotspot ne do strangers ko mila diya 📶❤️ Ye hai Part 1 of our story. Kya aap ek stranger ka friend request accept karoge? 👇 Follow for Part 2 ✨',
      hashtags: ['StrangersToForever', 'lovestory', 'collegelove', 'engineeringlove', 'bangalorelove', 'animatedstory', 'hinglishstory', 'reels'],
      youtubeTitle: 'Strangers to Forever, Ep 1: Two Strangers 💕 #Shorts', youtubePrivacy: 'public', history: [], scheduled: [] },
  }],
};
save(project);
// Real names are never in code. Import them from the git-ignored PRIVATE-name-map.md if present.
const privMd = path.join(REPO, 'PRIVATE-name-map.md');
if (!fs.existsSync(path.join(MEDIA, '..', 'private', 'name-map.json')) && fs.existsSync(privMd)) {
  const rows = fs.readFileSync(privMd, 'utf8').split('\n').map(l => l.match(/^\|\s*([^|*]+?)\s*\|\s*\*\*([^*]+)\*\*/)).filter(Boolean)
    .filter(m => !/^Real$/i.test(m[1]) && !m[2].includes('<'));
  priv.write('name-map', rows.map(m => ({ real: m[1], series: m[2], kind: 'other' })));
}
console.log('Seeded project with', characters.length, 'characters,', places.length, 'places, Episode 1 with', shots.length, 'shots.');
