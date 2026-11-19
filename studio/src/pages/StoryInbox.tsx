import { useEffect, useState } from 'react';
import { Check, Inbox, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { api, Project, useAct } from '../api';
import { Badge, Button, Card, Empty, Input, PageHeader, Textarea } from '../components/ui';

export default function StoryInbox({ p }: { p: Project }) {
  const [text, setText] = useState(''); const [tags, setTags] = useState('');
  const [preview, setPreview] = useState<{ text: string; replaced: { real: string; series: string }[] } | null>(null);
  const [selected, setSelected] = useState<string[]>([]); const [note, setNote] = useState('');
  useEffect(() => { if (!text.trim()) { setPreview(null); return; } const t = setTimeout(() => api('/anonymize', { body: { text } }).then(setPreview).catch(() => {}), 400); return () => clearTimeout(t); }, [text]);
  const save = useAct(() => api('/stories', { body: { text, tags: tags.split(/[,\s]+/).filter(Boolean) } }), { success: 'Saved (anonymized)' });
  const del = useAct((id: string) => api(`/stories/${id}`, { method: 'DELETE' }));
  const ask = useAct((kind: string) => api('/claude-requests', { body: { kind, storyIds: selected, note } }), { success: 'Queued for Claude. Tell Claude Code: “check the studio”' });
  const delReq = useAct((id: string) => api(`/claude-requests/${id}`, { method: 'DELETE' }));
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <>
      <PageHeader title="Story Inbox" subtitle="Dump the story as it comes, any language, any order. Real names are swapped for series names automatically." />
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card title="New story dump">
            <Textarea rows={9} value={text} onChange={e => setText(e.target.value)} placeholder="So after we started texting… (paste chats, memories, anything)" />
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Input className="!w-60" value={tags} onChange={e => setTags(e.target.value)} placeholder="tags: first-date, hostel…" />
              <Button variant="primary" disabled={!text.trim()} loading={save.isPending} onClick={async () => { await save.mutateAsync(); setText(''); setTags(''); }} icon={<Check className="size-4" />}>Save to inbox</Button>
            </div>
            {preview && (
              <div className="mt-4 rounded-xl bg-emerald-500/5 ring-1 ring-emerald-500/20 p-3">
                <div className="flex items-center gap-2 text-xs text-emerald-300 mb-1.5"><ShieldCheck className="size-4" />Privacy preview: {preview.replaced.length ? preview.replaced.map(r => `${r.real} → ${r.series}`).join(', ') : 'no real names found'}</div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap max-h-40 overflow-auto">{preview.text}</p>
              </div>
            )}
          </Card>
          <Card title={`Stories (${p.stories.length})`} subtitle="Select stories, then ask Claude to turn them into an episode">
            {!p.stories.length ? <Empty icon={<Inbox className="size-8" />} title="No stories yet">Your story dumps will appear here.</Empty> : (
              <ul className="space-y-2">
                {p.stories.map(s => (
                  <li key={s.id} className={`rounded-xl p-3 ring-1 transition cursor-pointer ${selected.includes(s.id) ? 'bg-pink-500/10 ring-pink-500/40' : 'bg-white/[.02] ring-white/[.06] hover:ring-white/20'}`} onClick={() => toggle(s.id)}>
                    <div className="flex items-center gap-2 mb-1"><input type="checkbox" readOnly checked={selected.includes(s.id)} className="accent-pink-500" /><span className="text-xs text-zinc-500">{new Date(s.createdAt).toLocaleString()}</span><Badge tone={s.status}>{s.status}</Badge>{s.tags.map(t => <Badge key={t}>#{t}</Badge>)}
                      <button className="ml-auto text-zinc-500 hover:text-rose-300" onClick={e => { e.stopPropagation(); if (confirm('Delete this story?')) del.mutate(s.id); }}><Trash2 className="size-4" /></button></div>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap line-clamp-4">{s.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Card title="Ask Claude" subtitle="Claude writes inside Claude Code, at no extra cost">
            <p className="text-sm text-zinc-400 mb-3">{selected.length ? `${selected.length} stor${selected.length > 1 ? 'ies' : 'y'} selected.` : 'Select stories on the left (or none for "next episode from everything").'}</p>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Note for Claude (optional): make it funnier, end on the first call…" />
            <div className="grid gap-2 mt-3">
              <Button variant="primary" loading={ask.isPending} onClick={() => ask.mutate('write-episode')} icon={<Sparkles className="size-4" />}>Write next episode</Button>
              <Button onClick={() => ask.mutate('plan-season')}>Plan upcoming episodes</Button>
              <Button onClick={() => ask.mutate('improve-hooks')}>Punch up hooks & captions</Button>
            </div>
            <div className="mt-4 rounded-xl bg-white/[.03] ring-1 ring-white/10 p-3 text-xs text-zinc-400">Then open Claude Code and say <span className="text-pink-300 font-medium">“check the studio”</span>. Claude reads the queue, writes the episode into the app, and marks the request done.</div>
          </Card>
          <Card title="Queue">
            {!p.claudeRequests.length ? <p className="text-sm text-zinc-500">Empty.</p> : (
              <ul className="space-y-2">{p.claudeRequests.map(r => (
                <li key={r.id} className="rounded-xl bg-white/[.02] ring-1 ring-white/[.06] p-3 text-sm">
                  <div className="flex items-center gap-2"><Badge tone={r.status}>{r.status}</Badge><span className="font-medium">{r.kind.replace(/-/g, ' ')}</span><span className="text-xs text-zinc-500 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <button className="text-zinc-500 hover:text-rose-300" onClick={() => delReq.mutate(r.id)}><Trash2 className="size-3.5" /></button></div>
                  {r.note && <p className="text-xs text-zinc-400 mt-1">“{r.note}”</p>}
                  {r.result && <p className="text-xs text-emerald-300 mt-1">{r.result}</p>}
                </li>))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
