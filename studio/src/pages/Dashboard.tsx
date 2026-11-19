import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';
import { Project } from '../api';
import { Badge, card, Empty, muted, PageHeader } from '../components/ui';

export const STAGES = ['idea', 'scripted', 'voiced', 'review', 'approved', 'posted'];
export const fmtDur = (s?: number) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '–');
const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : new Date(iso).toLocaleDateString(); };

export default function Dashboard({ p }: { p: Project }) {
  const eps = p.episodes;
  const count = (st: string) => eps.filter(e => e.stage === st).length + (st === 'idea' ? p.plan.items.filter(i => i.status === 'idea').length : 0);
  const posted = (pl: string) => eps.filter(e => e.posts?.[pl]?.state === 'posted').length;
  const waiting = eps.filter(e => e.stage === 'review');
  const ready = eps.filter(e => e.stage === 'approved');
  const inProd = eps.filter(e => ['scripted', 'voiced'].includes(e.stage)).length;
  const next = p.plan.items.filter(i => i.status === 'idea').sort((a, b) => a.num - b.num).slice(0, 5);
  const handles = Object.entries(p.profiles || {}).filter(([, v]) => v.handle);
  const stat = (label: string, n: number) => <div className={card}><div className="tabular text-3xl font-bold">{n}</div><div className={clsx('text-sm', muted)}>{label}</div></div>;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader eyebrow={`${p.brand.series} · ${p.brand.edition}`} title="Today in the studio"
        actions={handles.length ? <div className={clsx('flex flex-wrap gap-2 font-mono text-xs', muted)}>{handles.map(([k, v]) => <span key={k} className="rounded-full border border-parchment-deep px-3 py-1 dark:border-night-700">{k} @{v.handle}</span>)}</div> : undefined} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stat('Reels made', eps.filter(e => e.render).length)}
        {stat('In production', inProd)}
        {stat('Waiting for your check', waiting.length)}
        {stat('On Instagram', posted('instagram'))}
        {stat('On YouTube', posted('youtube'))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-lg font-semibold tracking-wide">Needs you</h2>
          {!waiting.length && !ready.length ? <p className={clsx('mt-2 text-sm', muted)}>Nothing waiting. New reels land here when they're rendered.</p> : (
            <ul className="mt-3 grid gap-2">
              {waiting.map(e => <li key={e.id}><Link to={`/reels/${e.id}`} className="flex items-center gap-3 rounded-xl border border-parchment-deep p-3 hover:border-gold-deep dark:border-night-700 dark:hover:border-gold">
                {e.render?.poster && <img src={e.render.poster} className="h-14 w-8 rounded object-cover" />}
                <div className="min-w-0 flex-1"><div className="font-semibold">{e.code} · {e.title}</div><div className={clsx('text-xs', muted)}>Check the story, then approve</div></div><Badge tone="review">review</Badge></Link></li>)}
              {ready.map(e => <li key={e.id}><Link to={`/reels/${e.id}`} className="flex items-center gap-3 rounded-xl border border-parchment-deep p-3 hover:border-gold-deep dark:border-night-700 dark:hover:border-gold">
                {e.render?.poster && <img src={e.render.poster} className="h-14 w-8 rounded object-cover" />}
                <div className="min-w-0 flex-1"><div className="font-semibold">{e.code} · {e.title}</div><div className={clsx('text-xs', muted)}>Reviewed · ready to post</div></div><Badge tone="approved">approved</Badge></Link></li>)}
            </ul>
          )}
        </section>
        <section className={card}>
          <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold tracking-wide">Coming up next</h2><Link to="/plan" className="text-sm font-semibold text-gold-deep hover:underline dark:text-gold">Full plan →</Link></div>
          {!next.length ? <p className={clsx('mt-2 text-sm', muted)}>The plan is empty. Add the next reel idea on the Plan page.</p> : (
            <ol className="mt-3 grid gap-2">{next.map(i => <li key={i.id} className="flex items-start gap-3 text-sm"><span className="font-mono text-xs text-gold-deep dark:text-gold">STF-{String(i.num).padStart(2, '0')}</span><div><div className="font-semibold">{i.title}</div>{i.where && <div className={clsx('text-xs', muted)}>{i.where}</div>}</div></li>)}</ol>
          )}
        </section>
      </div>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold tracking-wide">Pipeline</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAGES.map((st, i) => (
            <div key={st} className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-parchment-deep p-3 text-center dark:border-night-700"><div className="tabular text-2xl font-bold">{count(st)}</div><Badge tone={st}>{st}</Badge></div>
              {i < STAGES.length - 1 && <ArrowRight size={14} className="hidden shrink-0 text-ink-soft sm:block dark:text-parchment/40" />}
            </div>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold tracking-wide">Recent activity</h2>
        {!p.activity?.length ? <p className={clsx('mt-2 text-sm', muted)}>No activity yet.</p> : (
          <ul className="mt-3 divide-y divide-parchment-deep text-sm dark:divide-night-700">{p.activity.slice(0, 12).map((a, i) => <li key={i} className="flex justify-between gap-3 py-2"><span>{a.text}</span><span className={clsx('shrink-0 text-xs', muted)}>{ago(a.at)}</span></li>)}</ul>
        )}
      </section>
      {!eps.length && <Empty>No reels yet. Send Claude the story and the first reel will appear here.</Empty>}
    </div>
  );
}
