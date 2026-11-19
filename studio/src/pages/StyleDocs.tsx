import { useEffect, useState } from 'react';
import { BookOpen, Copy, Hash, Palette, Plus, Save, Trash2, Type } from 'lucide-react';
import { toast } from 'sonner';
import { newId, Project, saveDoc, useAct } from '../api';
import { Badge, Button, Card, Input, PageHeader, Tabs, Textarea, useTab } from '../components/ui';
import { CharacterPreview } from '../components/CharacterPreview';
import Knowledge from './Knowledge';

const PALETTE = [
  { name: "Ishita's world", hex: '#ff8fab' }, { name: "Vihaan's world", hex: '#6ea8fe' }, { name: 'Together', hex: '#b69cff' },
  { name: 'Rose accent', hex: '#ff5d8f' }, { name: 'Banner navy', hex: '#0b1a7a' }, { name: 'Banner gold', hex: '#ffc93c' }, { name: 'Ink', hex: '#4a3b52' }, { name: 'Night', hex: '#2a1f5c' },
];
const TAGS = ['[softly]', '[warmly]', '[whispers]', '[sad]', '[cheerful]', '[firmly]', '[laughs]', '[excited]', '[nervous laugh]', '[pause]', '[sighs]', '[amazed]'];

function StyleGuide({ p }: { p: Project }) {
  return (
    <>
      <PageHeader title="Style guide" subtitle="The look and sound of the series: keep every episode consistent." />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title={<span className="flex items-center gap-2"><Palette className="size-4" />Colour palette</span>} subtitle="Pink = Ishita's world · Blue = Vihaan's · Purple = when they're together">
          <div className="grid grid-cols-4 gap-2">{PALETTE.map(c => (
            <button key={c.hex} onClick={() => { navigator.clipboard?.writeText(c.hex); toast.success(`${c.hex} copied`); }} className="text-left">
              <div className="h-14 rounded-xl ring-1 ring-white/10" style={{ background: c.hex }} /><div className="text-[11px] mt-1 text-zinc-300">{c.name}</div><div className="text-[10px] text-zinc-500">{c.hex}</div>
            </button>))}
          </div>
        </Card>
        <Card title={<span className="flex items-center gap-2"><Type className="size-4" />Frame layout (1080×1920)</span>} subtitle="Keep text inside the safe zone; Instagram covers the top and bottom">
          <div className="flex gap-4 items-center">
            <div className="relative w-36 aspect-[9/16] rounded-xl bg-gradient-to-b from-violet-900 to-pink-700 overflow-hidden ring-1 ring-white/20 shrink-0">
              <div className="absolute inset-x-0 top-0 h-[13%] bg-black/50 grid place-items-center text-[9px] text-zinc-300">IG top bar</div>
              <div className="absolute inset-x-0 bottom-0 h-[22%] bg-black/50 grid place-items-center text-[9px] text-zinc-300">caption & buttons</div>
              <div className="absolute right-0 top-[40%] h-[35%] w-[12%] bg-black/40" />
              <div className="absolute left-[8%] right-[14%] top-[15%] bottom-[24%] rounded-md border border-dashed border-emerald-300/70 grid place-items-center text-[9px] text-emerald-200">safe zone</div>
            </div>
            <ul className="text-xs text-zinc-300 space-y-1.5">
              <li>• <b>Banner</b> “Strangers to Forever” at the top of the safe zone</li><li>• <b>Hook text</b> big, centred, on screen from frame 1</li><li>• <b>Characters</b> stand on the ground line (~65% height)</li>
              <li>• <b>Subtitles</b> in a white card above the bottom UI</li><li>• <b>End card</b>: cliffhanger + NEXT + FOLLOW / SUBSCRIBE</li></ul>
          </div>
        </Card>
        <Card title="Character line-up" subtitle="Same engine as the renderer">
          <div className="flex flex-wrap gap-2 justify-center">{p.characters.filter(c => c.look).map(c => <div key={c.id} className="text-center"><CharacterPreview look={c.look} size={110} /><div className="text-xs mt-1" style={{ color: c.color }}>{c.name}</div></div>)}</div>
        </Card>
        <Card title="Voice direction" subtitle="Hinglish: Hindi in Devanagari, English words in English. Add tags for delivery">
          <div className="flex flex-wrap gap-1.5 mb-3">{TAGS.map(t => <Badge key={t}>{t}</Badge>)}</div>
          <ul className="text-xs text-zinc-300 space-y-1">{p.characters.filter(c => c.voice).map(c => <li key={c.id}><span style={{ color: c.color }}>{c.name}</span>: {c.voice!.name}</li>)}</ul>
        </Card>
        <Card className="lg:col-span-2" title="Music moods" subtitle="Pick one per shot; the score is composed section by section">
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-2">{Object.entries(p.moods).map(([k, m]) => <div key={k} className="rounded-xl bg-white/[.03] ring-1 ring-white/[.06] p-3"><div className="text-sm font-medium">♪ {m.label}</div><div className="text-[11px] text-zinc-500 mt-1">{m.styles.join(', ')}</div></div>)}</div>
        </Card>
      </div>
    </>
  );
}

function Templates({ p }: { p: Project }) {
  const [st, setSt] = useState(p.style); useEffect(() => setSt(p.style), [p.style]);
  const save = useAct(() => saveDoc('style', st), { success: 'Templates saved' });
  const changed = JSON.stringify(st) !== JSON.stringify(p.style);
  return (
    <>
      <PageHeader title="Templates" subtitle="Reusable captions and hashtag sets: one tap to insert on the Publish tab."
        actions={<Button variant={changed ? 'primary' : 'soft'} disabled={!changed} loading={save.isPending} onClick={() => save.mutate()} icon={<Save className="size-4" />}>Save</Button>} />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Caption templates" subtitle="Placeholders: {hook} {num} {question} {previous}">
          <div className="space-y-3">
            {st.captionTemplates.map((t, i) => (
              <div key={t.id} className="rounded-xl bg-white/[.03] ring-1 ring-white/[.06] p-3 space-y-2">
                <div className="flex gap-2"><Input value={t.name} onChange={e => setSt({ ...st, captionTemplates: st.captionTemplates.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
                  <Button size="sm" variant="danger" onClick={() => setSt({ ...st, captionTemplates: st.captionTemplates.filter((_, j) => j !== i) })} icon={<Trash2 className="size-3.5" />} /></div>
                <Textarea rows={2} value={t.text} onChange={e => setSt({ ...st, captionTemplates: st.captionTemplates.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} />
              </div>))}
            <Button size="sm" variant="ghost" onClick={() => setSt({ ...st, captionTemplates: [...st.captionTemplates, { id: newId('t'), name: 'New template', text: '{hook} Part {num}' }] })} icon={<Plus className="size-3.5" />}>Add template</Button>
          </div>
        </Card>
        <Card title={<span className="flex items-center gap-2"><Hash className="size-4" />Hashtag sets</span>} subtitle="Mix big + niche; 5–12 per post">
          <div className="space-y-3">
            {st.hashtagSets.map((h, i) => (
              <div key={h.id} className="rounded-xl bg-white/[.03] ring-1 ring-white/[.06] p-3 space-y-2">
                <div className="flex gap-2"><Input value={h.name} onChange={e => setSt({ ...st, hashtagSets: st.hashtagSets.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(h.tags.map(t => '#' + t).join(' ')); toast.success('Copied'); }} icon={<Copy className="size-3.5" />} />
                  <Button size="sm" variant="danger" onClick={() => setSt({ ...st, hashtagSets: st.hashtagSets.filter((_, j) => j !== i) })} icon={<Trash2 className="size-3.5" />} /></div>
                <Input value={h.tags.map(t => '#' + t).join(' ')} onChange={e => setSt({ ...st, hashtagSets: st.hashtagSets.map((x, j) => j === i ? { ...x, tags: e.target.value.split(/[\s,#]+/).filter(Boolean) } : x) })} />
              </div>))}
            <Button size="sm" variant="ghost" onClick={() => setSt({ ...st, hashtagSets: [...st.hashtagSets, { id: newId('h'), name: 'New set', tags: [] }] })} icon={<Plus className="size-3.5" />}>Add set</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

export default function StyleDocs({ p }: { p: Project }) {
  const [tab, setTab] = useTab('playbook');
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'playbook', label: 'Playbook', icon: <BookOpen className="size-4" />, count: p.knowledge.length },
        { id: 'style', label: 'Style guide', icon: <Palette className="size-4" /> },
        { id: 'templates', label: 'Templates', icon: <Hash className="size-4" /> },
      ]} />
      {tab === 'style' ? <StyleGuide p={p} /> : tab === 'templates' ? <Templates p={p} /> : <Knowledge p={p} />}
    </>
  );
}
