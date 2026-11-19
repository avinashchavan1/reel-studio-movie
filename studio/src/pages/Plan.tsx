import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight, Film, Inbox, Map as MapIcon, Plus, Sparkles, Trash2 } from 'lucide-react';
import { api, CalSlot, newId, PlanItem, Project, saveDoc, useAct } from '../api';
import { Badge, Button, Card, Field, Input, PageHeader, Select, Tabs, Textarea, useTab } from '../components/ui';
import StoryInbox from './StoryInbox';

const COLS: { id: PlanItem['status']; label: string }[] = [{ id: 'idea', label: '💡 Ideas' }, { id: 'planned', label: '📝 Planned' }, { id: 'production', label: '🎬 In production' }, { id: 'done', label: '✅ Done' }];

function Roadmap({ p }: { p: Project }) {
  const nav = useNavigate();
  const [items, setItems] = useState<PlanItem[]>(p.plan.items); useEffect(() => setItems(p.plan.items), [p.plan.items]);
  const persist = useAct((next: PlanItem[]) => saveDoc('plan', { items: next }), { invalidate: ['project'] });
  const set = (next: PlanItem[]) => { setItems(next); persist.mutate(next); };
  const [edit, setEdit] = useState<PlanItem | null>(null);
  const ask = useAct(() => api('/claude-requests', { body: { kind: 'plan-season', note: 'Fill the roadmap with the next episodes (titles, beats, hooks) from the story inbox' } }), { success: 'Queued for Claude. Say “check the studio” in Claude Code' });
  const toReel = useAct(async (it: PlanItem) => {
    const ep: any = await api('/episodes', { body: { num: it.num, title: it.title, synopsis: it.beats } });
    set(items.map(x => x.id === it.id ? { ...x, status: 'production', episodeId: ep.id } : x)); nav(`/reels/${ep.id}`); return ep;
  }, { success: 'Reel created from plan' });
  const nextNum = Math.max(0, ...p.episodes.map(e => e.num), ...items.map(i => i.num)) + 1;
  const add = (status: PlanItem['status']) => { const it: PlanItem = { id: newId('pl_'), num: nextNum, title: `Episode ${nextNum}`, beats: '', status }; set([...items, it]); setEdit(it); };
  const done = p.episodes.map(e => ({ id: e.id, num: e.num, title: e.title, beats: e.synopsis, status: 'done' as const, episodeId: e.id })).filter(e => !items.some(i => i.episodeId === e.id));
  return (
    <>
      <PageHeader title="Season roadmap" subtitle="Plan the arc: what each part covers and where it ends. Move cards across as they progress."
        actions={<><Button onClick={() => ask.mutate()} loading={ask.isPending} icon={<Sparkles className="size-4" />}>Ask Claude to plan</Button><Button variant="primary" onClick={() => add('idea')} icon={<Plus className="size-4" />}>Add idea</Button></>} />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {COLS.map(c => {
          const list = [...items.filter(i => i.status === c.id), ...(c.id === 'done' ? done : [])].sort((a, b) => a.num - b.num);
          return (
            <div key={c.id} className="rounded-2xl bg-white/[.02] ring-1 ring-white/[.05] p-3 min-h-48"
              onDragOver={e => e.preventDefault()} onDrop={e => { const id = e.dataTransfer.getData('id'); set(items.map(x => x.id === id ? { ...x, status: c.id } : x)); }}>
              <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">{c.label}</span><button className="text-zinc-500 hover:text-pink-300" onClick={() => add(c.id)}><Plus className="size-4" /></button></div>
              <div className="space-y-2">
                {list.map(it => (
                  <div key={it.id} draggable={!done.includes(it as any)} onDragStart={e => e.dataTransfer.setData('id', it.id)} onClick={() => !it.episodeId || items.includes(it) ? setEdit(it) : nav(`/reels/${it.episodeId}`)}
                    className="cursor-pointer rounded-xl bg-zinc-900 ring-1 ring-white/[.07] hover:ring-pink-500/40 p-3">
                    <div className="text-[11px] text-pink-300 font-semibold">Part {it.num}</div>
                    <div className="text-sm font-medium text-zinc-100">{it.title}</div>
                    {it.beats && <p className="text-xs text-zinc-400 line-clamp-3 mt-1">{it.beats}</p>}
                    {it.episodeId && <div className="mt-2"><Badge tone="rendered"><Film className="size-3" />reel</Badge></div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {edit && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={() => setEdit(null)}>
          <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <Card title={`Part ${edit.num}`} actions={<Button size="sm" variant="danger" onClick={() => { set(items.filter(x => x.id !== edit.id)); setEdit(null); }} icon={<Trash2 className="size-3.5" />} />}>
              <div className="space-y-3">
                <div className="grid grid-cols-[80px_1fr] gap-2"><Input type="number" value={edit.num} onChange={e => setEdit({ ...edit, num: Number(e.target.value) })} /><Input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} /></div>
                <Field label="Hook idea"><Input value={edit.hook || ''} onChange={e => setEdit({ ...edit, hook: e.target.value })} placeholder="The first line on screen…" /></Field>
                <Field label="Beats (what happens, where it ends)"><Textarea rows={5} value={edit.beats} onChange={e => setEdit({ ...edit, beats: e.target.value })} /></Field>
                <Select value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value as PlanItem['status'] })} options={COLS.map(c => ({ value: c.id, label: c.label }))} />
                <div className="flex justify-between">
                  {!edit.episodeId ? <Button onClick={() => { toReel.mutate(edit); setEdit(null); }} icon={<Film className="size-4" />}>Create reel from this</Button> : <Button onClick={() => nav(`/reels/${edit.episodeId}`)}>Open reel</Button>}
                  <Button variant="primary" onClick={() => { set(items.map(x => x.id === edit.id ? edit : x)); setEdit(null); }}>Save</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function Calendar({ p }: { p: Project }) {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [slots, setSlots] = useState<CalSlot[]>(p.calendar); useEffect(() => setSlots(p.calendar), [p.calendar]);
  const persist = useAct((next: CalSlot[]) => saveDoc('calendar', next), { invalidate: ['project'] });
  const set = (next: CalSlot[]) => { setSlots(next); persist.mutate(next); };
  const [day, setDay] = useState<string | null>(null); const [form, setForm] = useState({ platform: 'instagram', episodeNum: '', note: '' });
  const scheduled = useMemo(() => p.episodes.flatMap(e => e.publish.scheduled.map(s => ({ date: s.at.slice(0, 10), label: `Ep ${e.num} → ${p.platforms[s.platform]?.name}`, kind: 'scheduled' }))), [p]);
  const published = useMemo(() => p.episodes.flatMap(e => e.publish.history.filter(h => h.status === 'done' && !h.export).map(h => ({ date: h.at.slice(0, 10), label: `Ep ${e.num} posted · ${p.platforms[h.platform]?.name}`, kind: 'published' }))), [p]);
  const start = new Date(month); start.setDate(1 - ((month.getDay() + 6) % 7)); // weeks start Monday
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const today = ymd(new Date());
  const autoPlan = () => { // plan a slot every 2 days at prime time for the next 2 weeks
    const next = [...slots]; const base = new Date(); let n = Math.max(0, ...p.episodes.map(e => e.num)) + 1;
    for (let i = 1; i <= 14; i += 2) { const d = new Date(base); d.setDate(base.getDate() + i); const date = ymd(d); if (!next.some(s => s.date === date)) next.push({ id: newId('cal_'), date, platform: 'instagram', episodeNum: n++, note: '7:30 PM' }); }
    set(next);
  };
  return (
    <>
      <PageHeader title="Content calendar" subtitle="Plan posting days. Scheduled and posted reels show up automatically."
        actions={<><Button onClick={autoPlan} icon={<Sparkles className="size-4" />}>Auto-plan 2 weeks</Button></>} />
      <Card>
        <div className="flex items-center justify-between mb-4">
          <Button size="sm" variant="ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} icon={<ChevronLeft className="size-4" />} />
          <h3 className="font-semibold">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3>
          <Button size="sm" variant="ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} icon={<ChevronRight className="size-4" />} />
        </div>
        <div className="grid grid-cols-7 gap-1 text-[11px] text-zinc-500 mb-1">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="px-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(d => {
            const key = ymd(d); const mine = slots.filter(s => s.date === key); const auto = [...scheduled, ...published].filter(s => s.date === key);
            return (
              <button key={key} onClick={() => setDay(key)} className={clsx('min-h-24 rounded-xl p-1.5 text-left ring-1 transition align-top', d.getMonth() === month.getMonth() ? 'bg-white/[.03] ring-white/[.06] hover:ring-pink-500/40' : 'bg-transparent ring-transparent opacity-40', key === today && 'ring-pink-500/60')}>
                <div className={clsx('text-xs mb-1', key === today ? 'text-pink-300 font-bold' : 'text-zinc-400')}>{d.getDate()}</div>
                <div className="space-y-1">
                  {auto.map((a, i) => <div key={i} className={clsx('truncate rounded px-1 py-0.5 text-[10px]', a.kind === 'published' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200')}>{a.label}</div>)}
                  {mine.map(s => <div key={s.id} className="truncate rounded px-1 py-0.5 text-[10px] bg-pink-500/20 text-pink-200">{s.episodeNum ? `Ep ${s.episodeNum} · ` : ''}{p.platforms[s.platform]?.name || s.platform}</div>)}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 text-[11px] text-zinc-400"><span className="flex items-center gap-1"><i className="size-2 rounded bg-pink-500/60" />planned</span><span className="flex items-center gap-1"><i className="size-2 rounded bg-amber-500/60" />scheduled</span><span className="flex items-center gap-1"><i className="size-2 rounded bg-emerald-500/60" />posted</span></div>
      </Card>
      {day && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={() => setDay(null)}>
          <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <Card title={new Date(day + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}>
              <ul className="space-y-1.5 mb-4">{slots.filter(s => s.date === day).map(s => (
                <li key={s.id} className="flex items-center gap-2 text-sm"><Badge tone="new">{p.platforms[s.platform]?.name}</Badge>{s.episodeNum && <span>Ep {s.episodeNum}</span>}<span className="text-zinc-400 text-xs">{s.note}</span>
                  <button className="ml-auto text-zinc-500 hover:text-rose-300" onClick={() => set(slots.filter(x => x.id !== s.id))}><Trash2 className="size-3.5" /></button></li>))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} options={Object.entries(p.platforms).map(([k, v]) => ({ value: k, label: v.name }))} />
                <Input type="number" value={form.episodeNum} onChange={e => setForm({ ...form, episodeNum: e.target.value })} placeholder="Episode #" />
                <Input className="col-span-2" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Note (time, idea…)" />
              </div>
              <div className="flex justify-end gap-2 mt-3"><Button onClick={() => setDay(null)}>Close</Button><Button variant="primary" onClick={() => { set([...slots, { id: newId('cal_'), date: day, platform: form.platform, episodeNum: form.episodeNum ? Number(form.episodeNum) : undefined, note: form.note }]); setForm({ ...form, note: '' }); }} icon={<Plus className="size-4" />}>Add</Button></div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

export default function Plan({ p }: { p: Project }) {
  const [tab, setTab] = useTab('inbox');
  const pending = p.claudeRequests.filter(r => r.status === 'pending').length;
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'inbox', label: 'Story inbox', icon: <Inbox className="size-4" />, count: pending || undefined },
        { id: 'roadmap', label: 'Season roadmap', icon: <MapIcon className="size-4" /> },
        { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="size-4" /> },
      ]} />
      {tab === 'roadmap' ? <Roadmap p={p} /> : tab === 'calendar' ? <Calendar p={p} /> : <StoryInbox p={p} />}
    </>
  );
}
