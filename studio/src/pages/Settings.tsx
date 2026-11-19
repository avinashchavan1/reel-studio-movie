import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { api, Project, saveDoc, useAct } from '../api';
import { Badge, Button, card, Field, Input, muted, PageHeader } from '../components/ui';

export default function Settings({ p }: { p: Project }) {
  const qc = useQueryClient();
  const [b, setB] = useState(p.brand); useEffect(() => setB(p.brand), [p.brand]);
  const saveBrand = useAct(() => saveDoc('brand', b), { success: 'Brand saved' });
  const { data: integ } = useQuery({ queryKey: ['integrations'], queryFn: () => api<any>('/integrations') });
  const { data: hub } = useQuery({ queryKey: ['hub'], queryFn: () => api<{ url: string | null; pin: boolean }>('/hub') });
  const [yt, setYt] = useState({ clientId: '', clientSecret: '' }); const [ig, setIg] = useState({ igUserId: '', accessToken: '', publicBaseUrl: '' });
  useEffect(() => { if (integ) { setYt({ clientId: '', clientSecret: '', ...integ.settings.youtube }); setIg({ igUserId: '', accessToken: '', publicBaseUrl: '', ...integ.settings.instagram }); } }, [integ]);
  const saveConn = useAct(() => api('/integrations', { method: 'PUT', body: { youtube: yt, instagram: ig } }).then(() => qc.invalidateQueries({ queryKey: ['integrations'] })), { success: 'Saved', invalidate: [] });
  const st = integ?.status || {};
  const handles = Object.entries(p.profiles || {}).filter(([, v]) => v.handle);
  const redirect = `${location.origin.replace(':5173', ':5174')}/api/auth/youtube/callback`;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold tracking-wide">Brand</h2><Button size="sm" variant="primary" disabled={JSON.stringify(b) === JSON.stringify(p.brand)} loading={saveBrand.isPending} onClick={() => saveBrand.mutate()}>Save</Button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Channel"><Input value={b.channel} onChange={e => setB({ ...b, channel: e.target.value })} /></Field>
            <Field label="Series"><Input value={b.series} onChange={e => setB({ ...b, series: e.target.value })} /></Field>
            <Field label="Edition"><Input value={b.edition} onChange={e => setB({ ...b, edition: e.target.value })} /></Field>
            <Field label="Tagline"><Input value={b.tagline} onChange={e => setB({ ...b, tagline: e.target.value })} /></Field>
            <Field label="CTA" className="sm:col-span-2"><Input value={b.cta} onChange={e => setB({ ...b, cta: e.target.value })} /></Field>
            <Field label="Palette" className="sm:col-span-2"><div className="flex flex-wrap items-center gap-2">{b.palette.map((c, i) => <input key={i} type="color" value={c} onChange={e => setB({ ...b, palette: b.palette.map((x, j) => j === i ? e.target.value : x) })} className="h-9 w-12 cursor-pointer rounded-lg border border-parchment-deep bg-transparent dark:border-night-700" />)}</div></Field>
            <Field label="Loudness"><Input value={b.loudness} onChange={e => setB({ ...b, loudness: e.target.value })} /></Field>
            <Field label="Channels"><div className={clsx('flex min-h-10 flex-wrap items-center gap-2 font-mono text-xs', muted)}>{handles.length ? handles.map(([k, v]) => <span key={k}>{k} @{v.handle}</span>) : 'Set handles on the Profiles page'}</div></Field>
          </div>
        </section>
        <div className="grid content-start gap-6">
          <section className={card}>
            <h2 className="font-display text-lg font-semibold tracking-wide">Access</h2>
            <p className={clsx('mt-1 text-sm', muted)}>The online studio and the Publish Hub are locked with a PIN{hub?.pin ? ' (set)' : ''}. Only people you give the PIN to can see anything.</p>
            {hub?.url && <p className="mt-2 text-sm">Publish Hub: <a href={hub.url} target="_blank" className="font-semibold text-gold-deep underline dark:text-gold">{hub.url.replace('https://', '')}</a></p>}
            <p className={clsx('mt-2 text-xs', muted)}>To change the PIN, ask Claude.</p>
          </section>
          <section className={card}>
            <h2 className="font-display text-lg font-semibold tracking-wide">How data gets here</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>You send Claude the story. Claude writes the script, casts the voices, animates and renders each reel in the studio engine (in the GitHub repo), then syncs it here: script, captions, cover and both cuts.</li>
              <li>Real names never leave Claude's machine. Everything here uses the series names.</li>
              <li>You check the story, post on each platform (or from the Publish Hub), and mark it posted. Everything is logged in Recent activity.</li>
            </ol>
          </section>
        </div>
      </div>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold tracking-wide">Posting connections</h2>
        <p className={clsx('mt-1 text-sm', muted)}>Optional. Without these you post manually from the Publish Hub and tap “Mark posted”.</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <div className="grid content-start gap-3">
            <div className="flex items-center gap-2"><h3 className="font-display font-semibold tracking-wider">YouTube</h3>{st.youtube?.connected ? <Badge tone="approved">connected</Badge> : <Badge>not connected</Badge>}</div>
            <p className="text-sm">One-time Google setup (about 10 minutes):</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>Google Cloud → new project <span className="font-mono">strangers-to-forever</span></li>
              <li>Enable <b>YouTube Data API v3</b></li>
              <li>Google Auth Platform → app name “Strangers to Forever Studio”, <b>External</b> → Audience → Publish app</li>
              <li>Clients → Create client → <b>Web application</b>, redirect URI <span className="break-all font-mono text-xs">{redirect}</span></li>
              <li>Paste the Client ID and Client secret below, then press <b>Connect YouTube</b>.</li>
            </ol>
            <Field label="Client ID"><Input value={yt.clientId} onChange={e => setYt({ ...yt, clientId: e.target.value })} /></Field>
            <Field label="Client secret"><Input type="password" value={yt.clientSecret} onChange={e => setYt({ ...yt, clientSecret: e.target.value })} /></Field>
            <div className="flex gap-2"><Button onClick={() => saveConn.mutate()}>Save</Button><Button variant="primary" disabled={!st.youtube?.configured} onClick={() => window.open('/api/auth/youtube/start', '_blank')}>Connect YouTube</Button></div>
            <p className={clsx('text-xs', muted)}>Until Google audits the app, YouTube keeps API uploads <b>private</b>.</p>
          </div>
          <div className="grid content-start gap-3">
            <div className="flex items-center gap-2"><h3 className="font-display font-semibold tracking-wider">Instagram</h3>{st.instagram?.configured ? <Badge tone="approved">configured</Badge> : <Badge>not set up</Badge>}</div>
            <p className="text-sm">One-time Meta setup (Instagram must be a professional/Creator account):</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>Meta for Developers → My Apps → create an app with <b>Instagram API</b></li>
              <li>Add your Instagram account and generate a long-lived token with <span className="font-mono text-xs">instagram_business_content_publish</span></li>
              <li>Instagram fetches the video from a public link, so the studio's public address is needed too.</li>
            </ol>
            <Field label="Instagram user ID"><Input value={ig.igUserId} onChange={e => setIg({ ...ig, igUserId: e.target.value })} /></Field>
            <Field label="Access token"><Input type="password" value={ig.accessToken} onChange={e => setIg({ ...ig, accessToken: e.target.value })} /></Field>
            <Field label="Public base URL"><Input value={ig.publicBaseUrl} onChange={e => setIg({ ...ig, publicBaseUrl: e.target.value })} /></Field>
            <div><Button onClick={() => saveConn.mutate()}>Save</Button></div>
          </div>
        </div>
      </section>
    </div>
  );
}
