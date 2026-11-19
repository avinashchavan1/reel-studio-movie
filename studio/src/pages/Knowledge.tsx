import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import { api, KB, Project, useAct } from '../api';
import { Badge, Button, Card, Input, Markdown, PageHeader, Textarea } from '../components/ui';

function Article({ a }: { a: KB }) {
  const [edit, setEdit] = useState(false); const [d, setD] = useState(a); useEffect(() => setD(a), [a]);
  const save = useAct(() => api(`/knowledge/${a.id}`, { method: 'PUT', body: d }), { success: 'Saved' });
  const del = useAct(() => api(`/knowledge/${a.id}`, { method: 'DELETE' }));
  return (
    <Card title={edit ? <Input value={d.title} onChange={e => setD({ ...d, title: e.target.value })} /> : a.title}
      subtitle={!edit && <span className="flex gap-1 mt-1">{a.tags.map(t => <Badge key={t}>#{t}</Badge>)}</span>}
      actions={edit ? <><Button size="sm" variant="danger" onClick={() => confirm('Delete article?') && del.mutate()} icon={<Trash2 className="size-3.5" />} /><Button size="sm" variant="primary" loading={save.isPending} onClick={async () => { await save.mutateAsync(); setEdit(false); }} icon={<Save className="size-3.5" />}>Save</Button></> : <Button size="sm" variant="ghost" onClick={() => setEdit(true)} icon={<Pencil className="size-3.5" />} />}>
      {edit ? <div className="space-y-2"><Textarea rows={12} value={d.body} onChange={e => setD({ ...d, body: e.target.value })} /><Input value={d.tags.join(', ')} onChange={e => setD({ ...d, tags: e.target.value.split(/[,\s]+/).filter(Boolean) })} placeholder="tags" /></div> : <Markdown text={a.body} />}
    </Card>
  );
}

export default function Knowledge({ p }: { p: Project }) {
  const [q, setQ] = useState(''); const [tag, setTag] = useState('');
  const tags = useMemo(() => [...new Set(p.knowledge.flatMap(k => k.tags))], [p.knowledge]);
  const list = p.knowledge.filter(k => (!tag || k.tags.includes(tag)) && (!q || (k.title + k.body).toLowerCase().includes(q.toLowerCase())));
  const add = useAct(() => api('/knowledge', { body: { title: 'New note', tags: [], body: '' } }), { success: 'Added' });
  return (
    <>
      <PageHeader title="Knowledge Base" subtitle="The studio's playbook: viral hooks, retention, captions, style, cast and privacy rules. Claude reads this when writing."
        actions={<Button variant="primary" onClick={() => add.mutate()} icon={<Plus className="size-4" />}>Add note</Button>} />
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative"><Search className="size-4 absolute left-3 top-2.5 text-zinc-500" /><Input className="!pl-9 !w-64" value={q} onChange={e => setQ(e.target.value)} placeholder="Search the playbook…" /></div>
        <Button size="sm" variant={!tag ? 'primary' : 'ghost'} onClick={() => setTag('')}>All</Button>
        {tags.map(t => <Button key={t} size="sm" variant={tag === t ? 'primary' : 'ghost'} onClick={() => setTag(t)}>#{t}</Button>)}
      </div>
      {!list.length ? <div className="text-zinc-500 flex items-center gap-2"><BookOpen className="size-4" />No matching notes.</div> :
        <div className="grid lg:grid-cols-2 gap-4">{list.map(a => <Article key={a.id} a={a} />)}</div>}
    </>
  );
}
