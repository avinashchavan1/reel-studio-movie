import { ReactNode, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

async function sha256(s: string) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

// Light lock for the view-only deployment (same PIN as the Publish Hub).
export function PinGate({ children }: { children: ReactNode }) {
  const [hash, setHash] = useState<string | null | undefined>(undefined);
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem('studio-ok') === '1'; } catch { return false; } });
  const [v, setV] = useState(''); const [bad, setBad] = useState(false);
  useEffect(() => { fetch('/snapshot/pin.json').then(r => r.json()).then(d => setHash(d.pin || null)).catch(() => setHash(null)); }, []);
  if (hash === undefined) return null;
  if (!hash || ok) return <>{children}</>;
  return (
    <div className="grid min-h-screen place-items-center bg-night-950 px-4 py-10 text-parchment">
      <form className="w-full max-w-md rounded-3xl border border-night-700 bg-night-900 p-8 shadow-2xl" onSubmit={async e => { e.preventDefault(); if (await sha256(v) === hash) { try { sessionStorage.setItem('studio-ok', '1'); } catch { /* ignore */ } setOk(true); } else setBad(true); }}>
        <div className="mb-6 flex items-center gap-3"><img src="/favicon.svg" alt="" className="h-10 w-10" /><div><div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Studio</div><div className="font-display text-xl font-extrabold tracking-wider">Strangers to Forever</div></div></div>
        <h1 className="font-display text-2xl font-extrabold">Enter PIN</h1>
        <p className="mt-1 text-sm text-parchment/70">Same PIN as the Publish Hub.</p>
        <input autoFocus type="password" inputMode="numeric" value={v} onChange={e => { setV(e.target.value); setBad(false); }} placeholder="PIN" className="mt-4 w-full rounded-xl border border-night-700 bg-night-950 px-4 py-3 text-base text-parchment outline-none focus:border-gold" />
        {bad && <p className="mt-3 rounded-xl bg-vermilion/15 p-3 text-sm text-red-300">Wrong PIN</p>}
        <button className="mt-4 w-full rounded-lg bg-gold py-3 font-semibold text-night-950 hover:bg-gold-soft"><Lock className="mr-1 inline" size={16} />Unlock</button>
      </form>
    </div>
  );
}
