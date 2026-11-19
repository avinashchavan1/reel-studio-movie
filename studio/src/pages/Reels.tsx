import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Columns3, Copy, Film, LayoutGrid, Plus, Search, Trash2 } from 'lucide-react';
import { api, Episode, Project, useAct } from '../api';
import { Badge, Button, Empty, Input, PageHeader, Select } from '../components/ui';

const STATUSES = ['draft', 'voiced', 'rendered', 'scheduled', 'published'];

function ReelCard({ e, onDup, onDel }: { e: Episode; onDup: () => void; onDel: () => void }) {
  const lines = e.shots.reduce((a, s) => a + s.lines.length, 0);
  const posted = new Set(e.publish.history.filter(h => h.status === 'done').map(h => h.platform));
  return (
    <div className="group rounded-2xl bg-zinc-900/70 ring-1 ring-white/[.07] hover:ring-pink-500/40 overflow-hidden transition">
      <Link to={`/reels/${e.id}`} className="block">
        <div className="aspect-[9/12] bg-gradient-to-br from-pink-500/20 via-violet-500/10 to-transparent grid place-items-center overflow-hidden relative">
          {e.render?.poster ? <img src={e.render.poster} className="w-full h-full object-cover" /> : <span className="text-6xl font-black text-white/10">{e.num}</span>}
          {e.render && <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px]">{Math.round(e.render.duration)}s</span>}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1"><span className="text-xs text-zinc-400">Ep {e.num}</span><Badge tone={e.status}>{e.status}</Badge></div>
          <div className="font-semibold text-white truncate">{e.title}</div>
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 min-h-8">{e.synopsis}</p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2"><span>{e.shots.length} shots · {lines} lines</span>{posted.size > 0 && <span className="text-emerald-300">posted ×{posted.size}</span>}</div>
        </div>
      </Link>
      <div className="flex gap-1 px-3 pb-3 opacity-0 group-hover:opacity-100 transition">
        <Button size="sm" variant="ghost" onClick={onDup} icon={<Copy className="size-3.5" />}>Duplicate</Button>
        <Button size="sm" variant="danger" onClick={onDel} icon={<Trash2 className="size-3.5" />}>Delete</Button>
      </div>
    </div>
  );
}

export default function Reels({ p }: { p: Project }) {
  const nav = useNavigate(); const [view, setView] = useState<'grid' | 'board'>('grid');
  const [q, setQ] = useState(''); const [status, setStatus] = useState('');
  const create = useAct(() => api('/episodes', { body: {} }), { success: 'Reel created' });
  const dup = useAct((id: string) => api(`/episodes/${id}/duplicate`, { body: {} }), { success: 'Duplicated' });
  const del = useAct((id: string) => api(`/episodes/${id}`, { method: 'DELETE' }), { success: 'Deleted' });
  const list = p.episodes.filter(e => (!status || e.status === status) && (!q || `${e.title} ${e.synopsis} ${e.shots.flatMap(s => s.lines.map(l => l.subtitle || l.text)).join(' ')}`.toLowerCase().includes(q.toLowerCase())));
  const card = (e: Episode) => <ReelCard key={e.id} e={e} onDup={() => dup.mutate(e.id)} onDel={() => confirm(`Delete Ep ${e.num}?`) && del.mutate(e.id)} />;
  const totalSecs = p.episodes.reduce((a, e) => a + (e.render?.duration || 0), 0);
  return (
    <>
      <PageHeader title="Reels" subtitle={`${p.episodes.length} episodes · ${Math.round(totalSecs)}s of finished story`}
        actions={<Button variant="primary" loading={create.isPending} onClick={async () => { const ep: any = await create.mutateAsync(); nav(`/reels/${ep.id}`); }} icon={<Plus className="size-4" />}>New reel</Button>} />
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative"><Search className="size-4 absolute left-3 top-2.5 text-zinc-500" /><Input className="!pl-9 !w-64" value={q} onChange={e => setQ(e.target.value)} placeholder="Search titles, lines…" /></div>
        <Select className="!w-40" value={status} onChange={e => setStatus(e.target.value)} options={[{ value: '', label: 'All statuses' }, ...STATUSES.map(s => ({ value: s, label: s }))]} />
        <div className="ml-auto flex rounded-xl bg-white/[.04] ring-1 ring-white/10 p-0.5">
          {([['grid', LayoutGrid], ['board', Columns3]] as const).map(([v, I]) => <button key={v} onClick={() => setView(v)} className={clsx('rounded-lg px-2.5 py-1.5', view === v ? 'bg-white/10 text-white' : 'text-zinc-500')}><I className="size-4" /></button>)}
        </div>
      </div>
      {!list.length ? <Empty icon={<Film className="size-8" />} title={p.episodes.length ? 'No reels match' : 'No reels yet'} /> : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.map(card)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {STATUSES.map(st => (
            <div key={st} className="rounded-2xl bg-white/[.02] ring-1 ring-white/[.05] p-3 space-y-3 min-h-40">
              <div className="flex justify-between"><Badge tone={st}>{st}</Badge><span className="text-xs text-zinc-500">{list.filter(e => e.status === st).length}</span></div>
              {list.filter(e => e.status === st).map(card)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
