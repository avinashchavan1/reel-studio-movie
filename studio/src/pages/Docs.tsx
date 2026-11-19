import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';
import { Project, saveDoc, useAct } from '../api';
import { Button, card, Markdown, muted, PageHeader, Textarea } from '../components/ui';

export default function Docs({ p }: { p: Project }) {
  const { slug } = useParams();
  const [notes, setNotes] = useState(p.notes || ''); useEffect(() => setNotes(p.notes || ''), [p.notes]);
  const save = useAct(() => saveDoc('notes', notes), { success: 'Notes saved' });
  const doc = slug ? p.knowledge.find(k => k.id === slug) : null;
  if (slug) return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Link to="/docs" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold"><ArrowLeft size={14} />Style & docs</Link>
      {doc ? <article className={clsx(card, 'max-w-3xl')}><h1 className="font-display text-2xl font-extrabold tracking-wide">{doc.title}</h1><div className="mt-4"><Markdown text={doc.body} /></div></article> : <p className={muted}>Doc not found.</p>}
    </div>
  );
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title="Style & docs" subtitle="How this series is made: the rules Claude follows for every reel." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {p.knowledge.map(k => (
          <Link key={k.id} to={`/docs/${k.id}`} className={clsx(card, 'grid gap-1 hover:border-gold-deep dark:hover:border-gold')}>
            <div className="font-display font-semibold tracking-wider">{k.title}</div>
            <p className={clsx('line-clamp-3 text-sm', muted)}>{k.body.replace(/\*\*/g, '').split('\n').filter(Boolean)[0]}</p>
            <div className="font-mono text-xs text-gold-deep dark:text-gold">{k.tags.map(t => '#' + t).join(' ')}</div>
          </Link>
        ))}
      </div>
      <section className={card}>
        <h2 className="font-display text-lg font-semibold tracking-wide">Your notes</h2>
        <p className={clsx('mt-1 text-sm', muted)}>Anything Claude should remember: things to avoid, ideas, inside jokes, memories to use later.</p>
        <Textarea rows={8} className="mt-3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Don't show the real college logo. Use the canteen samosa joke in a later episode…" />
        <div className="mt-3"><Button variant="primary" disabled={notes === (p.notes || '')} loading={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save notes'}</Button></div>
      </section>
    </div>
  );
}
