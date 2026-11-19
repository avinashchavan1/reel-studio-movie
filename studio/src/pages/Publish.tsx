import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Download, ExternalLink, Send, ShieldAlert, Trash2, MonitorPlay as Youtube, Camera as Instagram } from "lucide-react";
import { api, Episode, Project, useAct, useAnalysis } from '../api';
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from '../components/ui';

const BEST_TIMES = ['Today 7:30 PM', 'Today 1:00 PM', 'Tomorrow 7:30 PM'];
function suggestTime(i: number) { const d = new Date(); if (i === 1) d.setHours(13, 0, 0, 0); else { d.setHours(19, 30, 0, 0); if (i === 2) d.setDate(d.getDate() + 1); } if (d < new Date()) d.setDate(d.getDate() + 1); return d; }
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function Publish({ p }: { p: Project }) {
  const { id } = useParams(); const nav = useNavigate();
  const ep = p.episodes.find(e => e.id === id) || p.episodes.find(e => e.render) || p.episodes[0];
  const { data: integ } = useQuery({ queryKey: ['integrations'], queryFn: () => api<any>('/integrations') });
  const { data: analysis } = useAnalysis(ep?.id);
  const [d, setD] = useState<Episode['publish'] | null>(ep?.publish || null);
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'youtube']); const [when, setWhen] = useState('');
  useEffect(() => { setD(ep?.publish || null); }, [ep?.id]);
  const saveMeta = useAct(() => api(`/episodes/${ep!.id}`, { method: 'PUT', body: { publish: { ...ep!.publish, ...d } } }), { success: 'Saved' });
  const publish = useAct(async (scheduleAt?: string) => { await api(`/episodes/${ep!.id}`, { method: 'PUT', body: { publish: { ...ep!.publish, ...d } } }); return api(`/episodes/${ep!.id}/publish`, { body: { platforms, scheduleAt } }); }, { success: 'Done. See history below' });
  const exportPack = useAct(async () => { const r = await api<{ url: string }>(`/episodes/${ep!.id}/export`, { body: {} }); window.location.href = r.url; return r; }, { invalidate: [] });
  const unschedule = useAct((sid: string) => api(`/episodes/${ep!.id}/schedule/${sid}`, { method: 'DELETE' }));
  if (!ep || !d) return <PageHeader title="Publish" subtitle="Create an episode first." />;
  const status = integ?.status || {};
  const ready = (k: string) => k === 'youtube' ? status.youtube?.connected : k === 'instagram' ? status.instagram?.configured && status.instagram?.publicBaseUrl : true;
  const leaks = analysis?.leaks || [];
  const cta = (k: string) => d.cta?.[k] ?? (k === 'youtube' ? `Subscribe 🔔 for Part ${ep.num + 1}` : `Follow ✨ for Part ${ep.num + 1}`);

  return (
    <>
      <PageHeader title="Publish" subtitle="One click to Instagram and YouTube, or schedule it. Export packs for every other app."
        actions={<Select className="!w-64" value={ep.id} onChange={e => nav(`/publish/${e.target.value}`)} options={p.episodes.map(e => ({ value: e.id, label: `Ep ${e.num} · ${e.title}` }))} />} />
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          <Card title="Caption & metadata" actions={<Button size="sm" onClick={() => saveMeta.mutate()} loading={saveMeta.isPending}>Save</Button>}>
            <div className="space-y-3">
              <Field label="Caption" hint="Hook line + context + a question. The platform CTA is added automatically."><Textarea rows={4} value={d.caption} onChange={e => setD({ ...d, caption: e.target.value })} /></Field>
              <Field label="Hashtags (5–12)" hint={`${d.hashtags.length} tags`}><Input value={d.hashtags.map(h => '#' + h).join(' ')} onChange={e => setD({ ...d, hashtags: e.target.value.split(/[\s,#]+/).filter(Boolean) })} /></Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Instagram CTA"><Input value={cta('instagram')} onChange={e => setD({ ...d, cta: { ...(d.cta || {}), instagram: e.target.value } })} /></Field>
                <Field label="YouTube CTA"><Input value={cta('youtube')} onChange={e => setD({ ...d, cta: { ...(d.cta || {}), youtube: e.target.value } })} /></Field>
                <Field label="YouTube title"><Input value={d.youtubeTitle} onChange={e => setD({ ...d, youtubeTitle: e.target.value })} /></Field>
                <Field label="YouTube visibility"><Select value={d.youtubePrivacy} onChange={e => setD({ ...d, youtubePrivacy: e.target.value })} options={['public', 'unlisted', 'private'].map(v => ({ value: v, label: v }))} /></Field>
              </div>
            </div>
          </Card>
          <Card title="Platforms">
            <div className="grid sm:grid-cols-2 gap-2">
              {Object.entries(p.platforms).map(([k, pl]) => (
                <label key={k} className={`flex items-center gap-3 rounded-xl p-3 ring-1 cursor-pointer transition ${platforms.includes(k) ? 'bg-pink-500/10 ring-pink-500/40' : 'bg-white/[.02] ring-white/[.06]'}`}>
                  <input type="checkbox" className="accent-pink-500" checked={platforms.includes(k)} onChange={() => setPlatforms(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k])} />
                  {k === 'youtube' ? <Youtube className="size-4 text-red-400" /> : k === 'instagram' ? <Instagram className="size-4 text-pink-400" /> : <Send className="size-4 text-zinc-400" />}
                  <span className="text-sm flex-1">{pl.name}</span>
                  {pl.mode === 'api' ? (ready(k) ? <Badge tone="done">connected</Badge> : <Link to="/settings" className="text-[11px] text-amber-300">connect →</Link>) : <Badge>export pack</Badge>}
                </label>
              ))}
            </div>
            {leaks.length > 0 && <div className="mt-3 flex gap-2 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/30 p-2 text-xs text-rose-200"><ShieldAlert className="size-4" />Blocked: real names in this episode ({leaks.join(', ')}).</div>}
            {!ep.render && <p className="mt-3 text-xs text-amber-300">Render the episode first (Episode editor → Render).</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="primary" disabled={!ep.render || !!leaks.length || !platforms.length} loading={publish.isPending && !publish.variables} onClick={() => publish.mutate(undefined)} icon={<Send className="size-4" />}>Publish now</Button>
              <Button disabled={!ep.render} loading={exportPack.isPending} onClick={() => exportPack.mutate()} icon={<Download className="size-4" />}>Download export pack</Button>
            </div>
          </Card>
          <Card title="Schedule" subtitle="Best windows in India: 7–9 PM, 12–2 PM, weekend nights. The studio must be running at that time.">
            <div className="flex flex-wrap gap-2 items-center">
              {BEST_TIMES.map((t, i) => <Button key={t} size="sm" variant="ghost" onClick={() => setWhen(toLocalInput(suggestTime(i)))}>{t}</Button>)}
              <Input type="datetime-local" className="!w-56" value={when} onChange={e => setWhen(e.target.value)} />
              <Button disabled={!when || !ep.render || !!leaks.length} loading={publish.isPending && !!publish.variables} onClick={() => publish.mutate(new Date(when).toISOString())} icon={<CalendarClock className="size-4" />}>Schedule</Button>
            </div>
            {ep.publish.scheduled.length > 0 && <ul className="mt-3 space-y-1 text-sm">{ep.publish.scheduled.map(s => <li key={s.id} className="flex items-center gap-2"><Badge tone="scheduled">{p.platforms[s.platform]?.name}</Badge><span className="text-zinc-300">{new Date(s.at).toLocaleString()}</span><button className="ml-auto text-zinc-500 hover:text-rose-300" onClick={() => unschedule.mutate(s.id)}><Trash2 className="size-3.5" /></button></li>)}</ul>}
          </Card>
          <Card title="History">
            {!ep.publish.history.length ? <p className="text-sm text-zinc-500">Nothing published yet.</p> : (
              <ul className="divide-y divide-white/5 text-sm">{ep.publish.history.map(h => (
                <li key={h.id} className="py-2 flex flex-wrap items-center gap-2"><Badge tone={h.status}>{h.status}</Badge><span>{p.platforms[h.platform]?.name}</span><span className="text-xs text-zinc-500">{new Date(h.at).toLocaleString()}</span>
                  {h.url && <a href={h.url} target="_blank" className="ml-auto text-xs text-pink-300 inline-flex items-center gap-1">{h.export ? 'Download' : 'Open'} <ExternalLink className="size-3" /></a>}
                  {h.error && <span className="w-full text-xs text-rose-300">{h.error}</span>}</li>))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          {Object.entries(ep.renders || (ep.render ? { instagram: ep.render } : {})).map(([v, r]) => (
            <Card key={v} title={`${p.variants[v]?.label || v} cut`} subtitle={`Ends with ${p.variants[v]?.cta || 'FOLLOW'}`}>
              <video src={r.url} poster={r.poster} controls playsInline className="w-full rounded-xl aspect-[9/16] bg-black" />
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
