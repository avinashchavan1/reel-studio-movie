import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Plus, Save, ShieldCheck, Trash2, MonitorPlay as Youtube, Camera as Instagram } from "lucide-react";
import { api, Project, useAct } from '../api';
import { Badge, Button, Card, Field, Input, PageHeader, Select } from '../components/ui';
import { CreditsWidget } from '../App';

export default function Settings({ p }: { p: Project }) {
  const qc = useQueryClient();
  const [series, setSeries] = useState(p.series); useEffect(() => setSeries(p.series), [p.series]);
  const saveSeries = useAct(() => api('/series', { method: 'PUT', body: series }), { success: 'Series saved' });

  const { data: integ } = useQuery({ queryKey: ['integrations'], queryFn: () => api<any>('/integrations') });
  const [yt, setYt] = useState({ clientId: '', clientSecret: '' }); const [ig, setIg] = useState({ igUserId: '', accessToken: '', publicBaseUrl: '' });
  useEffect(() => { if (integ) { setYt({ clientId: '', clientSecret: '', ...integ.settings.youtube }); setIg({ igUserId: '', accessToken: '', publicBaseUrl: '', ...integ.settings.instagram }); } }, [integ]);
  const saveInteg = useAct(() => api('/integrations', { method: 'PUT', body: { youtube: yt, instagram: ig } }).then(() => qc.invalidateQueries({ queryKey: ['integrations'] })), { success: 'Integrations saved', invalidate: [] });

  const { data: map } = useQuery({ queryKey: ['name-map'], queryFn: () => api<{ real: string; series: string; kind: string }[]>('/privacy/name-map') });
  const [rows, setRows] = useState<{ real: string; series: string; kind: string }[]>([]); const [show, setShow] = useState(false);
  useEffect(() => { if (map) setRows(map); }, [map]);
  const saveMap = useAct(() => api('/privacy/name-map', { method: 'PUT', body: rows }).then(() => qc.invalidateQueries({ queryKey: ['name-map'] })), { success: 'Private name map saved', invalidate: ['analysis'] });
  const st = integ?.status || {};

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Series" actions={<Button size="sm" variant="primary" onClick={() => saveSeries.mutate()} loading={saveSeries.isPending} icon={<Save className="size-3.5" />}>Save</Button>}>
          <div className="space-y-3">
            <Field label="Title"><Input value={series.title} onChange={e => setSeries({ ...series, title: e.target.value })} /></Field>
            <Field label="Tagline"><Input value={series.tagline} onChange={e => setSeries({ ...series, tagline: e.target.value })} /></Field>
            <Field label="Default hashtags"><Input value={series.hashtags.map(h => '#' + h).join(' ')} onChange={e => setSeries({ ...series, hashtags: e.target.value.split(/[\s,#]+/).filter(Boolean) })} /></Field>
            <Field label="Background score style" hint="Global music style; each shot's mood adds its own flavour"><Input value={series.musicStyle.join(', ')} onChange={e => setSeries({ ...series, musicStyle: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></Field>
          </div>
        </Card>
        <Card title="ElevenLabs" subtitle="Voices + background score"><CreditsWidget /><p className="text-xs text-zinc-500 mt-3">The key is supplied by the environment (ELEVENLABS_API_KEY, or the secure network secret in Claude Code). It is never stored in this app.</p></Card>

        <Card title={<span className="flex items-center gap-2"><Youtube className="size-4 text-red-400" />YouTube</span>} subtitle="Direct upload to YouTube Shorts"
          actions={st.youtube?.connected ? <Badge tone="done">connected{st.youtube.channel ? ` · ${st.youtube.channel}` : ''}</Badge> : <Badge>not connected</Badge>}>
          <ol className="text-xs text-zinc-400 list-decimal ml-4 space-y-1 mb-3">
            <li>Google Cloud Console → create a project → enable <b>YouTube Data API v3</b>.</li>
            <li>OAuth consent screen (External) → add yourself as a test user.</li>
            <li>Credentials → OAuth client ID → <b>Web application</b> → redirect URI: <code className="text-pink-300">{location.origin.replace(':5173', ':5174')}/api/auth/youtube/callback</code></li>
          </ol>
          <div className="space-y-2">
            <Input value={yt.clientId} onChange={e => setYt({ ...yt, clientId: e.target.value })} placeholder="Client ID" />
            <Input type="password" value={yt.clientSecret} onChange={e => setYt({ ...yt, clientSecret: e.target.value })} placeholder="Client secret" />
            <div className="flex gap-2"><Button size="sm" onClick={() => saveInteg.mutate()} loading={saveInteg.isPending}>Save</Button>
              <Button size="sm" variant="primary" disabled={!st.youtube?.configured} onClick={() => window.open('/api/auth/youtube/start', '_blank')}>Connect YouTube</Button></div>
          </div>
        </Card>

        <Card title={<span className="flex items-center gap-2"><Instagram className="size-4 text-pink-400" />Instagram</span>} subtitle="Direct Reels publishing (Business/Creator account)"
          actions={st.instagram?.configured ? <Badge tone="done">configured</Badge> : <Badge>not set up</Badge>}>
          <ol className="text-xs text-zinc-400 list-decimal ml-4 space-y-1 mb-3">
            <li>Switch your Instagram to a <b>Creator/Business</b> account linked to a Facebook Page.</li>
            <li>developers.facebook.com → create an app → add <b>Instagram Graph API</b> → generate a long-lived token with <code>instagram_content_publish</code>.</li>
            <li>Instagram fetches the video from a public URL, so set the studio's public address (your deployed URL or a tunnel).</li>
          </ol>
          <div className="space-y-2">
            <Input value={ig.igUserId} onChange={e => setIg({ ...ig, igUserId: e.target.value })} placeholder="Instagram user ID" />
            <Input type="password" value={ig.accessToken} onChange={e => setIg({ ...ig, accessToken: e.target.value })} placeholder="Access token" />
            <Input value={ig.publicBaseUrl} onChange={e => setIg({ ...ig, publicBaseUrl: e.target.value })} placeholder="Public base URL, e.g. https://my-studio.up.railway.app" />
            <Button size="sm" onClick={() => saveInteg.mutate()} loading={saveInteg.isPending}>Save</Button>
          </div>
        </Card>

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
