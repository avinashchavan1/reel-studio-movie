import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Trash2 } from 'lucide-react';
import { api, Project, useAct } from '../api';
import { Badge, Button, card, Empty, Field, Input, muted, PageHeader, Textarea } from '../components/ui';

export default function Plan({ p }: { p: Project }) {
  const [f, setF] = useState({ title: '', where: '', beats: '' });
  const add = useAct(() => api('/plan', { body: f }), { success: 'Added to the plan' });
  const del = useAct((id: string) => api(`/plan/${id}`, { method: 'DELETE' }));
  const nextNum = Math.max(0, ...p.episodes.map(e => e.num), ...p.plan.items.map(i => i.num)) + 1;
  const made = [...p.episodes].sort((a, b) => a.num - b.num);
  const ideas = p.plan.items.filter(i => i.status === 'idea').sort((a, b) => a.num - b.num);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title="The plan" subtitle="Every part of the story, in order. Claude writes the next idea when you send the story." />
      <section className={card}>
        <h2 className="font-display text-lg font-semibold tracking-wide">New reel idea · STF-{String(nextNum).padStart(2, '0')}</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={async e => { e.preventDefault(); if (!f.title.trim()) return; await add.mutateAsync(); setF({ title: '', where: '', beats: '' }); }}>
          <Field label="Working title"><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="The Smartphone" /></Field>
          <Field label="Where in the story"><Input value={f.where} onChange={e => setF({ ...f, where: e.target.value })} placeholder="e.g. Sem 1 · her birthday" /></Field>
          <Field label="What happens (optional)" className="md:col-span-2"><Textarea rows={2} value={f.beats} onChange={e => setF({ ...f, beats: e.target.value })} placeholder="She gets her first smartphone and finds the hotspot button…" /></Field>
          <div><Button variant="primary" loading={add.isPending}>{add.isPending ? 'Adding…' : 'Add to the plan'}</Button></div>
        </form>
      </section>
      <section className="grid gap-3">
        {!made.length && !ideas.length && <Empty>The plan is empty.</Empty>}
        {made.map(e => (
          <Link key={e.id} to={`/reels/${e.id}`} className={clsx(card, 'flex items-center gap-4 hover:border-gold-deep dark:hover:border-gold')}>
            <span className="font-mono text-xs text-gold-deep dark:text-gold">{e.code}</span>
            <div className="min-w-0 flex-1"><div className="font-semibold">{e.title}</div><div className={clsx('truncate text-sm', muted)}>{e.where || e.synopsis}</div></div><Badge tone={e.stage}>{e.stage}</Badge>
          </Link>
        ))}
        {ideas.map(i => (
          <div key={i.id} className={clsx(card, 'flex items-start gap-4')}>
            <span className="mt-0.5 font-mono text-xs text-gold-deep dark:text-gold">STF-{String(i.num).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1"><div className="font-semibold">{i.title}</div>{i.where && <div className={clsx('text-sm', muted)}>{i.where}</div>}{i.beats && <p className="mt-1 text-sm">{i.beats}</p>}</div>
            <Badge tone="idea">idea</Badge><button aria-label="Remove" onClick={() => confirm('Remove this idea?') && del.mutate(i.id)} className="text-ink-soft hover:text-vermilion dark:text-parchment/50"><Trash2 size={15} /></button>
          </div>
        ))}
      </section>
    </div>
  );
}
