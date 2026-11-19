import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Film, Inbox, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { api, Project, useAct, useJobs } from '../api';
import { Badge, Button, Card, PageHeader } from '../components/ui';
import { CreditsWidget } from '../App';

const COLUMNS = ['draft', 'voiced', 'rendered', 'scheduled', 'published'];

export default function Dashboard({ p }: { p: Project }) {
  const nav = useNavigate(); const { data: jobs } = useJobs();
  const create = useAct(() => api('/episodes', { body: {} }), { success: 'Episode created' });
  const scheduled = p.episodes.flatMap(e => e.publish.scheduled.map(s => ({ ...s, ep: e }))).sort((a, b) => a.at.localeCompare(b.at));
  const pending = p.claudeRequests.filter(r => r.status === 'pending');
  const stat = (label: string, value: number | string, icon: React.ReactNode) => (
    <Card className="!p-0"><div className="p-4 flex items-center gap-3"><div className="size-10 rounded-xl bg-pink-500/10 text-pink-300 grid place-items-center">{icon}</div><div><div className="text-xl font-bold text-white">{value}</div><div className="text-xs text-zinc-400">{label}</div></div></div></Card>
  );
  return (
    <>
      <PageHeader title={p.series.title} subtitle={p.series.tagline}
        actions={<><Button onClick={() => nav('/inbox')} icon={<Inbox className="size-4" />}>Dump story</Button><Button variant="primary" loading={create.isPending} onClick={async () => { const ep: any = await create.mutateAsync(); nav(`/episodes/${ep.id}`); }} icon={<Plus className="size-4" />}>New episode</Button></>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stat('Episodes', p.episodes.length, <Film className="size-5" />)}
        {stat('Published', p.episodes.filter(e => e.status === 'published').length, <TrendingUp className="size-5" />)}
        {stat('Story dumps', p.stories.length, <Inbox className="size-5" />)}
        {stat('Scheduled posts', scheduled.length, <CalendarClock className="size-5" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="ElevenLabs balance" subtitle="Voices and background score use these credits"><CreditsWidget /></Card>
        <Card title="Ask Claude queue" subtitle="Tell Claude Code “check the studio” to process" actions={<Link to="/inbox" className="text-xs text-pink-300">Open</Link>}>
          {pending.length ? <ul className="space-y-1.5 text-sm">{pending.slice(0, 4).map(r => <li key={r.id} className="flex items-center gap-2"><Sparkles className="size-3.5 text-amber-300" /><span className="truncate">{r.kind.replace('-', ' ')} {r.note && `· ${r.note}`}</span></li>)}</ul> : <p className="text-sm text-zinc-500">Nothing pending.</p>}
        </Card>
        <Card title="Up next" subtitle="Scheduled publishing">
          {scheduled.length ? <ul className="space-y-1.5 text-sm">{scheduled.slice(0, 4).map(s => <li key={s.id} className="flex justify-between gap-2"><span className="truncate">Ep {s.ep.num} → {p.platforms[s.platform]?.name}</span><span className="text-zinc-400 text-xs">{new Date(s.at).toLocaleString()}</span></li>)}</ul> : <p className="text-sm text-zinc-500">Nothing scheduled.</p>}
        </Card>
      </div>
      <h2 className="text-sm font-semibold text-zinc-300 mb-3">Production board</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {COLUMNS.map(col => (
          <div key={col} className="rounded-2xl bg-white/[.02] ring-1 ring-white/[.05] p-3 min-h-32">
            <div className="flex items-center justify-between mb-2"><Badge tone={col}>{col}</Badge><span className="text-xs text-zinc-500">{p.episodes.filter(e => e.status === col).length}</span></div>
            <div className="space-y-2">
              {p.episodes.filter(e => e.status === col).map(e => (
                <Link key={e.id} to={`/episodes/${e.id}`} className="block rounded-xl bg-zinc-900 ring-1 ring-white/[.07] hover:ring-pink-500/40 p-2.5 transition">
                  {e.render?.poster && <img src={e.render.poster} className="rounded-lg mb-2 aspect-[9/16] object-cover w-full max-h-40" />}
                  <div className="text-xs text-zinc-400">Ep {e.num}</div><div className="text-sm font-medium text-zinc-100 truncate">{e.title}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Card title="Recent jobs">
        {jobs?.length ? <ul className="divide-y divide-white/5 text-sm">{jobs.slice(0, 8).map(j => <li key={j.id} className="py-2 flex justify-between gap-3"><span className="truncate">{j.label}</span><span className="flex items-center gap-2">{j.error && <span className="text-xs text-rose-300 truncate max-w-64">{j.error}</span>}<Badge tone={j.status}>{j.status}</Badge></span></li>)}</ul> : <p className="text-sm text-zinc-500">No jobs yet this session.</p>}
      </Card>
    </>
  );
}
