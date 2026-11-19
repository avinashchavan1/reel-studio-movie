import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Pause, Play } from 'lucide-react';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' | 'danger'; loading?: boolean; icon?: ReactNode; size?: 'sm' | 'md' };
export function Button({ variant = 'soft', loading, icon, size = 'md', className, children, disabled, ...rest }: BtnProps) {
  return (
    <button {...rest} disabled={disabled || loading}
      className={clsx('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/20 hover:brightness-110',
        variant === 'soft' && 'bg-white/[.06] text-zinc-100 ring-1 ring-white/10 hover:bg-white/[.1]',
        variant === 'ghost' && 'text-zinc-300 hover:bg-white/[.06]',
        variant === 'danger' && 'text-rose-300 hover:bg-rose-500/10', className)}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}{children}
    </button>
  );
}

export function Card({ className, children, title, actions, subtitle }: { className?: string; children?: ReactNode; title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={clsx('rounded-2xl bg-zinc-900/70 ring-1 ring-white/[.07] backdrop-blur', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div><h3 className="font-semibold text-zinc-100">{title}</h3>{subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}</div>
          <div className="flex gap-2 flex-wrap justify-end">{actions}</div>
        </header>
      )}
      <div className={clsx(title || actions ? 'px-5 pb-5' : 'p-5')}>{children}</div>
    </section>
  );
}

export const inputCls = 'w-full rounded-xl bg-zinc-950/60 ring-1 ring-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/60';
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(inputCls, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={clsx(inputCls, 'resize-y', p.className)} />;
export function Select({ options, className, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return <select {...p} className={clsx(inputCls, 'pr-8', className)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return <label className={clsx('block space-y-1.5', className)}><span className="text-xs font-medium text-zinc-400">{label}</span>{children}{hint && <span className="block text-[11px] text-zinc-500">{hint}</span>}</label>;
}

const STATUS: Record<string, string> = {
  draft: 'bg-zinc-500/15 text-zinc-300', voiced: 'bg-sky-500/15 text-sky-300', rendered: 'bg-violet-500/15 text-violet-300',
  scheduled: 'bg-amber-500/15 text-amber-300', published: 'bg-emerald-500/15 text-emerald-300', pending: 'bg-amber-500/15 text-amber-300',
  done: 'bg-emerald-500/15 text-emerald-300', error: 'bg-rose-500/15 text-rose-300', new: 'bg-pink-500/15 text-pink-300', used: 'bg-zinc-500/15 text-zinc-400',
  running: 'bg-sky-500/15 text-sky-300', queued: 'bg-zinc-500/15 text-zinc-300',
};
export const Badge = ({ children, tone }: { children: ReactNode; tone?: string }) =>
  <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS[tone || String(children)] || 'bg-white/10 text-zinc-300')}>{children}</span>;

export const Progress = ({ value, className }: { value: number; className?: string }) =>
  <div className={clsx('h-1.5 rounded-full bg-white/10 overflow-hidden', className)}><div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all" style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} /></div>;

let current: HTMLAudioElement | null = null;
export function PlayButton({ src, label }: { src?: string; label?: string }) {
  const [on, setOn] = useState(false); const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { ref.current?.pause(); }, []);
  if (!src) return null;
  const toggle = () => {
    if (on) { ref.current?.pause(); setOn(false); return; }
    current?.pause(); const a = new Audio(src); ref.current = a; current = a; a.onended = () => setOn(false); a.onpause = () => setOn(false); a.play(); setOn(true);
  };
  return <Button size="sm" variant="soft" onClick={toggle} icon={on ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}>{label}</Button>;
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center text-center py-12 gap-3 text-zinc-400"><div className="text-pink-400">{icon}</div><p className="font-medium text-zinc-200">{title}</p>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>{subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}</div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

// tiny markdown: **bold**, lists, line breaks
export function Markdown({ text }: { text: string }) {
  const html = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
    .split('\n').map(l => /^\s*[-•]\s+/.test(l) ? `<li class="ml-4 list-disc">${l.replace(/^\s*[-•]\s+/, '')}</li>` : /^\s*\d+\.\s+/.test(l) ? `<li class="ml-4 list-decimal">${l.replace(/^\s*\d+\.\s+/, '')}</li>` : l ? `<p>${l}</p>` : '<div class="h-2"></div>').join('');
  return <div className="text-sm text-zinc-300 leading-relaxed space-y-1" dangerouslySetInnerHTML={{ __html: html }} />;
}

// Tabs synced to ?tab= so links can open a specific tab
export function useTab(def: string) {
  const [sp, setSp] = useSearchParams();
  return [sp.get('tab') || def, (t: string) => { const n = new URLSearchParams(sp); n.set('tab', t); setSp(n, { replace: true }); }] as const;
}
export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; icon?: ReactNode; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white/[.03] ring-1 ring-white/[.06] p-1 mb-6 w-fit max-w-full">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={clsx('flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm whitespace-nowrap transition', value === t.id ? 'bg-gradient-to-r from-pink-500/25 to-violet-500/15 text-white ring-1 ring-pink-500/30' : 'text-zinc-400 hover:text-zinc-100')}>
          {t.icon}{t.label}{t.count !== undefined && <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// tiny SVG line chart
export function Sparkline({ points, color = '#ec4899', height = 60 }: { points: number[]; color?: string; height?: number }) {
  if (points.length < 2) return <div className="text-xs text-zinc-500" style={{ height }}>Add at least two entries to see a trend.</div>;
  const max = Math.max(...points), min = Math.min(...points), w = 300;
  const xy = points.map((v, i) => [(i / (points.length - 1)) * w, height - 6 - ((v - min) / Math.max(1, max - min)) * (height - 12)]);
  const d = xy.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={`${d} L${w},${height} L0,${height} Z`} fill={color} opacity=".12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
