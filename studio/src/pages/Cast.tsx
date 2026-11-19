import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import { api, Character, Project, useAct } from '../api';
import { Button, Card, Field, Input, PageHeader, PlayButton, Select, Textarea } from '../components/ui';
import { CharacterPreview } from '../components/CharacterPreview';

export const LOOKS = [
  { value: '', label: 'Voice only (no body)' }, { value: 'tara', label: 'Girl: long hair, kurta' }, { value: 'kabir', label: 'Boy: spiky hair, hoodie' },
  { value: 'zoya', label: 'Girl: bun + glasses' }, { value: 'pihu', label: 'Girl: pigtails' }, { value: 'appa', label: 'Father: moustache' }, { value: 'amma', label: 'Mother: saree' },
];

function CharacterCard({ c, voices }: { c: Character; voices: { id: string; name: string; preview?: string }[] }) {
  const [d, setD] = useState(c); useEffect(() => setD(c), [c]);
  const save = useAct(() => api(`/characters/${c.id}`, { method: 'PUT', body: d }), { success: `${d.name} saved` });
  const del = useAct(() => api(`/characters/${c.id}`, { method: 'DELETE' }), { success: 'Removed' });
  const [line, setLine] = useState('');
  const tryVoice = useAct(() => api<{ url: string }>('/elevenlabs/preview', { body: { voiceId: d.voice?.id, text: line || `नमस्ते, मैं ${d.name} हूँ।` } }).then(r => { new Audio(r.url).play(); return r; }), { invalidate: ['credits'] });
  const changed = JSON.stringify(c) !== JSON.stringify(d);
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4">
        <div className="shrink-0 rounded-xl grid place-items-center" style={{ background: `radial-gradient(circle at 50% 70%, ${d.color}33, transparent 70%)` }}><CharacterPreview look={d.look} size={150} /></div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex gap-2"><Input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} className="font-semibold" /><input type="color" value={d.color} onChange={e => setD({ ...d, color: e.target.value })} className="h-9 w-10 rounded-lg bg-transparent" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={d.role} onChange={e => setD({ ...d, role: e.target.value })} options={['lead', 'friend', 'classmate', 'parent', 'narrator', 'other'].map(v => ({ value: v, label: v }))} />
            <Select value={d.look || ''} onChange={e => setD({ ...d, look: e.target.value || null })} options={LOOKS} />
          </div>
        </div>
      </div>
      <div className="space-y-3 mt-3">
        <Textarea rows={2} value={d.description} onChange={e => setD({ ...d, description: e.target.value })} placeholder="Personality, outfit, quirks…" />
        <Field label="Voice">
          <Select value={d.voice?.id || ''} onChange={e => { const v = voices.find(x => x.id === e.target.value); setD({ ...d, voice: v ? { id: v.id, name: v.name, model: 'eleven_v3' } : null }); }}
            options={[{ value: '', label: '— no voice —' }, ...voices.map(v => ({ value: v.id, label: v.name })), ...(d.voice && !voices.find(v => v.id === d.voice!.id) ? [{ value: d.voice.id, label: d.voice.name }] : [])]} />
        </Field>
        {d.voice && <div className="flex gap-2"><Input value={line} onChange={e => setLine(e.target.value)} placeholder="Type a line to test this voice…" /><Button onClick={() => tryVoice.mutate()} loading={tryVoice.isPending}>Try</Button><PlayButton src={voices.find(v => v.id === d.voice!.id)?.preview} /></div>}
        <div className="flex justify-between">
          <Button size="sm" variant="danger" onClick={() => confirm(`Remove ${d.name}?`) && del.mutate()} icon={<Trash2 className="size-3.5" />}>Remove</Button>
          <Button size="sm" variant={changed ? 'primary' : 'soft'} disabled={!changed} loading={save.isPending} onClick={() => save.mutate()} icon={<Save className="size-3.5" />}>Save</Button>
        </div>
      </div>
    </Card>
  );
}

export default function Cast({ p }: { p: Project }) {
  const { data: voices = [] } = useQuery({ queryKey: ['el-voices'], queryFn: () => api<{ id: string; name: string; preview?: string }[]>('/elevenlabs/voices'), retry: false });
  const add = useAct(() => api('/characters', { body: { name: 'New character', role: 'other', description: '', color: '#f472b6', look: 'tara', voice: null } }), { success: 'Character added' });
  return (
    <>
      <PageHeader title="Cast" subtitle="Characters, their looks and voices. Real names live only in Settings → Privacy."
        actions={<Button variant="primary" onClick={() => add.mutate()} icon={<Plus className="size-4" />}>Add character</Button>} />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{p.characters.map(c => <CharacterCard key={c.id} c={c} voices={voices} />)}</div>
    </>
  );
}
