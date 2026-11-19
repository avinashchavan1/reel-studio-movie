import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { CheckCircle2, Circle, Copy, ExternalLink, MonitorPlay, Camera, Plus, Save, Send, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { api, newId, Profile, Project, saveDoc, Stat, useAct } from '../api';
import { Badge, Button, Card, Field, Input, PageHeader, Select, Sparkline, Textarea } from '../components/ui';
import { HubCard } from './Publish';

const META: Record<string, { name: string; color: string; bioMax: number; icon: React.ReactNode; url: (h: string) => string; checklist: string[]; ideas: string[] }> = {
  instagram: { name: 'Instagram', color: '#e1306c', bioMax: 150, icon: <Camera className="size-4" />, url: h => `https://instagram.com/${h}`,
    checklist: ['Switch to a Creator account', 'Profile photo = series cover art', 'Bio says what the series is + “Start from Part 1”', 'Pin Part 1 (and the latest part) to the grid', 'Story highlight “Strangers to Forever”', 'Link in bio → YouTube playlist / Publish Hub', 'Reply to the first 10 comments on every reel'],
    ideas: ['Our love story, one reel at a time 💕\nStrangers in college → forever\n👇 Start from Part 1', 'Ek WiFi hotspot se shuru hui kahani 📶❤️\nAnimated love story · new part every 2 days', 'POV: you fell for a stranger in engineering 🎓💕\nPart 1 pinned 👇'] },
  youtube: { name: 'YouTube', color: '#ff0000', bioMax: 1000, icon: <MonitorPlay className="size-4" />, url: h => `https://youtube.com/@${h}`,
    checklist: ['Channel banner with series art', 'Playlist “Strangers to Forever” in episode order', 'Ep 1 as the channel trailer / featured video', 'Description mentions the posting schedule', 'Add every Short to the playlist after posting', 'Pin a comment “Part N+1 is up 👉” on each Short'],
    ideas: ['An animated Hinglish love story told in Shorts: two strangers, one engineering college, one WiFi hotspot. New part every few days. Subscribe 🔔 so you never miss a part.'] },
  facebook: { name: 'Facebook', color: '#1877f2', bioMax: 255, icon: <Send className="size-4" />, url: h => `https://facebook.com/${h}`,
    checklist: ['Create a Page for the series', 'Link Instagram for cross-posting', 'Post Reels with the same caption'], ideas: ['Strangers to Forever: an animated love story, one reel at a time 💕'] },
  moj: { name: 'Moj', color: '#f59e0b', bioMax: 80, icon: <Send className="size-4" />, url: h => `https://mojapp.in/@${h}`,
    checklist: ['Profile set up with the same name', 'Same profile photo as Instagram', 'Post within an hour of Instagram'], ideas: ['Animated love story 💕 Part 1 se dekho'] },
};

function ProfileCard({ k, prof, stats, onSave, status }: { k: string; prof: Profile; stats: Stat[]; onSave: (p: Profile) => void; status?: string }) {
  const m = META[k]; const [d, setD] = useState(prof); useEffect(() => setD(prof), [prof]);
  const done = m.checklist.filter(c => d.checklist?.[c]).length; const changed = JSON.stringify(d) !== JSON.stringify(prof);
  const series = stats.filter(s => s.platform === k).sort((a, b) => a.date.localeCompare(b.date));
  const last = series[series.length - 1], prev = series[series.length - 2];
  return (
    <Card title={<span className="flex items-center gap-2"><span style={{ color: m.color }}>{m.icon}</span>{m.name}{d.handle && <a href={m.url(d.handle)} target="_blank" className="text-xs text-zinc-400 hover:text-pink-300 inline-flex items-center gap-1">@{d.handle}<ExternalLink className="size-3" /></a>}</span>}
      subtitle={`${done}/${m.checklist.length} profile checklist done`} actions={<>{status && <Badge tone={status === 'connected' ? 'done' : undefined}>{status}</Badge>}<Button size="sm" variant={changed ? 'primary' : 'soft'} disabled={!changed} onClick={() => onSave(d)} icon={<Save className="size-3.5" />}>Save</Button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2"><Input value={d.displayName} onChange={e => setD({ ...d, displayName: e.target.value })} placeholder="Display name" /><Input value={d.handle} onChange={e => setD({ ...d, handle: e.target.value.replace('@', '') })} placeholder="handle" /></div>
          <Field label={`Bio (${d.bio.length}/${m.bioMax})`}><Textarea rows={4} value={d.bio} onChange={e => setD({ ...d, bio: e.target.value })} className={clsx(d.bio.length > m.bioMax && '!ring-rose-500')} /></Field>
          <div className="flex flex-wrap gap-1">{m.ideas.map((b, i) => <Button key={i} size="sm" variant="ghost" onClick={() => setD({ ...d, bio: b })}>Idea {i + 1}</Button>)}
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(d.bio); toast.success('Bio copied'); }} icon={<Copy className="size-3.5" />}>Copy</Button></div>
          <Input value={d.link} onChange={e => setD({ ...d, link: e.target.value })} placeholder="Link in bio" />
        </div>
        <div className="space-y-1.5">
          {m.checklist.map(c => (
            <button key={c} onClick={() => setD({ ...d, checklist: { ...d.checklist, [c]: !d.checklist?.[c] } })} className="flex w-full items-start gap-2 text-left text-xs text-zinc-300 hover:text-white">
              {d.checklist?.[c] ? <CheckCircle2 className="size-4 text-emerald-400 shrink-0" /> : <Circle className="size-4 text-zinc-600 shrink-0" />}<span className={clsx(d.checklist?.[c] && 'line-through text-zinc-500')}>{c}</span>
            </button>))}
          <div className="pt-3">
            <div className="flex items-baseline justify-between text-xs"><span className="text-zinc-400">Followers</span>{last && <span className="font-semibold text-white">{last.followers.toLocaleString()}{prev && <span className={clsx('ml-1', last.followers >= prev.followers ? 'text-emerald-300' : 'text-rose-300')}>{last.followers >= prev.followers ? '+' : ''}{(last.followers - prev.followers).toLocaleString()}</span>}</span>}</div>
            <Sparkline points={series.map(s => s.followers)} color={m.color} height={48} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function Connections() {
  const qc = useQueryClient();
  const { data: integ } = useQuery({ queryKey: ['integrations'], queryFn: () => api<any>('/integrations') });
  const [yt, setYt] = useState({ clientId: '', clientSecret: '' }); const [ig, setIg] = useState({ igUserId: '', accessToken: '', publicBaseUrl: '' });
  useEffect(() => { if (integ) { setYt({ clientId: '', clientSecret: '', ...integ.settings.youtube }); setIg({ igUserId: '', accessToken: '', publicBaseUrl: '', ...integ.settings.instagram }); } }, [integ]);
  const save = useAct(() => api('/integrations', { method: 'PUT', body: { youtube: yt, instagram: ig } }).then(() => qc.invalidateQueries({ queryKey: ['integrations'] })), { success: 'Saved', invalidate: [] });
  const st = integ?.status || {};
  return (
    <Card title="Direct publishing (optional)" subtitle="Not needed for the Publish Hub. Connect only if you want one-click posting from the studio.">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><MonitorPlay className="size-4 text-red-400" />YouTube {st.youtube?.connected ? <Badge tone="done">connected{st.youtube.channel ? ` · ${st.youtube.channel}` : ''}</Badge> : <Badge>not connected</Badge>}</div>
          <p className="text-xs text-zinc-500">Google Cloud → enable YouTube Data API v3 → OAuth client (Web) with redirect <code className="text-pink-300">{location.origin.replace(':5173', ':5174')}/api/auth/youtube/callback</code></p>
          <Input value={yt.clientId} onChange={e => setYt({ ...yt, clientId: e.target.value })} placeholder="Client ID" />
          <Input type="password" value={yt.clientSecret} onChange={e => setYt({ ...yt, clientSecret: e.target.value })} placeholder="Client secret" />
          <div className="flex gap-2"><Button size="sm" onClick={() => save.mutate()}>Save</Button><Button size="sm" variant="primary" disabled={!st.youtube?.configured} onClick={() => window.open('/api/auth/youtube/start', '_blank')}>Connect YouTube</Button></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><Camera className="size-4 text-pink-400" />Instagram {st.instagram?.configured ? <Badge tone="done">configured</Badge> : <Badge>not set up</Badge>}</div>
          <p className="text-xs text-zinc-500">Creator/Business account linked to a Facebook Page → Meta app with <code>instagram_content_publish</code> → long-lived token.</p>
          <Input value={ig.igUserId} onChange={e => setIg({ ...ig, igUserId: e.target.value })} placeholder="Instagram user ID" />
          <Input type="password" value={ig.accessToken} onChange={e => setIg({ ...ig, accessToken: e.target.value })} placeholder="Access token" />
          <Input value={ig.publicBaseUrl} onChange={e => setIg({ ...ig, publicBaseUrl: e.target.value })} placeholder="Public base URL of the studio" />
          <Button size="sm" onClick={() => save.mutate()}>Save</Button>
        </div>
      </div>
    </Card>
  );
}

export default function Profiles({ p }: { p: Project }) {
  const { data: integ } = useQuery({ queryKey: ['integrations'], queryFn: () => api<any>('/integrations') });
  const saveProf = useAct((x: { k: string; v: Profile }) => saveDoc('profiles', { ...p.profiles, [x.k]: x.v }), { success: 'Profile saved' });
  const saveStats = useAct((s: Stat[]) => saveDoc('stats', s), { success: 'Stats saved' });
  const [entry, setEntry] = useState({ date: new Date().toISOString().slice(0, 10), platform: 'instagram', followers: '', views: '' });
  const totalViews = p.stats.reduce((m, s) => ({ ...m, [s.platform]: s }), {} as Record<string, Stat>);
  const status = (k: string) => k === 'youtube' ? (integ?.status?.youtube?.connected ? 'connected' : undefined) : k === 'instagram' ? (integ?.status?.instagram?.configured ? 'connected' : undefined) : undefined;
  return (
    <>
      <PageHeader title="Profiles" subtitle="Your accounts: bios, profile checklists, growth tracking and how reels reach them." />
      <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-4">
        <Card title={<span className="flex items-center gap-2"><TrendingUp className="size-4 text-emerald-400" />Growth log</span>} subtitle="Note followers and total views every few days to see what's working">
          <div className="flex flex-wrap gap-2 mb-3">
            <Input type="date" className="!w-40" value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} />
            <Select className="!w-36" value={entry.platform} onChange={e => setEntry({ ...entry, platform: e.target.value })} options={Object.entries(META).map(([k, m]) => ({ value: k, label: m.name }))} />
            <Input type="number" className="!w-32" value={entry.followers} onChange={e => setEntry({ ...entry, followers: e.target.value })} placeholder="Followers" />
            <Input type="number" className="!w-32" value={entry.views} onChange={e => setEntry({ ...entry, views: e.target.value })} placeholder="Total views" />
            <Button variant="primary" disabled={!entry.followers} onClick={() => { saveStats.mutate([...p.stats, { id: newId('st_'), date: entry.date, platform: entry.platform, followers: Number(entry.followers), views: Number(entry.views || 0) }]); setEntry({ ...entry, followers: '', views: '' }); }} icon={<Plus className="size-4" />}>Log</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">{Object.entries(META).map(([k, m]) => <div key={k} className="rounded-xl bg-white/[.03] ring-1 ring-white/[.06] p-3"><div className="text-[11px] text-zinc-400">{m.name}</div><div className="text-lg font-bold text-white">{totalViews[k]?.followers?.toLocaleString() ?? '–'}</div><div className="text-[11px] text-zinc-500">{totalViews[k] ? `${totalViews[k].views.toLocaleString()} views` : 'no data yet'}</div></div>)}</div>
          {p.stats.length > 0 && <ul className="max-h-40 overflow-auto divide-y divide-white/5 text-xs">{[...p.stats].sort((a, b) => b.date.localeCompare(a.date)).map(s => <li key={s.id} className="py-1.5 flex gap-3"><span className="text-zinc-500 w-24">{s.date}</span><span className="w-20">{META[s.platform]?.name}</span><span>{s.followers.toLocaleString()} followers</span><span className="text-zinc-400">{s.views.toLocaleString()} views</span><button className="ml-auto text-zinc-500 hover:text-rose-300" onClick={() => saveStats.mutate(p.stats.filter(x => x.id !== s.id))}><Trash2 className="size-3.5" /></button></li>)}</ul>}
        </Card>
        <HubCard />
      </div>
      <div className="grid xl:grid-cols-2 gap-4 mb-4">
        {Object.keys(META).map(k => <ProfileCard key={k} k={k} prof={p.profiles[k] || { handle: '', displayName: '', bio: '', link: '', checklist: {} }} stats={p.stats} status={status(k)} onSave={v => saveProf.mutate({ k, v })} />)}
      </div>
      <Connections />
    </>
  );
}
