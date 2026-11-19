import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Clock, Copy, Download, Lock, Share2 } from 'lucide-react';

type Cut = { url: string; poster: string; duration: number };
type Ep = { num: number; title: string; synopsis: string; duration: number; poster: string; cuts: Record<string, Cut>; captions: Record<string, string>; hashtags: string[]; youtubeTitle: string };
type Manifest = { series: { title: string; tagline: string }; builtAt: string; pin: string | null; bestTimes: string[]; platforms: Record<string, { name: string; cut: string; steps: string[] }>; episodes: Ep[] };

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
async function sha256(s: string) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function copy(text: string) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }

function Gate({ pin, onOk }: { pin: string; onOk: () => void }) {
  const [v, setV] = useState(''); const [bad, setBad] = useState(false);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form className="w-full max-w-xs space-y-4 text-center" onSubmit={async e => { e.preventDefault(); if (await sha256(v) === pin) { try { sessionStorage.setItem('hub-ok', '1'); } catch { /* ignore */ } onOk(); } else setBad(true); }}>
        <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 grid place-items-center"><Lock className="size-6" /></div>
        <h1 className="text-xl font-bold">Publish Hub</h1>
        <input autoFocus type="password" inputMode="numeric" value={v} onChange={e => { setV(e.target.value); setBad(false); }} placeholder="PIN"
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-pink-500" />
        {bad && <p className="text-sm text-rose-300">Wrong PIN</p>}
        <button className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 py-3 font-semibold">Unlock</button>
      </form>
    </div>
  );
}

function EpisodeView({ ep, m, onBack }: { ep: Ep; m: Manifest; onBack: () => void }) {
  const [platform, setPlatform] = useState('instagram');
  const pl = m.platforms[platform]; const cut = ep.cuts[pl.cut] || Object.values(ep.cuts)[0];
  const caption = ep.captions[platform] || ep.captions.instagram;
  const [file, setFile] = useState<File | null>(null); const [flash, setFlash] = useState('');
  const postedKey = `posted-${ep.num}-${platform}`; const [posted, setPosted] = useState(store.get(postedKey) === '1');
  useEffect(() => setPosted(store.get(postedKey) === '1'), [postedKey]);
  // pre-load the video so the share sheet opens instantly on tap (phones require it)
  useEffect(() => {
    let alive = true; setFile(null);
    fetch(cut.url).then(r => r.blob()).then(b => { if (alive) setFile(new File([b], `ep${ep.num}-${pl.cut}.mp4`, { type: 'video/mp4' })); }).catch(() => {});
    return () => { alive = false; };
  }, [cut.url]);
  const note = (s: string) => { setFlash(s); setTimeout(() => setFlash(''), 2200); };
  const canShare = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const share = async () => {
    await copy(caption);
    if (canShare) { try { await navigator.share({ files: [file!], text: caption }); note('Caption copied. Paste it in the app'); } catch { /* cancelled */ } }
    else { const a = document.createElement('a'); a.href = cut.url; a.download = `ep${ep.num}-${pl.cut}.mp4`; a.click(); note('Video downloading, caption copied'); }
  };
  const markPosted = () => { const v = !posted; setPosted(v); store.set(postedKey, v ? '1' : '0'); };

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-400 mb-3"><ArrowLeft className="size-4" />All episodes</button>
      <div className="flex items-baseline gap-2"><span className="text-pink-400 font-semibold">Ep {ep.num}</span><h1 className="text-2xl font-bold">{ep.title}</h1></div>
      <p className="text-sm text-zinc-400 mt-1">{ep.synopsis}</p>
      <div className="flex gap-1.5 overflow-x-auto mt-4 pb-1 -mx-4 px-4">
        {Object.entries(m.platforms).map(([k, p]) => (
          <button key={k} onClick={() => setPlatform(k)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${platform === k ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-300'}`}>
            {p.name}{store.get(`posted-${ep.num}-${k}`) === '1' && ' ✓'}
          </button>
        ))}
      </div>
      <video key={cut.url} src={cut.url} poster={cut.poster} controls playsInline className="mt-4 w-full rounded-2xl aspect-[9/16] bg-black shadow-2xl shadow-pink-500/10" />
      <div className="mt-4 rounded-2xl bg-white/[.06] ring-1 ring-white/10 p-4">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Caption</span>
          <button className="text-xs text-pink-300 flex items-center gap-1" onClick={async () => note((await copy(caption)) ? 'Caption copied' : 'Copy failed')}><Copy className="size-3.5" />Copy</button></div>
        <p className="text-sm whitespace-pre-wrap text-zinc-200">{caption}</p>
        {platform === 'youtube' && <div className="mt-3 pt-3 border-t border-white/10"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Title</span><button className="text-xs text-pink-300 flex items-center gap-1" onClick={async () => { await copy(ep.youtubeTitle); note('Title copied'); }}><Copy className="size-3.5" />Copy</button></div><p className="text-sm mt-1">{ep.youtubeTitle}</p></div>}
      </div>
      <div className="mt-4 rounded-2xl bg-white/[.04] ring-1 ring-white/10 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">How to post</span>
        <ol className="mt-2 space-y-1.5 text-sm text-zinc-300 list-decimal ml-4">{pl.steps.map(s => <li key={s}>{s}</li>)}</ol>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400"><Clock className="size-3.5" />Best time: {m.bestTimes.join(' · ')}</p>
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#0b0b12] via-[#0b0b12]/95 to-transparent pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] px-4">
        <div className="mx-auto max-w-md flex gap-2">
          <button onClick={share} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 py-3.5 font-semibold shadow-lg shadow-pink-500/30 active:scale-[.98]">
            {canShare ? <Share2 className="size-5" /> : <Download className="size-5" />}{canShare ? `Share to ${pl.name}` : file ? 'Download + copy caption' : 'Preparing video…'}
          </button>
          <button onClick={markPosted} title="Mark as posted" className={`rounded-2xl px-4 ${posted ? 'bg-emerald-500 text-white' : 'bg-white/10 text-zinc-300'}`}>{posted ? <CheckCircle2 className="size-5" /> : <Check className="size-5" />}</button>
        </div>
        {flash && <div className="mx-auto max-w-md mt-2 text-center text-sm text-emerald-300">{flash}</div>}
      </div>
    </div>
  );
}

export default function Hub() {
  const [m, setM] = useState<Manifest | null>(null); const [err, setErr] = useState('');
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem('hub-ok') === '1'; } catch { return false; } });
  const [open, setOpen] = useState<number | null>(() => Number(new URLSearchParams(location.search).get('ep')) || null);
  useEffect(() => { fetch('/episodes.json', { cache: 'no-store' }).then(r => r.json()).then(setM).catch(() => setErr('Could not load episodes.')); }, []);
  useEffect(() => { const u = new URL(location.href); open ? u.searchParams.set('ep', String(open)) : u.searchParams.delete('ep'); history.replaceState(null, '', u); }, [open]);
  const ep = useMemo(() => m?.episodes.find(e => e.num === open), [m, open]);
  if (err) return <p className="p-6 text-rose-300">{err}</p>;
  if (!m) return <p className="p-6 text-zinc-400">Loading…</p>;
  if (m.pin && !ok) return <Gate pin={m.pin} onOk={() => setOk(true)} />;
  if (ep) return <EpisodeView ep={ep} m={m} onBack={() => setOpen(null)} />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6"><p className="text-xs uppercase tracking-widest text-pink-400 font-semibold">Publish Hub</p><h1 className="text-3xl font-bold mt-1">{m.series.title}</h1><p className="text-zinc-400 text-sm">{m.series.tagline}</p></header>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {m.episodes.map(e => {
          const done = Object.keys(m.platforms).filter(k => store.get(`posted-${e.num}-${k}`) === '1').length;
          return (
            <button key={e.num} onClick={() => setOpen(e.num)} className="text-left rounded-2xl overflow-hidden bg-white/[.05] ring-1 ring-white/10 active:scale-[.98] transition">
              <img src={e.poster} alt="" className="w-full aspect-[9/14] object-cover" />
              <div className="p-3"><div className="text-xs text-pink-300 font-semibold">Ep {e.num} · {Math.round(e.duration)}s</div><div className="font-semibold truncate">{e.title}</div>
                <div className="text-[11px] text-zinc-400 mt-1">{done ? `Posted on ${done}/${Object.keys(m.platforms).length}` : 'Ready to post'}</div></div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-[11px] text-zinc-500 mt-8">Updated {new Date(m.builtAt).toLocaleString()}</p>
    </div>
  );
}
