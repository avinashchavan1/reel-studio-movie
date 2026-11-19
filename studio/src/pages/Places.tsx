import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { api, Place, Project, useAct } from '../api';
import { Button, Card, Input, PageHeader, Select, Textarea } from '../components/ui';

const SCENES = [
  { value: 'town', label: '🏡 Small town street' }, { value: 'room', label: '🛋️ Home interior' }, { value: 'hostel', label: '✨ Hostel room' },
  { value: 'train', label: '🚆 Train journey' }, { value: 'station', label: '🚉 Railway platform' }, { value: 'city', label: '🌆 Big city' },
  { value: 'college', label: '🏛️ College campus' }, { value: 'night', label: '🌙 Night sky' }, { value: 'sky', label: '☁️ Plain sky' },
];

function PlaceRow({ pl }: { pl: Place }) {
  const [d, setD] = useState(pl); useEffect(() => setD(pl), [pl]);
  const save = useAct(() => api(`/places/${pl.id}`, { method: 'PUT', body: d }), { success: 'Saved' });
  const del = useAct(() => api(`/places/${pl.id}`, { method: 'DELETE' }));
  return (
    <Card>
      <div className="grid sm:grid-cols-[1fr_220px] gap-2">
        <Input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} className="font-semibold" />
        <Select value={d.scene} onChange={e => setD({ ...d, scene: e.target.value })} options={SCENES} />
      </div>
      <Textarea rows={2} className="mt-2" value={d.description} onChange={e => setD({ ...d, description: e.target.value })} placeholder="What it looks like…" />
      <div className="flex justify-between mt-2">
        <Button size="sm" variant="danger" onClick={() => confirm('Delete place?') && del.mutate()} icon={<Trash2 className="size-3.5" />}>Delete</Button>
        <Button size="sm" variant={JSON.stringify(d) !== JSON.stringify(pl) ? 'primary' : 'soft'} onClick={() => save.mutate()} loading={save.isPending} icon={<Save className="size-3.5" />}>Save</Button>
      </div>
    </Card>
  );
}

export default function Places({ p }: { p: Project }) {
  const add = useAct(() => api('/places', { body: { name: 'New place', scene: 'sky', description: '' } }), { success: 'Place added' });
  return (
    <>
      <PageHeader title="Places" subtitle="Locations in the story. Each one maps to a backdrop the renderer draws."
        actions={<Button variant="primary" onClick={() => add.mutate()} icon={<Plus className="size-4" />}>Add place</Button>} />
      <div className="grid md:grid-cols-2 gap-4">{p.places.map(pl => <PlaceRow key={pl.id} pl={pl} />)}</div>
    </>
  );
}
