// Viral score: a retention checklist run against an episode's timeline.
import { stripTags } from './render.js';

export function viralReport(ep, timeline) {
  const checks = [];
  const add = (id, label, ok, tip, weight = 1) => checks.push({ id, label, ok: !!ok, tip, weight });
  const first = timeline.shots[0];
  const firstLine = first?.lines[0];
  const allLines = timeline.shots.flatMap(s => s.lines);
  const last = timeline.shots[timeline.shots.length - 1];

  add('hook-shot', 'Opens with a hook shot', first?.template === 'hook', 'Start with the "Hook" template: one bold line on screen from frame 1.', 3);
  add('hook-text', 'Hook text on screen in the first second', !!(first?.params?.hook), 'Write a 4–8 word hook that creates a question: "उसने मेरे hotspot से connect किया…"', 3);
  add('hook-fast', 'First words spoken within 0.8s', firstLine && firstLine.start <= 0.8, 'Cut the silence at the start; viewers decide in about 1 second.', 2);
  add('hook-short', 'Hook line is short (under 12 words)', firstLine && stripTags(firstLine.text).split(/\s+/).length <= 12, 'Shorten the first line to one punchy sentence.', 2);
  add('length', 'Total length 20–45s', timeline.total >= 20 && timeline.total <= 45, `Currently ${timeline.total.toFixed(1)}s. 20–45s keeps completion rate high for story series.`, 2);
  add('pace', 'No shot longer than 6.5s', timeline.shots.every(s => s.dur <= 6.5), 'Split long shots; a visual change every 2–5s holds attention.', 2);
  add('dialogue', 'Has character dialogue (not only narration)', allLines.some(l => l.speaker !== 'narrator'), 'Add at least one spoken character line; voices > narration.', 1);
  add('voices', 'All lines voiced', allLines.every(l => l.env && l.env.length), 'Generate missing voices.', 1);
  add('music', 'Background score added', !!ep.music?.url, 'Generate the mood-matched score.', 1);
  add('cliffhanger', 'Ends on a cliffhanger', last?.template === 'cliffhanger', 'End with the "Cliffhanger" template and an unanswered question.', 3);
  add('next', 'Teases the next episode', !!last?.params?.next, 'Add "Next: Ep N" on the last shot so people follow.', 2);
  add('caption', 'Caption has a question/CTA', /\?|follow|comment|part/i.test(ep.publish?.caption || ''), 'End the caption with a question or "Follow for Part N".', 1);
  add('hashtags', '5–12 hashtags', (ep.publish?.hashtags || []).length >= 5 && (ep.publish?.hashtags || []).length <= 12, 'Use 5–12 focused hashtags (mix big + niche).', 1);
  add('subs', 'On-screen text in English letters', allLines.every(l => !/[\u0900-\u097F]/.test(l.text)), 'Add English-letter on-screen text for every line (most viewers read along).', 2);
  add('series', 'Episode number visible', true, '', 0);

  const total = checks.reduce((a, c) => a + c.weight, 0);
  const got = checks.reduce((a, c) => a + (c.ok ? c.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks };
}
