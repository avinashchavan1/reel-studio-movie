import { useEffect, useState } from 'react';
import { Heart, Map as MapIcon, Mic2, Network, Plus, Trash2, Users } from 'lucide-react';
import { Project, saveDoc, useAct } from '../api';
import { Button, Card, Input, PageHeader, Select, Tabs, useTab } from '../components/ui';
import Cast from './Cast';
import Places from './Places';
import Voices from './Voices';

function Relationships({ p }: { p: Project }) {
  const [rels, setRels] = useState(p.world.relations); useEffect(() => setRels(p.world.relations), [p.world.relations]);
  const save = useAct((r: typeof rels) => saveDoc('world', { ...p.world, relations: r }), { success: 'Saved' });
  const chars = p.characters.filter(c => c.role !== 'narrator');
  const lead = chars.find(c => c.id === 'ishita') || chars[0];
  // lead in the centre, everyone else on a circle around them
  const others = chars.filter(c => c.id !== lead?.id);
  const W = 640, H = 460, cx = W / 2, cy = H / 2;
  const pos: Record<string, [number, number]> = lead ? { [lead.id]: [cx, cy] } : {};
  others.forEach((c, i) => { const a = (i / others.length) * Math.PI * 2 - Math.PI / 2; pos[c.id] = [cx + Math.cos(a) * 190, cy + Math.sin(a) * 165]; });
  const name = (id: string) => p.characters.find(c => c.id === id)?.name || id;
  return (
    <>
      <PageHeader title="Relationship map" subtitle="Who is who to whom. Claude uses this when writing scenes." />
      <div className="grid xl:grid-cols-[1fr_380px] gap-4">
        <Card>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {rels.filter(r => pos[r.a] && pos[r.b]).map((r, i) => {
              const [x1, y1] = pos[r.a], [x2, y2] = pos[r.b]; const romantic = /partner|love|crush/i.test(r.label);
              return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={romantic ? '#ec4899' : 'rgba(255,255,255,.18)'} strokeWidth={romantic ? 3 : 1.5} strokeDasharray={romantic ? '' : '5 5'} />
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize="11" fill={romantic ? '#f9a8d4' : '#a1a1aa'}>{r.label}</text></g>;
            })}
            {chars.filter(c => pos[c.id]).map(c => { const [x, y] = pos[c.id]; return (
              <g key={c.id}><circle cx={x} cy={y} r={c.id === lead?.id ? 40 : 30} fill={c.color + '33'} stroke={c.color} strokeWidth="2.5" />
                <text x={x} y={y + 4} textAnchor="middle" fontSize={c.id === lead?.id ? 15 : 12} fontWeight="600" fill="#fff">{c.name}</text></g>); })}
          </svg>
        </Card>
        <Card title="Connections" actions={<Button size="sm" variant="primary" onClick={() => save.mutate(rels)} loading={save.isPending}>Save</Button>}>
          <div className="space-y-2">
            {rels.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                <Select value={r.a} onChange={e => setRels(rels.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} options={chars.map(c => ({ value: c.id, label: c.name }))} />
                <Select value={r.b} onChange={e => setRels(rels.map((x, j) => j === i ? { ...x, b: e.target.value } : x))} options={chars.map(c => ({ value: c.id, label: c.name }))} />
                <Button size="sm" variant="danger" onClick={() => setRels(rels.filter((_, j) => j !== i))} icon={<Trash2 className="size-3.5" />} />
                <Input className="col-span-3" value={r.label} onChange={e => setRels(rels.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder={`${name(r.a)} is … to ${name(r.b)}`} />
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setRels([...rels, { a: lead?.id || '', b: others[0]?.id || '', label: '' }])} icon={<Plus className="size-3.5" />}>Add connection</Button>
          </div>
          <p className="text-[11px] text-zinc-500 mt-3 flex items-center gap-1"><Heart className="size-3 text-pink-400" />Labels with “love”, “partner” or “crush” are drawn as the romance line.</p>
        </Card>
      </div>
    </>
  );
}

export default function World({ p }: { p: Project }) {
  const [tab, setTab] = useTab('characters');
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'characters', label: 'Characters', icon: <Users className="size-4" />, count: p.characters.length },
        { id: 'places', label: 'Places', icon: <MapIcon className="size-4" />, count: p.places.length },
        { id: 'voices', label: 'Voice Lab', icon: <Mic2 className="size-4" /> },
        { id: 'relations', label: 'Relationships', icon: <Network className="size-4" /> },
      ]} />
      {tab === 'places' ? <Places p={p} /> : tab === 'voices' ? <Voices p={p} /> : tab === 'relations' ? <Relationships p={p} /> : <Cast p={p} />}
    </>
  );
}
