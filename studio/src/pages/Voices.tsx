import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Wand2 } from 'lucide-react';
import { api, Project, useAct } from '../api';
import { Badge, Button, Card, Input, PageHeader, PlayButton, Select } from '../components/ui';
import { CreditsWidget } from '../App';

type Shared = { id: string; ownerId: string; name: string; gender: string; age: string; accent: string; descriptive: string; useCase: string; preview?: string };

export default function Voices({ p }: { p: Project }) {
  const qc = useQueryClient();
  const { data: mine = [] } = useQuery({ queryKey: ['el-voices'], queryFn: () => api<{ id: string; name: string; labels: any; preview?: string }[]>('/elevenlabs/voices'), retry: false });
  const [f, setF] = useState({ q: 'storyteller', language: 'hi', gender: '', age: '' }); const [results, setResults] = useState<Shared[]>([]);
  const [line, setLine] = useState('[softly] दो अजनबी... एक ही शहर... और एक WiFi hotspot।'); const [tested, setTested] = useState<Record<string, string>>({});
  const search = useAct(async () => { const r = await api<Shared[]>('/elevenlabs/search?' + new URLSearchParams(f)); setResults(r); return r; }, { invalidate: [] });
  const add = useAct((v: Shared) => api('/elevenlabs/add', { body: { ownerId: v.ownerId, voiceId: v.id, name: v.name } }).then(() => qc.invalidateQueries({ queryKey: ['el-voices'] })), { success: 'Added to your voices', invalidate: [] });
  const test = useAct(async (voiceId: string) => { const r = await api<{ url: string }>('/elevenlabs/preview', { body: { voiceId, text: line } }); setTested(t => ({ ...t, [voiceId]: r.url })); new Audio(r.url).play(); return r; }, { invalidate: ['credits'] });
  const usedBy = (id: string) => p.characters.filter(c => c.voice?.id === id).map(c => c.name);

  return (
    <>
      <PageHeader title="Voice Lab" subtitle="Audition voices with your own line, add them to your account, then assign them in Cast." />
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2" title="Test line" subtitle="Used for every ▶ Try button (costs credits per try)"><Input value={line} onChange={e => setLine(e.target.value)} /></Card>
        <Card title="Balance"><CreditsWidget /></Card>
      </div>
      <Card title="Find new voices" subtitle="ElevenLabs voice library">
        <div className="flex flex-wrap gap-2 mb-4">
          <Input className="!w-56" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} placeholder="romantic, deep, storyteller…" />
          <Select className="!w-36" value={f.language} onChange={e => setF({ ...f, language: e.target.value })} options={[{ value: 'hi', label: 'Hindi' }, { value: 'en', label: 'English' }, { value: 'kn', label: 'Kannada' }, { value: '', label: 'Any language' }]} />
          <Select className="!w-32" value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} options={[{ value: '', label: 'Any gender' }, { value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} />
          <Select className="!w-36" value={f.age} onChange={e => setF({ ...f, age: e.target.value })} options={[{ value: '', label: 'Any age' }, { value: 'young', label: 'Young' }, { value: 'middle_aged', label: 'Middle-aged' }, { value: 'old', label: 'Old' }]} />
          <Button variant="primary" onClick={() => search.mutate()} loading={search.isPending} icon={<Search className="size-4" />}>Search</Button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {results.map(v => (
            <div key={v.id} className="rounded-xl bg-white/[.03] ring-1 ring-white/[.07] p-3">
              <div className="font-medium text-sm text-zinc-100 truncate">{v.name}</div>
              <div className="flex flex-wrap gap-1 my-2"><Badge>{v.gender}</Badge><Badge>{v.age}</Badge>{v.descriptive && <Badge>{v.descriptive}</Badge>}{v.useCase && <Badge>{v.useCase.replace('_', ' ')}</Badge>}</div>
              <div className="flex gap-1.5"><PlayButton src={v.preview} label="Sample" /><Button size="sm" onClick={() => add.mutate(v)} icon={<Plus className="size-3.5" />}>Add</Button></div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-4" title={`Your voices (${mine.length})`}>
        <ul className="divide-y divide-white/5">
          {mine.map(v => (
            <li key={v.id} className="py-2.5 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48"><div className="text-sm text-zinc-100">{v.name}</div><div className="text-[11px] text-zinc-500">{[v.labels?.gender, v.labels?.age, v.labels?.accent].filter(Boolean).join(' · ')}</div></div>
              {usedBy(v.id).map(n => <Badge key={n} tone="new">{n}</Badge>)}
              <PlayButton src={v.preview} label="Sample" />
              <Button size="sm" onClick={() => test.mutate(v.id)} loading={test.isPending && test.variables === v.id} icon={<Wand2 className="size-3.5" />}>Try line</Button>
              {tested[v.id] && <PlayButton src={tested[v.id]} label="Replay" />}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
