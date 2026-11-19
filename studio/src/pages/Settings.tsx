import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Download, Eye, EyeOff, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { api, Project, useAct } from '../api';
import { Button, Card, Field, Input, PageHeader, Select } from '../components/ui';
import { CreditsWidget } from '../App';

export default function Settings({ p }: { p: Project }) {
  const qc = useQueryClient();
  const [series, setSeries] = useState(p.series); useEffect(() => setSeries(p.series), [p.series]);
  const saveSeries = useAct(() => api('/series', { method: 'PUT', body: series }), { success: 'Series saved' });
  const { data: map } = useQuery({ queryKey: ['name-map'], queryFn: () => api<{ real: string; series: string; kind: string }[]>('/privacy/name-map') });
  const [rows, setRows] = useState<{ real: string; series: string; kind: string }[]>([]); const [show, setShow] = useState(false);
  useEffect(() => { if (map) setRows(map); }, [map]);
  const saveMap = useAct(() => api('/privacy/name-map', { method: 'PUT', body: rows }).then(() => qc.invalidateQueries({ queryKey: ['name-map'] })), { success: 'Private name map saved', invalidate: ['analysis'] });
  const counts = { reels: p.episodes.length, stories: p.stories.length, characters: p.characters.length, places: p.places.length, notes: p.knowledge.length, planned: p.plan.items.length };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Series" actions={<Button size="sm" variant="primary" onClick={() => saveSeries.mutate()} loading={saveSeries.isPending} icon={<Save className="size-3.5" />}>Save</Button>}>
          <div className="space-y-3">
            <Field label="Title"><Input value={series.title} onChange={e => setSeries({ ...series, title: e.target.value })} /></Field>
            <Field label="Tagline"><Input value={series.tagline} onChange={e => setSeries({ ...series, tagline: e.target.value })} /></Field>
            <Field label="Language"><Select value={series.language} onChange={e => setSeries({ ...series, language: e.target.value })} options={['Hinglish', 'Hindi', 'English', 'Kannada'].map(v => ({ value: v, label: v }))} /></Field>
            <Field label="Default hashtags"><Input value={series.hashtags.map(h => '#' + h).join(' ')} onChange={e => setSeries({ ...series, hashtags: e.target.value.split(/[\s,#]+/).filter(Boolean) })} /></Field>
            <Field label="Background score style" hint="Global music style; each shot's mood adds its own flavour"><Input value={series.musicStyle.join(', ')} onChange={e => setSeries({ ...series, musicStyle: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></Field>
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="ElevenLabs" subtitle="Voices + background score"><CreditsWidget /><p className="text-xs text-zinc-500 mt-3">The key comes from the environment (ELEVENLABS_API_KEY, or the secure network secret in Claude Code). It is never stored in this app.</p></Card>
          <Card title={<span className="flex items-center gap-2"><Database className="size-4" />Data & backup</span>} subtitle="Everything public is committed to GitHub after every change">
            <div className="grid grid-cols-3 gap-2 mb-3">{Object.entries(counts).map(([k, v]) => <div key={k} className="rounded-xl bg-white/[.03] ring-1 ring-white/[.06] p-2 text-center"><div className="text-lg font-bold">{v}</div><div className="text-[11px] text-zinc-500">{k}</div></div>)}</div>
            <a href="/api/backup"><Button icon={<Download className="size-4" />}>Download full backup (JSON)</Button></a>
          </Card>
        </div>
        <Card className="lg:col-span-2" title={<span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-400" />Privacy: real ↔ series names</span>}
          subtitle="Stored only on this machine (data/private), never committed or published. Used to auto-anonymize story dumps and block leaks."
          actions={<><Button size="sm" variant="ghost" onClick={() => setShow(!show)} icon={show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}>{show ? 'Hide' : 'Show'}</Button><Button size="sm" variant="primary" onClick={() => saveMap.mutate()} loading={saveMap.isPending} icon={<Save className="size-3.5" />}>Save</Button></>}>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_140px_auto] gap-2">
                <Input type={show ? 'text' : 'password'} value={r.real} placeholder="Real name / place" onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, real: e.target.value } : x))} />
                <Input value={r.series} placeholder="Series name" onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, series: e.target.value } : x))} />
                <Select value={r.kind} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, kind: e.target.value } : x))} options={['person', 'place', 'college', 'other'].map(v => ({ value: v, label: v }))} />
                <Button size="sm" variant="danger" onClick={() => setRows(rows.filter((_, j) => j !== i))} icon={<Trash2 className="size-3.5" />} />
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setRows([...rows, { real: '', series: '', kind: 'person' }])} icon={<Plus className="size-3.5" />}>Add mapping</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
