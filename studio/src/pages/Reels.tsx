import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { Project } from '../api';
import { Badge, card, Empty, Input, muted, PageHeader, Select } from '../components/ui';
import { fmtDur, STAGES } from './Dashboard';

export default function Reels({ p }: { p: Project }) {
  const nav = useNavigate(); const [q, setQ] = useState(''); const [stage, setStage] = useState('');
  const rows = [
    ...p.episodes.map(e => ({ key: e.id, id: e.id, code: e.code, title: e.title, type: e.type || 'Story', source: e.where || e.synopsis, length: e.render?.duration, stage: e.stage, poster: e.render?.poster, flags: e.stage === 'review' ? ['Waiting for your check'] : [] })),
    ...p.plan.items.filter(i => i.status === 'idea').map(i => ({ key: i.id, id: '', code: `STF-${String(i.num).padStart(2, '0')}`, title: i.title, type: 'Story', source: i.where || '', length: undefined, stage: 'idea', poster: undefined, flags: [] as string[] })),
  ].filter(r => (!stage || r.stage === stage) && (!q || `${r.title} ${r.code} ${r.source}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.code.localeCompare(b.code));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Reels" />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1"><Search size={16} className="absolute left-3 top-3 text-ink-soft dark:text-parchment/50" /><Input aria-label="Search reels" className="pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, code, part of the story…" /></div>
        <Select aria-label="Filter by stage" className="!w-44" value={stage} onChange={e => setStage(e.target.value)} options={[{ value: '', label: 'All stages' }, ...STAGES.map(s => ({ value: s, label: s }))]} />
      </div>
      {!rows.length ? <Empty>Empty</Empty> : (
        <div className={clsx(card, '!p-0 overflow-x-auto')}>
          <table className="w-full text-left text-sm">
            <thead className={clsx('text-xs font-semibold uppercase tracking-wider', muted)}><tr className="border-b border-parchment-deep dark:border-night-700"><th className="p-3">Reel</th><th className="p-3">Type</th><th className="p-3">Source</th><th className="p-3">Length</th><th className="p-3">Stage</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key} onClick={() => r.id && nav(`/reels/${r.id}`)} className={clsx('border-b border-parchment-deep last:border-0 dark:border-night-700', r.id && 'cursor-pointer hover:bg-gold-soft/40 dark:hover:bg-gold/5')}>
                  <td className="p-3"><div className="flex items-center gap-3">{r.poster ? <img src={r.poster} className="h-12 w-7 rounded object-cover" /> : <div className="h-12 w-7 rounded bg-parchment-deep dark:bg-night-800" />}
                    <div><div className="font-mono text-xs text-gold-deep dark:text-gold">{r.code}</div><div className="font-semibold">{r.title}</div>{r.flags.map(f => <div key={f} className="text-xs text-vermilion">{f}</div>)}</div></div></td>
                  <td className={clsx('p-3', muted)}>{r.type}</td>
                  <td className={clsx('p-3 max-w-72 truncate', muted)}>{r.source}</td>
                  <td className="tabular p-3 text-ink-soft dark:text-parchment/60">{fmtDur(r.length)}</td>
                  <td className="p-3"><Badge tone={r.stage}>{r.stage}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
