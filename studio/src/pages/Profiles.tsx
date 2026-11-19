import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Download } from 'lucide-react';
import { Project, saveDoc, useAct } from '../api';
import { Badge, Button, card, CopyButton, Input, muted, PageHeader, Textarea } from '../components/ui';

const KIT = [
  { file: 'avatar_1080.png', name: 'Profile picture', use: 'Instagram + YouTube profile picture (1080×1080)' },
  { file: 'banner_2560x1440.png', name: 'YouTube banner', use: 'YouTube channel banner (2560×1440, safe area centred)' },
  { file: 'watermark_150.png', name: 'YouTube video watermark', use: 'YouTube Studio → Customisation → Branding (150×150)' },
  { file: 'highlight_cover.png', name: 'Story highlight cover', use: 'Instagram highlight “Strangers to Forever” (1080×1920)' },
];

function Row({ label, value, onChange, multiline, max }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; max?: number }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between"><span className="text-sm font-semibold">{label}{max ? <span className={clsx('ml-2 text-xs font-normal', value.length > max ? 'text-vermilion' : muted)}>{value.length}/{max}</span> : null}</span><CopyButton text={value} /></div>
      {multiline ? <Textarea rows={3} value={value} onChange={e => onChange(e.target.value)} /> : <Input value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

export default function Profiles({ p }: { p: Project }) {
  const [prof, setProf] = useState(p.profiles); useEffect(() => setProf(p.profiles), [p.profiles]);
  const [brand, setBrand] = useState(p.brand); useEffect(() => setBrand(p.brand), [p.brand]);
  const save = useAct(async () => { await saveDoc('profiles', prof); await saveDoc('brand', brand); }, { success: 'Profiles saved' });
  const ig = prof.instagram || { handle: '', displayName: '', bio: '', link: '', checklist: {} };
  const yt = prof.youtube || { handle: '', displayName: '', bio: '', link: '', checklist: {} };
  const changed = JSON.stringify(prof) !== JSON.stringify(p.profiles) || JSON.stringify(brand) !== JSON.stringify(p.brand);
  const brandUrl = (f: string) => `/media/brand/${f}`;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title="Profiles" actions={<Button variant="primary" disabled={!changed} loading={save.isPending} onClick={() => save.mutate()}>Save</Button>} />
      <section className={card}>
        <h2 className="font-display text-lg font-semibold tracking-wide">Brand kit</h2>
        <p className={clsx('mt-1 text-sm', muted)}>Ready-made images for your profiles. Download and upload them in each app.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KIT.map(k => (
            <div key={k.file} className="grid content-start gap-2">
              <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-parchment-deep bg-parchment dark:border-night-700 dark:bg-night-950">
                <img src={brandUrl(k.file)} alt={k.name} className="max-h-full max-w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'block'; }} />
                <span className="hidden"><Badge tone="review">New art needed</Badge></span>
              </div>
              <div className="text-sm font-semibold">{k.name}</div><div className={clsx('text-xs', muted)}>{k.use}</div>
              <a href={brandUrl(k.file)} download className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep dark:text-gold"><Download size={14} />{k.file}</a>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-lg font-semibold tracking-wide">Instagram</h2>
          <p className={clsx('mt-1 text-sm', muted)}>Instagram app → Profile → <b>Edit profile</b>. Profile picture: <b>Edit picture</b> → choose <span className="font-mono">avatar_1080.png</span> from the brand kit above.</p>
          <div className="mt-4 grid gap-3">
            <Row label="Username" value={ig.handle} onChange={v => setProf({ ...prof, instagram: { ...ig, handle: v.replace('@', '') } })} />
            <Row label="Name (searchable)" value={ig.displayName} onChange={v => setProf({ ...prof, instagram: { ...ig, displayName: v } })} />
            <Row label="Bio" value={ig.bio} multiline max={150} onChange={v => setProf({ ...prof, instagram: { ...ig, bio: v } })} />
            <Row label="Category" value={brand.category} onChange={v => setBrand({ ...brand, category: v })} />
            <Row label="Link in bio" value={ig.link} onChange={v => setProf({ ...prof, instagram: { ...ig, link: v } })} />
          </div>
        </section>
        <section className={card}>
          <h2 className="font-display text-lg font-semibold tracking-wide">YouTube</h2>
          <p className={clsx('mt-1 text-sm', muted)}>YouTube Studio → <b>Customisation</b>. Upload the banner and watermark from the brand kit.</p>
          <div className="mt-4 grid gap-3">
            <Row label="Handle" value={yt.handle} onChange={v => setProf({ ...prof, youtube: { ...yt, handle: v.replace('@', '') } })} />
            <Row label="Channel name" value={yt.displayName} onChange={v => setProf({ ...prof, youtube: { ...yt, displayName: v } })} />
            <Row label="Description" value={yt.bio} multiline max={1000} onChange={v => setProf({ ...prof, youtube: { ...yt, bio: v } })} />
            <Row label="Keywords" value={brand.keywords.join(', ')} onChange={v => setBrand({ ...brand, keywords: v.split(',').map(x => x.trim()).filter(Boolean) })} />
            <Row label="Series playlist" value={brand.playlist} onChange={v => setBrand({ ...brand, playlist: v })} />
          </div>
          <div className="mt-4 grid gap-2 border-t border-parchment-deep pt-3 dark:border-night-700">
            <Button variant="primary" disabled>Apply brand to YouTube</Button>
            <p className={clsx('text-xs', muted)}>Connect YouTube first in <Link to="/settings" className="font-semibold text-gold-deep underline dark:text-gold">Settings → Connections</Link>.</p>
            <p className={clsx('text-xs', muted)}>Still done by hand in YouTube Studio (the API can't): profile picture, banner, watermark, channel trailer.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
