import { useEffect, useRef, useState } from 'react';

// Draws a character with the same engine the renderer uses (served at /engine/engine.js).
let loading: Promise<void> | null = null;
function loadEngine() {
  if ((window as any).hero) return Promise.resolve();
  const add = (src: string) => new Promise<void>((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(); s.onerror = rej; document.head.appendChild(s); });
  loading ||= add('/engine/engine.js').then(() => add('/engine/engine2.js'));
  return loading;
}

export function CharacterPreview({ look, expr = 'happy', size = 160, talking = false }: { look: string | null; expr?: string; size?: number; talking?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null); const [ready, setReady] = useState(false);
  useEffect(() => { loadEngine().then(() => setReady(true)).catch(() => {}); }, []);
  useEffect(() => {
    if (!ready || !look || !ref.current) return;
    const w = window as any; const ctx = ref.current.getContext('2d')!; let raf = 0; const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000; const c = ref.current!; ctx.clearRect(0, 0, c.width, c.height);
      const s = c.height / 720; ctx.save(); ctx.scale(s, s);
      const cast2 = (0, eval)('CAST2'); const map: Record<string, string> = { tara: 'ishita', kabir: 'vihaan', pihu: 'tanvi' };
      const L = cast2[look] || cast2[map[look] || look];
      if (L) w.hero(ctx, c.width / s / 2, 700, 1, L, { t, emo: expr === 'happy' ? 'happy' : expr, talk: talking ? Math.abs(Math.sin(t * 11)) * .8 : 0 });
      ctx.restore(); raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [ready, look, expr, talking]);
  if (!look) return <div style={{ width: size * .8, height: size }} className="grid place-items-center text-4xl">🎙️</div>;
  return <canvas ref={ref} width={size * 1.6} height={size * 2} style={{ width: size * .8, height: size }} />;
}
