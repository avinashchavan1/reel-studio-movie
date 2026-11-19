import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, Copy, Loader2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

// ---- design tokens (matched to Untold Granth Studio) ----
export const card = 'rounded-2xl border border-parchment-deep bg-white/80 p-5 shadow-sm dark:border-night-700 dark:bg-night-900';
export const inputCls = 'w-full rounded-xl border border-parchment-deep bg-white/80 px-3 py-2 font-normal text-ink outline-none focus:border-gold-deep dark:border-night-700 dark:bg-night-950 dark:text-parchment dark:focus:border-gold';
export const muted = 'text-ink-soft dark:text-parchment/60';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger'; loading?: boolean; icon?: ReactNode; size?: 'sm' | 'md' };
export function Button({ variant = 'outline', loading, icon, size = 'md', className, children, disabled, ...rest }: BtnProps) {
  return (
    <button {...rest} disabled={disabled || loading}
      className={clsx('inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-night-800 text-parchment hover:bg-night-700 dark:bg-gold dark:text-night-950 dark:hover:bg-gold-soft',
        variant === 'gold' && 'bg-gold text-night-950 hover:bg-gold-soft',
        variant === 'outline' && 'border border-parchment-deep bg-white/60 text-ink hover:border-gold-deep dark:border-night-700 dark:bg-night-900 dark:text-parchment dark:hover:border-gold',
        variant === 'ghost' && 'text-gold-deep hover:underline dark:text-gold',
        variant === 'danger' && 'text-vermilion hover:bg-vermilion/10', className)}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}{children}
    </button>
  );
}

export function Card({ className, children, title, subtitle, actions }: { className?: string; children?: ReactNode; title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={clsx(card, className)}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-display text-lg font-semibold tracking-wide">{title}</h2>{subtitle && <p className={clsx('mt-0.5 text-sm', muted)}>{subtitle}</p>}</div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(inputCls, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={clsx(inputCls, 'resize-y', p.className)} />;
export function Select({ options, className, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return <select {...p} className={clsx(inputCls, className)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return <label className={clsx('grid gap-1 text-sm font-semibold', className)}>{label}{children}{hint && <span className={clsx('block text-xs font-normal', muted)}>{hint}</span>}</label>;
}

// stage colours
const TONE: Record<string, string> = {
  idea: 'bg-parchment-deep text-ink-soft dark:bg-night-800 dark:text-parchment/70',
  scripted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  voiced: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  rendered: 'bg-gold-soft text-gold-deep dark:bg-gold/15 dark:text-gold',
  review: 'bg-vermilion/10 text-vermilion dark:bg-vermilion/20',
  approved: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  posted: 'bg-night-800 text-parchment dark:bg-gold dark:text-night-950',
};
export const Badge = ({ children, tone }: { children: ReactNode; tone?: string }) =>
  <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider', TONE[tone || String(children)] || 'bg-parchment-deep text-ink-soft dark:bg-night-800 dark:text-parchment/70')}>{children}</span>;
export const Mono = ({ children }: { children: ReactNode }) =>
  <span className="rounded border border-gold-deep/60 px-1.5 py-px font-mono text-xs text-gold-deep dark:border-gold/50 dark:text-gold">{children}</span>;

export function PageHeader({ eyebrow, title, actions, subtitle }: { eyebrow?: string; title: string; actions?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep sm:text-xs sm:tracking-[0.25em] dark:text-gold">{eyebrow}</div>}
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-wide sm:text-4xl">{title}</h1>
        {subtitle && <p className={clsx('mt-1 text-sm', muted)}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-parchment-deep p-8 text-center text-sm text-ink-soft dark:border-night-700 dark:text-parchment/60">{children}</div>;
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return <Button size="sm" variant="outline" icon={done ? <Check size={13} /> : <Copy size={13} />} onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); toast.success('Copied'); setTimeout(() => setDone(false), 1500); } catch { toast.error('Copy failed'); } }}>{label}</Button>;
}

let current: HTMLAudioElement | null = null;
export function PlayButton({ src, label }: { src?: string; label?: string }) {
  const [on, setOn] = useState(false); const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { ref.current?.pause(); }, []);
  if (!src) return null;
  const toggle = () => { if (on) { ref.current?.pause(); setOn(false); return; } current?.pause(); const a = new Audio(src); ref.current = a; current = a; a.onended = () => setOn(false); a.onpause = () => setOn(false); a.play(); setOn(true); };
  return <Button size="sm" variant="outline" onClick={toggle} icon={on ? <Pause size={13} /> : <Play size={13} />}>{label}</Button>;
}

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-parchment-deep dark:border-night-700">
      {tabs.map(t => <button key={t.id} onClick={() => onChange(t.id)} className={clsx('-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition', value === t.id ? 'border-gold-deep text-ink dark:border-gold dark:text-parchment' : 'border-transparent text-ink-soft hover:text-ink dark:text-parchment/60 dark:hover:text-parchment')}>{t.label}</button>)}
    </div>
  );
}

// tiny markdown: **bold**, lists, line breaks
export function Markdown({ text }: { text: string }) {
  const html = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n').map(l => /^\s*[-•]\s+/.test(l) ? `<li class="ml-5 list-disc">${l.replace(/^\s*[-•]\s+/, '')}</li>` : /^\s*\d+\.\s+/.test(l) ? `<li class="ml-5 list-decimal">${l.replace(/^\s*\d+\.\s+/, '')}</li>` : l ? `<p>${l}</p>` : '<div class="h-2"></div>').join('');
  return <div className="space-y-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
}
