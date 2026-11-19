import { Link, useNavigate } from 'react-router-dom';
import { Copy, Film, Plus, Trash2 } from 'lucide-react';
import { api, Project, useAct } from '../api';
import { Badge, Button, Empty, PageHeader } from '../components/ui';

export default function Episodes({ p }: { p: Project }) {
  const nav = useNavigate();
  const create = useAct(() => api('/episodes', { body: {} }), { success: 'Episode created' });
  const dup = useAct((id: string) => api(`/episodes/${id}/duplicate`, { body: {} }), { success: 'Duplicated' });
  const del = useAct((id: string) => api(`/episodes/${id}`, { method: 'DELETE' }), { success: 'Deleted' });
  return (
    <>
      <PageHeader title="Episodes" subtitle="Every part of the series, from draft to published."
        actions={<Button variant="primary" loading={create.isPending} onClick={async () => { const ep: any = await create.mutateAsync(); nav(`/episodes/${ep.id}`); }} icon={<Plus className="size-4" />}>New episode</Button>} />
      {!p.episodes.length ? <Empty icon={<Film className="size-8" />} title="No episodes yet" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {p.episodes.map(e => (
            <div key={e.id} className="group rounded-2xl bg-zinc-900/70 ring-1 ring-white/[.07] hover:ring-pink-500/40 overflow-hidden transition">
              <Link to={`/episodes/${e.id}`} className="block">
                <div className="aspect-[9/12] bg-gradient-to-br from-pink-500/20 via-violet-500/10 to-transparent grid place-items-center overflow-hidden">
                  {e.render?.poster ? <img src={e.render.poster} className="w-full h-full object-cover" /> : <span className="text-6xl font-black text-white/10">{e.num}</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs text-zinc-400">Ep {e.num}</span><Badge tone={e.status}>{e.status}</Badge></div>
                  <div className="font-semibold text-white truncate">{e.title}</div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1 min-h-8">{e.synopsis}</p>
                  <div className="text-[11px] text-zinc-500 mt-2">{e.shots.length} shots · {e.shots.reduce((a, s) => a + s.lines.length, 0)} lines</div>
                </div>
              </Link>
              <div className="flex gap-1 px-3 pb-3 opacity-0 group-hover:opacity-100 transition">
                <Button size="sm" variant="ghost" onClick={() => dup.mutate(e.id)} icon={<Copy className="size-3.5" />}>Duplicate</Button>
                <Button size="sm" variant="danger" onClick={() => confirm(`Delete Ep ${e.num}?`) && del.mutate(e.id)} icon={<Trash2 className="size-3.5" />}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
