// pipeline stage, derived from what exists (idea → scripted → voiced → rendered/review → approved → posted)
export function stageOf(ep) {
  const posts = Object.values(ep.posts || {}).filter(x => x && x.state === 'posted');
  if (posts.length) return 'posted';
  if (ep.review?.checked) return 'approved';
  if (ep.render) return 'review';
  const lines = ep.shots.flatMap(s => s.lines);
  if (lines.length && lines.every(l => l.audio && l.audio.text === l.text)) return 'voiced';
  if (lines.length) return 'scripted';
  return 'idea';
}
