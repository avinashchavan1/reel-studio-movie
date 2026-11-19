import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, Copy, Film, GripVertical, Mic, Music, Plus, RefreshCw, Send, ShieldAlert, Trash2, Wand2, XCircle } from 'lucide-react';
import { api, Episode, Line, newId, Project, Shot, stripTags, useAct, useAnalysis, useJobs } from '../api';
import { Badge, Button, Card, Field, Input, PlayButton, Progress, Select, Textarea } from '../components/ui';

const TEMPLATES = [
  { value: 'hook', label: '⚡ Hook (first shot)' }, { value: 'scene', label: '🎬 Scene' }, { value: 'train', label: '🚆 Journey' },
  { value: 'split', label: '↔️ Split screen' }, { value: 'cliffhanger', label: '🌙 Cliffhanger (last shot)' },
];
const EMOTIONS = ['neutral', 'happy', 'sad', 'shocked', 'firm', 'blush', 'angry'].map(v => ({ value: v, label: v }));
const TAGS = ['[softly]', '[warmly]', '[whispers]', '[sad]', '[cheerful]', '[firmly]', '[laughs]', '[excited]', '[pause]'];

export default function EpisodeEditor({ p }: { p: Project }) {
  const { id } = useParams(); const nav = useNavigate();
  const server = p.episodes.find(e => e.id === id);
  const [ep, setEp] = useState<Episode | undefined>(server);
  const dirty = useRef(false); const timer = useRef<number>();
  const [saving, setSaving] = useState(false);
  const { data: analysis, refetch: reanalyse } = useAnalysis(id);
  const { data: jobs } = useJobs();
  const [stills, setStills] = useState<string[]>([]); const [cut, setCut] = useState('instagram');

  useEffect(() => { if (server && !dirty.current) setEp(server); }, [server]);
  const save = async (next: Episode) => {
    setSaving(true);
    try { await api(`/episodes/${next.id}`, { method: 'PUT', body: next }); dirty.current = false; reanalyse(); } finally { setSaving(false); }
  };
  const change = (fn: (e: Episode) => void) => {
    setEp(prev => { if (!prev) return prev; const next: Episode = JSON.parse(JSON.stringify(prev)); fn(next); dirty.current = true;
      clearTimeout(timer.current); timer.current = window.setTimeout(() => save(next), 700); return next; });
  };
  const flush = async () => { clearTimeout(timer.current); if (dirty.current && ep) await save(ep); };

  const voices = useAct(async () => { await flush(); return api(`/episodes/${id}/voices`, { body: {} }); }, { success: 'Generating voices…', invalidate: ['jobs'] });
  const music = useAct(async () => { await flush(); return api(`/episodes/${id}/music`, { body: {} }); }, { success: 'Composing background score…', invalidate: ['jobs'] });
  const render = useAct(async () => { await flush(); return api(`/episodes/${id}/render`, { body: {} }); }, { success: 'Rendering Instagram + YouTube cuts…', invalidate: ['jobs'] });
  const preview = useAct(async () => { await flush(); const r = await api<{ stills: string[] }>(`/episodes/${id}/stills`, { body: {} }); setStills(r.stills); return r; }, { invalidate: [] });
  const voiceOne = useAct(async ({ shotId, lineId }: { shotId: string; lineId: string }) => { await flush(); return api(`/episodes/${id}/lines/${shotId}/${lineId}/voice`, { body: { force: true } }); }, { success: 'Voice updated', invalidate: ['project', 'analysis', 'credits'] });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    change(d => { const a = d.shots.findIndex(s => s.id === e.active.id), b = d.shots.findIndex(s => s.id === e.over!.id); d.shots = arrayMove(d.shots, a, b); });
  };
  const running = (jobs || []).filter(j => (j.status === 'running' || j.status === 'queued') && j.label.includes(`Ep ${ep?.num}`));
  const timing = useMemo(() => Object.fromEntries((analysis?.shots || []).map(s => [s.id, s])), [analysis]);

  if (!ep) return <div className="text-zinc-400">Episode not found. <Link className="text-pink-300" to="/episodes">Back</Link></div>;
  const renders = ep.renders || (ep.render ? { instagram: ep.render } : {});
  const shownCut = renders[cut] || Object.values(renders)[0];
  const unvoiced = ep.shots.reduce((a, s) => a + s.lines.filter(l => !l.audio || l.audio.text !== l.text).length, 0);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Button variant="ghost" onClick={() => nav('/episodes')} icon={<ArrowLeft className="size-4" />} />
        <span className="text-sm text-zinc-400">Ep</span>
        <Input type="number" className="!w-16" value={ep.num} onChange={e => change(d => { d.num = Number(e.target.value); })} />
        <Input className="!w-auto flex-1 min-w-48 text-lg font-semibold" value={ep.title} onChange={e => change(d => { d.title = e.target.value; })} />
        <Select className="!w-36" value={ep.status} onChange={e => change(d => { d.status = e.target.value; })} options={['draft', 'voiced', 'rendered', 'scheduled', 'published'].map(v => ({ value: v, label: v }))} />
        <span className="text-xs text-zinc-500 w-16">{saving ? 'Saving…' : dirty.current ? 'Unsaved' : 'Saved'}</span>
      </div>

      <div className="grid xl:grid-cols-[1fr_380px] gap-5">
        <div className="space-y-4 min-w-0">
          <Card><Field label="Synopsis (what happens in this part)"><Textarea rows={2} value={ep.synopsis} onChange={e => change(d => { d.synopsis = e.target.value; })} /></Field></Card>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ep.shots.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {ep.shots.map((s, i) => (
                <ShotCard key={s.id} p={p} shot={s} index={i} timing={timing[s.id]}
                  onChange={fn => change(d => { fn(d.shots.find(x => x.id === s.id)!); })}
                  onDelete={() => change(d => { d.shots = d.shots.filter(x => x.id !== s.id); })}
                  onDuplicate={() => change(d => { const c = JSON.parse(JSON.stringify(s)); c.id = newId('sh_'); c.lines.forEach((l: Line) => { l.id = newId('ln_'); }); d.shots.splice(i + 1, 0, c); })}
                  onVoice={lineId => voiceOne.mutate({ shotId: s.id, lineId })} voicing={voiceOne.isPending} />
              ))}
            </SortableContext>
          </DndContext>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => <Button key={t.value} size="sm" icon={<Plus className="size-3.5" />} onClick={() => change(d => {
              const shot: Shot = { id: newId('sh_'), template: t.value, location: p.places[0]?.id || '', characters: [], mood: t.value === 'cliffhanger' ? 'cliffhanger' : t.value === 'hook' ? 'tension' : 'dreamy', minDuration: 3, params: t.value === 'hook' ? { hook: '' } : t.value === 'cliffhanger' ? { text: [], next: `EP ${d.num + 1}` } : t.value === 'split' ? { left: { label: '', sub: '' }, right: { label: '', sub: '' } } : {}, lines: [] };
              if (t.value === 'hook') d.shots.unshift(shot); else if (t.value !== 'cliffhanger' && d.shots[d.shots.length - 1]?.template === 'cliffhanger') d.shots.splice(d.shots.length - 1, 0, shot); else d.shots.push(shot);
            })}>{t.label}</Button>)}
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 self-start">
          <Card title="Viral score" subtitle={analysis ? `${analysis.duration.toFixed(1)}s total` : '…'}>
            {analysis && <>
              <div className="flex items-center gap-4 mb-3">
                <div className="relative size-20">
                  <svg viewBox="0 0 36 36" className="size-20 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" /><circle cx="18" cy="18" r="15.5" fill="none" stroke={analysis.viral.score >= 85 ? '#34d399' : analysis.viral.score >= 65 ? '#fbbf24' : '#fb7185'} strokeWidth="3" strokeDasharray={`${analysis.viral.score * .974} 100`} strokeLinecap="round" /></svg>
                  <div className="absolute inset-0 grid place-items-center text-xl font-bold text-white">{analysis.viral.score}</div>
                </div>
                <p className="text-xs text-zinc-400 flex-1">Retention checklist: hook, pace, length, cliffhanger, CTA. Fix the red items before publishing.</p>
              </div>
              <ul className="space-y-1.5 max-h-64 overflow-auto pr-1">
                {analysis.viral.checks.filter(c => c.weight > 0).sort((a, b) => Number(a.ok) - Number(b.ok)).map(c => (
                  <li key={c.id} className="flex gap-2 text-xs"><span className="mt-0.5">{c.ok ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <XCircle className="size-3.5 text-rose-400" />}</span>
                    <span><span className={c.ok ? 'text-zinc-400' : 'text-zinc-100'}>{c.label}</span>{!c.ok && <span className="block text-zinc-500">{c.tip}</span>}</span></li>))}
              </ul>
              {analysis.leaks.length > 0 && <div className="mt-3 flex gap-2 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/30 p-2 text-xs text-rose-200"><ShieldAlert className="size-4 shrink-0" />Real names found: {analysis.leaks.join(', ')}. Rendering and publishing are blocked.</div>}
            </>}
          </Card>

          <Card title="Production">
            <div className="grid gap-2">
              <Button onClick={() => voices.mutate()} loading={voices.isPending} icon={<Mic className="size-4" />}>Generate voices {unvoiced ? `(${unvoiced} missing)` : '✓'}</Button>
              <Button onClick={() => music.mutate()} loading={music.isPending} icon={<Music className="size-4" />}>{ep.music ? 'Regenerate background score' : 'Generate background score'}</Button>
              {ep.music && <div className="flex items-center gap-2"><PlayButton src={ep.music.url} label="Score" /><span className="text-[11px] text-zinc-500 flex-1">{ep.music.duration.toFixed(0)}s · {ep.music.plan.length} mood sections{analysis && Math.abs(ep.music.forDuration - analysis.duration) > 1.5 && <span className="text-amber-300"> · timing changed, regenerate</span>}</span></div>}
              <Field label={`Music volume ${Math.round((ep.musicVolume ?? .22) * 100)}%`}><input type="range" min={0} max={0.6} step={0.01} value={ep.musicVolume ?? .22} onChange={e => change(d => { d.musicVolume = Number(e.target.value); })} className="w-full accent-pink-500" /></Field>
              <Button onClick={() => preview.mutate()} loading={preview.isPending} icon={<Camera className="size-4" />}>Preview frames</Button>
              <Button variant="primary" onClick={() => render.mutate()} loading={render.isPending} disabled={!!analysis?.leaks.length} icon={<Film className="size-4" />}>Render reel (Insta + YouTube)</Button>
              {running.map(j => <div key={j.id}><div className="flex justify-between text-[11px] text-zinc-400"><span>{j.label}</span><span>{Math.round(j.progress * 100)}%</span></div><Progress value={j.progress} /></div>)}
            </div>
          </Card>

          {stills.length > 0 && <Card title="Frames" actions={<Button size="sm" variant="ghost" onClick={() => setStills([])}>Hide</Button>}><div className="grid grid-cols-4 gap-1.5">{stills.map(s => <a key={s} href={s} target="_blank"><img src={s} className="rounded-md" /></a>)}</div></Card>}

          {shownCut && (
            <Card title="Latest render" subtitle={new Date(shownCut.at).toLocaleString()} actions={<Link to={`/publish/${ep.id}`}><Button size="sm" variant="primary" icon={<Send className="size-3.5" />}>Publish</Button></Link>}>
              <div className="flex gap-1 mb-2">{Object.keys(renders).map(v => <Button key={v} size="sm" variant={cut === v ? 'primary' : 'ghost'} onClick={() => setCut(v)}>{p.variants[v]?.label || v}</Button>)}</div>
              <video key={shownCut.url} src={shownCut.url} poster={shownCut.poster} controls playsInline className="w-full rounded-xl aspect-[9/16] bg-black" />
              <a href={shownCut.url} download className="text-xs text-pink-300 mt-2 inline-block">Download MP4</a>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function ShotCard({ p, shot, index, timing, onChange, onDelete, onDuplicate, onVoice, voicing }: {
  p: Project; shot: Shot; index: number; timing?: { start: number; dur: number }; voicing: boolean;
  onChange: (fn: (s: Shot) => void) => void; onDelete: () => void; onDuplicate: () => void; onVoice: (lineId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: shot.id });
  const speakers = p.characters.map(c => ({ value: c.id, label: c.name + (c.voice ? '' : ' (no voice)') }));
  const visual = p.characters.filter(c => c.look);
  const long = timing && timing.dur > 6.5;
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={clsx('rounded-2xl bg-zinc-900/70 ring-1 backdrop-blur', isDragging ? 'ring-pink-500 z-10 relative' : 'ring-white/[.07]')}>
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
        <button {...attributes} {...listeners} className="cursor-grab text-zinc-500 hover:text-zinc-200 touch-none"><GripVertical className="size-4" /></button>
        <span className="text-xs font-semibold text-zinc-400">#{index + 1}</span>
        <Select className="!w-48 !py-1.5" value={shot.template} onChange={e => onChange(s => { s.template = e.target.value; })} options={TEMPLATES} />
        {['scene', 'train'].includes(shot.template) && <Select className="!w-52 !py-1.5" value={shot.location} onChange={e => onChange(s => { s.location = e.target.value; })} options={[{ value: '', label: '— place —' }, ...p.places.map(pl => ({ value: pl.id, label: pl.name }))]} />}
        <Select className="!w-44 !py-1.5" value={shot.mood} onChange={e => onChange(s => { s.mood = e.target.value; })} options={Object.entries(p.moods).map(([k, m]) => ({ value: k, label: '♪ ' + m.label }))} />
        {timing && <Badge tone={long ? 'error' : undefined}>{timing.dur.toFixed(1)}s{long ? ' · too long' : ''}</Badge>}
        <div className="ml-auto flex gap-1"><Button size="sm" variant="ghost" onClick={onDuplicate} icon={<Copy className="size-3.5" />} /><Button size="sm" variant="danger" onClick={onDelete} icon={<Trash2 className="size-3.5" />} /></div>
      </div>
      <div className="p-4 space-y-3">
        {shot.template !== 'cliffhanger' && (
          <div className="flex flex-wrap gap-1.5 items-center"><span className="text-xs text-zinc-500 mr-1">On screen:</span>
            {visual.map(c => { const on = shot.characters.includes(c.id); return (
              <button key={c.id} onClick={() => onChange(s => { s.characters = on ? s.characters.filter(x => x !== c.id) : [...s.characters, c.id]; })}
                className={clsx('rounded-full px-2.5 py-1 text-xs ring-1 transition', on ? 'text-white' : 'text-zinc-400 ring-white/10 hover:ring-white/30')} style={on ? { background: c.color + '33', boxShadow: `inset 0 0 0 1px ${c.color}` } : undefined}>{c.name}</button>); })}
          </div>
        )}
        {shot.template === 'hook' && <Field label="Hook text (big, on screen from frame 1, 4–8 words)"><Input value={shot.params.hook || ''} onChange={e => onChange(s => { s.params.hook = e.target.value; })} placeholder="Ek WiFi hotspot ne do strangers ko mila diya…" /></Field>}
        {shot.template === 'scene' && <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" className="accent-pink-500" checked={!!shot.params.showLocation} onChange={e => onChange(s => { s.params.showLocation = e.target.checked; })} />Show place name</label>}
        {shot.template === 'split' && (
          <div className="grid sm:grid-cols-2 gap-2">{(['left', 'right'] as const).map(side => (
            <div key={side} className="flex gap-2"><Input placeholder={`${side} label`} value={shot.params[side]?.label || ''} onChange={e => onChange(s => { s.params[side] = { ...(s.params[side] || {}), label: e.target.value }; })} /><Input placeholder="sub" value={shot.params[side]?.sub || ''} onChange={e => onChange(s => { s.params[side] = { ...(s.params[side] || {}), sub: e.target.value }; })} /></div>))}
          </div>
        )}
        {shot.template === 'cliffhanger' && (
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="Cliffhanger text (one line per row)"><Textarea rows={2} value={(shot.params.text || []).join('\n')} onChange={e => onChange(s => { s.params.text = e.target.value.split('\n'); })} /></Field>
            <Field label="Next episode tease" hint="Instagram cut ends with FOLLOW, YouTube cut with SUBSCRIBE"><Input value={shot.params.next || ''} onChange={e => onChange(s => { s.params.next = e.target.value; })} /></Field>
          </div>
        )}
        <div className="space-y-2">
          {shot.lines.map(l => {
            const stale = l.audio && l.audio.text !== l.text; const ch = p.characters.find(c => c.id === l.speaker);
            return (
              <div key={l.id} className="rounded-xl bg-zinc-950/50 ring-1 ring-white/[.06] p-3 space-y-2" style={{ borderLeft: `3px solid ${ch?.color || '#555'}` }}>
                <div className="flex flex-wrap gap-2 items-center">
                  <Select className="!w-44 !py-1.5" value={l.speaker} onChange={e => onChange(s => { s.lines.find(x => x.id === l.id)!.speaker = e.target.value; })} options={speakers} />
                  <Select className="!w-32 !py-1.5" value={l.emotion} onChange={e => onChange(s => { s.lines.find(x => x.id === l.id)!.emotion = e.target.value; })} options={EMOTIONS} />
                  <div className="ml-auto flex gap-1 items-center">
                    {l.audio && <PlayButton src={l.audio.url} label={`${l.audio.duration.toFixed(1)}s`} />}
                    {stale && <span title="Text changed since voiced"><AlertTriangle className="size-4 text-amber-400" /></span>}
                    <Button size="sm" variant="ghost" loading={voicing} onClick={() => onVoice(l.id)} icon={l.audio ? <RefreshCw className="size-3.5" /> : <Mic className="size-3.5" />}>{l.audio ? '' : 'Voice'}</Button>
                    <Button size="sm" variant="danger" onClick={() => onChange(s => { s.lines = s.lines.filter(x => x.id !== l.id); })} icon={<Trash2 className="size-3.5" />} />
                  </div>
                </div>
                <Field label="Voice script (Hinglish; Hindi in Devanagari sounds most natural)">
                  <Textarea rows={2} value={l.text} onChange={e => onChange(s => { s.lines.find(x => x.id === l.id)!.text = e.target.value; })} />
                </Field>
                <div className="flex flex-wrap gap-1">{TAGS.map(t => <button key={t} className="text-[10px] rounded-md bg-white/5 px-1.5 py-0.5 text-zinc-400 hover:text-pink-300" onClick={() => onChange(s => { const x = s.lines.find(y => y.id === l.id)!; x.text = `${t} ${x.text}`; })}>{t}</button>)}</div>
                <Field label="On-screen text (English letters)">
                  <Input value={l.subtitle || ''} placeholder={stripTags(l.text)} onChange={e => onChange(s => { s.lines.find(x => x.id === l.id)!.subtitle = e.target.value; })} />
                </Field>
              </div>
            );
          })}
          <Button size="sm" variant="ghost" icon={<Plus className="size-3.5" />} onClick={() => onChange(s => { s.lines.push({ id: newId('ln_'), speaker: s.lines[s.lines.length - 1]?.speaker || 'narrator', text: '', subtitle: '', emotion: 'neutral' }); })}>Add line</Button>
        </div>
      </div>
    </div>
  );
}
