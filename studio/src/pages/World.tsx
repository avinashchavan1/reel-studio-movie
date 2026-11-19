import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { api, Project } from '../api';
import { Badge, card, muted, PageHeader, PlayButton } from '../components/ui';
import { CharacterPreview } from '../components/CharacterPreview';

const DELIVERY: Record<string, string> = {
  narrator: 'Warm, soothing storyteller', ishita: 'Soft, gentle, a little shy', vihaan: 'Smooth, charming, playful',
  zoya: 'Bright, loud, loyal', appa: 'Deep, firm, loving underneath', amma: 'Caring, a little anxious', tanvi: 'Chatty, quick',
};
const SCENES: Record<string, string> = { town: 'Small-town street', room: 'Home interior', hostel: 'Hostel room', train: 'Train journey', station: 'Railway platform', city: 'Big city', college: 'College campus', night: 'Night sky' };

export default function World({ p }: { p: Project }) {
  const { data: voices = [] } = useQuery({ queryKey: ['el-voices'], queryFn: () => api<{ id: string; name: string; preview?: string }[]>('/elevenlabs/voices'), retry: false });
  const preview = (id?: string) => voices.find(v => v.id === id)?.preview;
  const major = p.characters.filter(c => c.voice); const minor = p.characters.filter(c => !c.voice);
  const charCard = (c: typeof p.characters[number], cast: boolean) => (
    <div key={c.id} className={clsx(card, 'flex gap-4')}>
      <div className="shrink-0 rounded-xl" style={{ background: `radial-gradient(circle at 50% 70%, ${c.color}33, transparent 70%)` }}><CharacterPreview look={c.look} size={120} /></div>
      <div className="grid min-w-0 content-start gap-1.5">
        <div className="flex flex-wrap items-center gap-2"><span className="font-display text-lg font-semibold tracking-wide">{c.name}</span><span className="h-4 w-4 rounded-full border border-black/10" style={{ background: c.color }} />{cast ? <Badge tone="approved">chosen</Badge> : <Badge>not cast yet</Badge>}</div>
        <p className={clsx('text-sm', muted)}>{c.description}</p>
        {cast ? (
          <dl className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-sm">
            <dt className={muted}>Voice</dt><dd className="font-semibold">{c.voice!.name}</dd>
            <dt className={muted}>Engine</dt><dd>ElevenLabs {c.voice!.model || 'eleven_v3'}</dd>
            <dt className={muted}>Delivery</dt><dd>{DELIVERY[c.id] || '—'}</dd>
          </dl>
        ) : <p className={clsx('text-xs', muted)}>Voice audition happens the first time this character speaks.</p>}
        {cast && preview(c.voice!.id) && <div><PlayButton src={preview(c.voice!.id)} label="Hear voice" /></div>}
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title="Cast & world" />
      <section className="grid gap-3"><h2 className="font-display text-xl font-extrabold tracking-wider">Major characters · you choose the voice</h2><div className="grid gap-3 lg:grid-cols-2">{major.map(c => charCard(c, true))}</div></section>
      <section className="grid gap-3"><h2 className="font-display text-xl font-extrabold tracking-wider">Minor characters · cast by Claude</h2><div className="grid gap-3 lg:grid-cols-2">{minor.map(c => charCard(c, false))}</div></section>
      <section className={card}>
        <h2 className="font-display text-lg font-semibold tracking-wide">Locked colours</h2>
        <p className={clsx('mt-1 text-sm', muted)}>Pink = Ishita's world · Blue = Vihaan's world · Purple = when they're together.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{p.characters.map(c => <div key={c.id} className="flex items-center gap-2"><span className="h-8 w-8 rounded-lg border border-black/10" style={{ background: c.color }} /><div><div className="text-sm font-semibold">{c.name}</div><div className="font-mono text-[11px] text-ink-soft dark:text-parchment/60">{c.color}</div></div></div>)}</div>
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-xl font-extrabold tracking-wider">Locations</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{p.places.map(pl => <div key={pl.id} className={card}><div className="font-semibold">{pl.name}</div><div className="font-mono text-xs text-gold-deep dark:text-gold">{SCENES[pl.scene] || pl.scene}</div><p className={clsx('mt-1 text-sm', muted)}>{pl.description}</p></div>)}</div>
      </section>
    </div>
  );
}
