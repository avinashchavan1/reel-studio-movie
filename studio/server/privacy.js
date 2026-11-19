// Real-name protection: replace real names with series names, and scan text for leaks.
import { priv } from './store.js';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getNameMap = () => priv.read('name-map', []);
export const setNameMap = m => priv.write('name-map', m.filter(x => x.real && x.series));

function pattern(real) { return new RegExp(`(?<![\\p{L}])${esc(real)}(?![\\p{L}])`, 'giu'); }

export function anonymize(text, map = getNameMap()) {
  let out = text; const replaced = [];
  for (const m of [...map].sort((a, b) => b.real.length - a.real.length)) {
    const re = pattern(m.real);
    if (re.test(out)) { replaced.push({ real: m.real, series: m.series }); out = out.replace(pattern(m.real), m.series); }
  }
  return { text: out, replaced };
}

export function findLeaks(text, map = getNameMap()) {
  return [...new Set(map.filter(m => m.real.length > 2 && pattern(m.real).test(text)).map(m => m.real))];
}

// every piece of text in an episode that will be visible/audible when published
export function episodeText(ep) {
  const parts = [ep.title, ep.synopsis, ep.publish?.caption, ep.publish?.youtubeTitle, (ep.publish?.hashtags || []).join(' ')];
  for (const s of ep.shots) { parts.push(s.caption, JSON.stringify(s.params || {})); for (const l of s.lines) parts.push(l.text, l.subtitle); }
  return parts.filter(Boolean).join('\n');
}
export const scanEpisode = ep => findLeaks(episodeText(ep));
