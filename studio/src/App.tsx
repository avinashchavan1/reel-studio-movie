import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import clsx from 'clsx';
import { BookOpen, Clapperboard, Home, ListTodo, Menu, Moon, Settings as SettingsIcon, Sun, UserCircle2, Users, X } from 'lucide-react';
import { STATIC, useCredits, useJobs, useProject } from './api';
import { PinGate } from './components/PinGate';
import Dashboard from './pages/Dashboard';
import Reels from './pages/Reels';
import ReelDetail from './pages/ReelDetail';
import Plan from './pages/Plan';
import World from './pages/World';
import Profiles from './pages/Profiles';
import Docs from './pages/Docs';
import Settings from './pages/Settings';
import { About, Privacy, Terms } from './pages/Legal';

const NAV = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/reels', label: 'Reels', icon: Clapperboard },
  { to: '/plan', label: 'Plan', icon: ListTodo },
  { to: '/world', label: 'Cast & world', icon: Users },
  { to: '/profiles', label: 'Profiles', icon: UserCircle2 },
  { to: '/docs', label: 'Style & docs', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const Logo = () => (
  <Link to="/" className="flex items-center gap-3 no-underline">
    <img src="/favicon.svg" alt="" className="h-9 w-9" />
    <div className="leading-tight">
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Studio</div>
      <div className="font-display text-lg font-extrabold tracking-wider text-parchment">Strangers to Forever</div>
    </div>
  </Link>
);

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* ignore */ } }, [dark]);
  return [dark, () => setDark(d => !d)] as const;
}

export function CreditsLine() {
  const { data } = useCredits();
  if (!data) return null;
  return <div className="text-xs text-parchment/60">ElevenLabs: <span className="tabular font-semibold text-parchment">{data.remaining.toLocaleString()}</span> / {data.limit.toLocaleString()} credits left</div>;
}

function JobWatcher() {
  const { data: jobs } = useJobs(); const qc = useQueryClient(); const seen = useRef<Record<string, string>>({});
  useEffect(() => {
    for (const j of jobs || []) {
      const prev = seen.current[j.id];
      if (prev && prev !== j.status && (j.status === 'done' || j.status === 'error')) {
        j.status === 'done' ? toast.success(`${j.label} finished`) : toast.error(`${j.label} failed: ${j.error}`);
        ['project', 'credits'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      }
      seen.current[j.id] = j.status;
    }
  }, [jobs, qc]);
  const running = (jobs || []).filter(j => j.status === 'running' || j.status === 'queued');
  return running.length ? <div className="grid gap-1 text-xs text-parchment/70">{running.map(j => <div key={j.id}>⏳ {j.label} · {Math.round(j.progress * 100)}%</div>)}</div> : null;
}

function Footer({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <div className="grid gap-3 border-t border-night-800 pt-4">
      <JobWatcher />
      <CreditsLine />
      <button onClick={toggle} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-parchment/80 hover:bg-night-800 hover:text-parchment">{dark ? <Sun size={16} /> : <Moon size={16} />}{dark ? 'Light mode' : 'Dark mode'}</button>
      <div className="flex gap-3 text-[11px] text-parchment/50"><Link to="/about" className="hover:text-gold">About</Link><Link to="/privacy" className="hover:text-gold">Privacy</Link><Link to="/terms" className="hover:text-gold">Terms</Link></div>
    </div>
  );
}

function Shell() {
  const { data: project, error } = useProject(); const [open, setOpen] = useState(false); const loc = useLocation(); const [dark, toggle] = useTheme();
  useEffect(() => setOpen(false), [loc.pathname]);
  const nav = (
    <nav className="grid gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition', isActive ? 'bg-gold text-night-950' : 'text-parchment/80 hover:bg-night-800 hover:text-parchment')}>
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-night-950 p-5 text-parchment lg:flex">
        <div className="grid gap-8"><Logo />{nav}</div>
        <Footer dark={dark} toggle={toggle} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-night-950 px-4 py-3 text-parchment lg:hidden" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          <Logo /><button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-night-800"><Menu /></button>
        </header>
        {open && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
            <div className="flex h-full w-72 flex-col justify-between bg-night-950 p-5 text-parchment" onClick={e => e.stopPropagation()}>
              <div><div className="mb-6 flex items-center justify-between"><Logo /><button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-night-800"><X /></button></div>{nav}</div>
              <Footer dark={dark} toggle={toggle} />
            </div>
          </div>
        )}
        {STATIC && <div className="border-b border-gold/30 bg-gold-soft/60 px-4 py-2 text-center text-xs text-gold-deep dark:bg-gold/10 dark:text-gold">Online copy · story, voices and rendering happen with Claude</div>}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          {error ? <div className="rounded-xl border border-vermilion/40 bg-vermilion/5 p-4 text-sm text-vermilion">Can't reach the studio: {(error as Error).message}</div>
            : !project ? <div className="py-8 text-sm text-ink-soft dark:text-parchment/60">Loading the studio…</div> : (
              <Routes>
                <Route path="/" element={<Dashboard p={project} />} />
                <Route path="/reels" element={<Reels p={project} />} />
                <Route path="/reels/:id" element={<ReelDetail p={project} />} />
                <Route path="/plan" element={<Plan p={project} />} />
                <Route path="/world" element={<World p={project} />} />
                <Route path="/profiles" element={<Profiles p={project} />} />
                <Route path="/docs" element={<Docs p={project} />} />
                <Route path="/docs/:slug" element={<Docs p={project} />} />
                <Route path="/settings" element={<Settings p={project} />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  if (STATIC) return <PinGate><Shell /></PinGate>;
  return <Shell />;
}
