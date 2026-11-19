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
    <div className="min-h-screen grid place-items-center p-6">
      <form className="w-full max-w-xs space-y-4 text-center" onSubmit={async e => { e.preventDefault(); if (await sha256(v) === hash) { try { sessionStorage.setItem('studio-ok', '1'); } catch { /* ignore */ } setOk(true); } else setBad(true); }}>
        <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 grid place-items-center"><Lock className="size-6 text-white" /></div>
        <h1 className="text-xl font-bold text-white">Reel Studio</h1>
        <input autoFocus type="password" inputMode="numeric" value={v} onChange={e => { setV(e.target.value); setBad(false); }} placeholder="PIN" className="w-full rounded-xl bg-white/10 px-4 py-3 text-center text-lg tracking-widest text-white outline-none focus:ring-2 focus:ring-pink-500" />
        {bad && <p className="text-sm text-rose-300">Wrong PIN</p>}
        <button className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 py-3 font-semibold text-white">Unlock</button>
      </form>
    </div>
  );
}
