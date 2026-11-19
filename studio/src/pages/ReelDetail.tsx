import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, Download, ExternalLink, Eye, Lock, ShieldCheck } from 'lucide-react';
import { api, Episode, Project, stripTags, useAct, useAnalysis } from '../api';
import { Badge, Button, card, CopyButton, Empty, Input, muted, PlayButton, Select, Tabs, Textarea } from '../components/ui';
import { fmtDur } from './Dashboard';

const PLATS = [{ id: 'instagram', name: 'Instagram', cut: 'instagram' }, { id: 'youtube', name: 'YouTube', cut: 'youtube' }];

function PlatformCard({ ep, pl, p }: { ep: Episode; pl: typeof PLATS[number]; p: Project }) {
  const pub = ep.publish; const tags = (pub.hashtags || []).map(h => '#' + h).join(' ');
  const cta = pub.cta?.[pl.id] ?? (pl.id === 'youtube' ? `Subscribe 🔔 for Part ${ep.num + 1}` : `Follow ✨ for Part ${ep.num + 1}`);
  const caption = `${pub.caption}\n${cta}\n\n${tags}${pl.id === 'youtube' ? ' #Shorts' : ''}`.trim();
  const [edit, setEdit] = useState(false); const [d, setD] = useState(pub); useEffect(() => setD(pub), [pub]);
  const [link, setLink] = useState('');
  const save = useAct(() => api(`/episodes/${ep.id}`, { method: 'PUT', body: { publish: d } }), { success: 'Saved' });
  const mark = useAct((posted: boolean) => api(`/episodes/${ep.id}/post`, { body: { platform: pl.id, posted, url: link } }), { success: 'Updated' });
  const post = ep.posts?.[pl.id]; const locked = !ep.review?.checked; const cut = ep.renders?.[pl.cut] || ep.render;
  return (
    <section className={card}>
      <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold tracking-wide">{pl.name}</h3>{post ? <Badge tone="posted">posted</Badge> : <Badge>not posted</Badge>}</div>
      {post ? (
        <div className="grid gap-2 text-sm">
          <p>Posted {new Date(post.at).toLocaleString()}</p>
          {post.url && <a href={post.url} target="_blank" className="inline-flex items-center gap-1 font-semibold text-gold-deep underline dark:text-gold">Open post <ExternalLink size={12} /></a>}
          <div><Button size="sm" variant="danger" onClick={() => mark.mutate(false)}>Mark as not posted</Button></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {pl.id === 'youtube' && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">Title & description</span><div className="flex gap-1"><CopyButton text={d.youtubeTitle || ep.title} label="Copy title" /><CopyButton text={caption} label="Copy description" /></div></div>
              {edit ? <Input value={d.youtubeTitle} onChange={e => setD({ ...d, youtubeTitle: e.target.value })} /> : <p className="text-sm">{pub.youtubeTitle || ep.title}</p>}
              <label className="grid gap-1 text-xs font-semibold">Visibility<Select className="!w-40" value={d.youtubePrivacy} onChange={e => setD({ ...d, youtubePrivacy: e.target.value })} options={[{ value: 'public', label: 'Public' }, { value: 'unlisted', label: 'Unlisted' }, { value: 'private', label: 'Private' }]} /></label>
            </div>
          )}
          <div className="grid gap-2">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">Caption</span><div className="flex gap-1"><CopyButton text={caption} label="Copy caption" />{!edit ? <Button size="sm" variant="ghost" onClick={() => setEdit(true)}>Edit</Button> : <><Button size="sm" variant="outline" onClick={() => { setD(pub); setEdit(false); }}>Cancel</Button><Button size="sm" variant="primary" loading={save.isPending} onClick={async () => { await save.mutateAsync(); setEdit(false); }}>Save</Button></>}</div></div>
            {edit ? <Textarea rows={4} value={d.caption} onChange={e => setD({ ...d, caption: e.target.value })} /> : <p className="whitespace-pre-wrap rounded-xl bg-parchment/70 p-3 text-sm dark:bg-night-950/60">{caption}</p>}
          </div>
          {cut && <a href={cut.url} download className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold"><Download size={14} />Download the {pl.name} cut (MP4)</a>}
          <div className="grid gap-2 border-t border-parchment-deep pt-3 dark:border-night-700">
            <Button variant="primary" disabled title="Connect in Settings → Connections">Post now</Button>
            <p className={clsx('text-xs', muted)}>Want one-tap posting? Finish <Link to="/settings" className="font-semibold text-gold-deep underline dark:text-gold">Settings → Connections</Link>. Until then, post from the Publish Hub on your phone.</p>
            <div className="text-sm font-semibold">Post manually</div>
            <div className="flex gap-2"><Input value={link} onChange={e => setLink(e.target.value)} placeholder="Paste post link (optional)" /><Button variant="gold" disabled={locked} loading={mark.isPending} onClick={() => mark.mutate(true)}>{locked ? <><Lock size={14} />Tick the story check first</> : 'Mark posted'}</Button></div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function ReelDetail({ p }: { p: Project }) {
  const { id } = useParams(); const ep = p.episodes.find(e => e.id === id);
  const [tab, setTab] = useState('publish'); const [cut, setCut] = useState('instagram');
  const { data: analysis } = useAnalysis(id);
  const review = useAct((checked: boolean) => api(`/episodes/${id}/review`, { body: { checked } }), { success: 'Saved' });
  if (!ep) return <Empty>Reel not found. <Link to="/reels" className="font-semibold text-gold-deep underline">Back to reels</Link></Empty>;
  const renders = ep.renders || (ep.render ? { instagram: ep.render } : {}); const shown = renders[cut] || Object.values(renders)[0];
  const lines = ep.shots.flatMap((s, si) => s.lines.map(l => ({ ...l, shot: si + 1 })));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Link to="/reels" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold"><ArrowLeft size={14} />Reels</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="font-mono text-xs text-gold-deep dark:text-gold">{ep.code}</div><h1 className="mt-1 font-display text-2xl font-extrabold tracking-wide sm:text-3xl">{ep.title}</h1><p className={clsx('mt-1 max-w-2xl text-sm', muted)}>{ep.synopsis}</p></div>
        <div className="flex items-center gap-2"><span className={clsx('tabular text-sm', muted)}>{fmtDur(ep.render?.duration)}</span><Badge tone={ep.stage}>{ep.stage}</Badge></div>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'publish', label: 'Publish' }, { id: 'story', label: 'Story check' }]} />

      {tab === 'publish' ? (!ep.render ? <Empty>This reel is still being made. Publishing opens once it's rendered.</Empty> : (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <div className="flex gap-1">{Object.keys(renders).map(v => <Button key={v} size="sm" variant={cut === v ? 'primary' : 'outline'} onClick={() => setCut(v)}>{v === 'youtube' ? 'YouTube cut' : 'Instagram cut'}</Button>)}</div>
            {shown && <video key={shown.url} src={shown.url} poster={shown.poster} controls playsInline className="aspect-[9/16] w-full rounded-2xl bg-black" />}
            <section className={card}>
              <h3 className="font-display font-semibold tracking-wider">Cover · thumbnail</h3>
              <p className={clsx('mt-1 text-xs', muted)}>Use it as the Instagram cover and the YouTube thumbnail.</p>
              {ep.render.poster && <div className="mt-3 flex items-center gap-3"><img src={ep.render.poster} className="h-24 rounded-lg" /><div className="grid gap-1"><a href={ep.render.poster} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold"><Eye size={14} />View</a><a href={ep.render.poster} download className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold"><Download size={14} />Download</a></div></div>}
            </section>
          </div>
          <div className="grid content-start gap-4">
            <label className={clsx(card, 'flex cursor-pointer items-start gap-3', ep.review?.checked ? '!border-teal-600/40' : '!border-vermilion/40')}>
              <input type="checkbox" className="mt-1 size-5 accent-[#a8741a]" checked={!!ep.review?.checked} onChange={e => review.mutate(e.target.checked)} />
              <div><div className="font-semibold">{ep.review?.checked ? 'Reviewed ✓' : 'I checked the story'}</div><p className={clsx('text-sm', muted)}>Open the Story check tab, read every line against what really happened (and make sure no real names slipped in), then tick this. Posting stays locked until then.</p></div>
            </label>
            {PLATS.map(pl => <PlatformCard key={pl.id} ep={ep} pl={pl} p={p} />)}
          </div>
        </div>
      )) : (
        <div className="grid gap-4">
          {analysis?.leaks?.length ? <section className="flex items-start gap-3 rounded-xl border border-vermilion/40 bg-vermilion/5 p-4 text-sm text-vermilion"><ShieldCheck size={20} className="shrink-0" />Privacy scan: real names found ({analysis.leaks.join(', ')}). Ask Claude to fix before posting.</section>
            : <section className={clsx(card, 'flex items-start gap-3')}><ShieldCheck className="mt-0.5 shrink-0 text-teal-700 dark:text-teal-300" size={20} /><p className="text-sm">Privacy scan: no real names found. Every name and place below is a series name.</p></section>}
          <section className={card}>
            <h2 className="font-display text-lg font-semibold tracking-wide">Script</h2>
            {!lines.length ? <p className={clsx('mt-2 text-sm', muted)}>No script yet.</p> : (
              <ol className="mt-3 grid gap-3">
                {lines.map(l => { const ch = p.characters.find(c => c.id === l.speaker); return (
                  <li key={l.id} className="grid gap-1 border-l-4 pl-3" style={{ borderColor: ch?.color || '#a8741a' }}>
                    <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-mono text-gold-deep dark:text-gold">Shot {l.shot}</span><span className="font-semibold">{ch?.name || l.speaker}</span><span className={muted}>{l.emotion}</span>{l.audio && <PlayButton src={l.audio.url} label={`${l.audio.duration.toFixed(1)}s`} />}</div>
                    <div className="font-semibold">{l.subtitle || stripTags(l.text)}</div>
                    <div className={clsx('text-sm', muted)}>{stripTags(l.text)}</div>
                  </li>); })}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
