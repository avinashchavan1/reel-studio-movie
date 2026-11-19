import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, CalendarClock, Film, Inbox, Plus, Sparkles, TrendingUp, Wand2 } from 'lucide-react';
import { api, Project, useAct, useJobs } from '../api';
import { Badge, Button, Card, PageHeader, Sparkline } from '../components/ui';
import { CreditsWidget } from '../App';

const COLUMNS = ['draft', 'voiced', 'rendered', 'scheduled', 'published'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function nextSteps(p: Project) {
  const s: { text: string; to: string }[] = [];
  const pending = p.claudeRequests.filter(r => r.status === 'pending').length;
  if (pending) s.push({ text: `${pending} request(s) waiting for Claude. Say “check the studio” in Claude Code`, to: '/plan?tab=inbox' });
  const newStories = p.stories.filter(x => x.status === 'new').length;
  if (newStories) s.push({ text: `${newStories} new story dump(s) not used yet. Ask Claude to write the next part`, to: '/plan?tab=inbox' });
  for (const e of p.episodes) {
    const unvoiced = e.shots.some(sh => sh.lines.some(l => !l.audio || l.audio.text !== l.text));
    if (unvoiced) s.push({ text: `Ep ${e.num}: generate voices`, to: `/reels/${e.id}` });
    else if (!e.render) s.push({ text: `Ep ${e.num}: render the reel`, to: `/reels/${e.id}` });
    else if (e.status !== 'published' && !e.publish.history.some(h => h.status === 'done')) s.push({ text: `Ep ${e.num} is ready: post it from the Publish Hub`, to: `/reels/${e.id}?tab=publish` });
  }
  const ig = p.profiles.instagram; const igDone = ig ? Object.values(ig.checklist || {}).filter(Boolean).length : 0;
  if (igDone < 3) s.push({ text: 'Finish your Instagram profile checklist (bio, pinned Part 1, highlight)', to: '/profiles' });
  if (!p.plan.items.length) s.push({ text: 'Plan the next few parts on the Season roadmap', to: '/plan?tab=roadmap' });
  if (!p.stats.length) s.push({ text: 'Log your follower count to start tracking growth', to: '/profiles' });
  return s.slice(0, 6);
}

export default function Dashboard({ p }: { p: Project }) {
  const nav = useNavigate(); const { data: jobs } = useJobs();
  const create = useAct(() => api('/episodes', { body: {} }), { success: 'Reel created' });
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const planned = (k: string) => p.calendar.filter(c => c.date === k);
  const sched = (k: string) => p.episodes.flatMap(e => e.publish.scheduled.filter(s => s.at.slice(0, 10) === k).map(s => ({ ...s, num: e.num })));
  const igSeries = p.stats.filter(s => s.platform === 'instagram').sort((a, b) => a.date.localeCompare(b.date));
  const ytSeries = p.stats.filter(s => s.platform === 'youtube').sort((a, b) => a.date.localeCompare(b.date));
  const steps = nextSteps(p);
  const stat = (label: string, value: number | string, icon: React.ReactNode, to: string) => (
    <Link to={to}><Card className="!p-0 hover:ring-pink-500/30 transition"><div className="p-4 flex items-center gap-3"><div className="size-10 rounded-xl bg-pink-500/10 text-pink-300 grid place-items-center">{icon}</div><div><div className="text-xl font-bold text-white">{value}</div><div className="text-xs text-zinc-400">{label}</div></div></div></Card></Link>
  );
  return (
    <>
      <PageHeader title={p.series.title} subtitle={p.series.tagline}
        actions={<><Button onClick={() => nav('/plan?tab=inbox')} icon={<Inbox className="size-4" />}>Dump story</Button><Button variant="primary" loading={create.isPending} onClick={async () => { const ep: any = await create.mutateAsync(); nav(`/reels/${ep.id}`); }} icon={<Plus className="size-4" />}>New reel</Button></>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {stat('Reels', p.episodes.length, <Film className="size-5" />, '/reels')}
        {stat('Ready to post', p.episodes.filter(e => e.render && e.status !== 'published').length, <Sparkles className="size-5" />, '/reels')}
        {stat('Planned parts', p.plan.items.filter(i => i.status !== 'done').length, <Wand2 className="size-5" />, '/plan?tab=roadmap')}
        {stat('Followers (IG)', igSeries.length ? igSeries[igSeries.length - 1].followers.toLocaleString() : '–', <TrendingUp className="size-5" />, '/profiles')}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2" title="What to do next" subtitle="Picked from the state of your reels, plan and profiles">
          {steps.length ? <ul className="space-y-1.5">{steps.map((s, i) => (
            <li key={i}><Link to={s.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[.02] ring-1 ring-white/[.05] hover:ring-pink-500/40 transition text-sm">
              <span className="size-6 rounded-full bg-pink-500/15 text-pink-300 grid place-items-center text-xs font-bold shrink-0">{i + 1}</span><span className="flex-1">{s.text}</span><ArrowRight className="size-4 text-zinc-500" /></Link></li>))}</ul>
            : <p className="text-sm text-zinc-400">All caught up 🎉 Send Claude the next part of the story.</p>}
        </Card>
        <Card title="ElevenLabs balance" subtitle="Voices and score use these credits"><CreditsWidget /></Card>
      </div>

      <Card className="mb-5" title={<span className="flex items-center gap-2"><CalendarClock className="size-4" />This week</span>} actions={<Link to="/plan?tab=calendar" className="text-xs text-pink-300">Calendar →</Link>}>
        <div className="grid grid-cols-7 gap-2">
          {week.map((d, i) => { const k = ymd(d); const items = [...planned(k).map(c => `${c.episodeNum ? `Ep ${c.episodeNum} · ` : ''}${p.platforms[c.platform]?.name}`), ...sched(k).map(s => `Ep ${s.num} → ${p.platforms[s.platform]?.name} ⏰`)];
            return (
              <div key={k} className={clsx('rounded-xl p-2 min-h-24 ring-1', i === 0 ? 'ring-pink-500/50 bg-pink-500/5' : 'ring-white/[.06] bg-white/[.02]')}>
                <div className="text-[11px] text-zinc-400">{d.toLocaleDateString(undefined, { weekday: 'short' })} <span className="text-zinc-200 font-semibold">{d.getDate()}</span></div>
                <div className="mt-1 space-y-1">{items.map((t, j) => <div key={j} className="truncate rounded bg-pink-500/15 px-1 py-0.5 text-[10px] text-pink-100">{t}</div>)}</div>
              </div>); })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card title="Instagram followers" actions={<Link to="/profiles" className="text-xs text-pink-300">Log →</Link>}><Sparkline points={igSeries.map(s => s.followers)} color="#e1306c" /></Card>
        <Card title="YouTube subscribers" actions={<Link to="/profiles" className="text-xs text-pink-300">Log →</Link>}><Sparkline points={ytSeries.map(s => s.followers)} color="#ff0000" /></Card>
        <Card title="Recent jobs">
          {jobs?.length ? <ul className="divide-y divide-white/5 text-sm">{jobs.slice(0, 5).map(j => <li key={j.id} className="py-1.5 flex justify-between gap-3"><span className="truncate text-xs">{j.label}</span><Badge tone={j.status}>{j.status}</Badge></li>)}</ul> : <p className="text-sm text-zinc-500">No jobs yet this session.</p>}
        </Card>
      </div>

      <h2 className="text-sm font-semibold text-zinc-300 mb-3">Production board</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {COLUMNS.map(col => (
          <div key={col} className="rounded-2xl bg-white/[.02] ring-1 ring-white/[.05] p-3 min-h-28">
            <div className="flex items-center justify-between mb-2"><Badge tone={col}>{col}</Badge><span className="text-xs text-zinc-500">{p.episodes.filter(e => e.status === col).length}</span></div>
            <div className="space-y-2">{p.episodes.filter(e => e.status === col).map(e => (
              <Link key={e.id} to={`/reels/${e.id}`} className="flex gap-2 items-center rounded-xl bg-zinc-900 ring-1 ring-white/[.07] hover:ring-pink-500/40 p-2 transition">
                {e.render?.poster && <img src={e.render.poster} className="w-10 aspect-[9/16] rounded-md object-cover" />}
                <div className="min-w-0"><div className="text-[11px] text-zinc-400">Ep {e.num}</div><div className="text-sm font-medium truncate">{e.title}</div></div>
              </Link>))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
