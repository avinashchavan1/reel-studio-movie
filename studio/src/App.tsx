import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import clsx from 'clsx';
import { AtSign, BookOpen, CalendarRange, Clapperboard, Film, LayoutDashboard, Menu, Settings as SettingsIcon, Sparkles, Users, X } from 'lucide-react';
import { useCredits, useJobs, useProject } from './api';
import { Progress } from './components/ui';
import Dashboard from './pages/Dashboard';
import Reels from './pages/Reels';
import ReelDetail from './pages/ReelDetail';
import Plan from './pages/Plan';
import World from './pages/World';
import Profiles from './pages/Profiles';
import StyleDocs from './pages/StyleDocs';
import Settings from './pages/Settings';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reels', label: 'Reels', icon: Film },
  { to: '/plan', label: 'Plan', icon: CalendarRange },
  { to: '/world', label: 'Cast & World', icon: Users },
  { to: '/profiles', label: 'Profiles', icon: AtSign },
  { to: '/style', label: 'Style & Docs', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function CreditsWidget({ compact }: { compact?: boolean }) {
  const { data, error } = useCredits();
  if (error) return <div className="text-xs text-rose-300">ElevenLabs not connected</div>;
  if (!data) return <div className="text-xs text-zinc-500">Loading balance…</div>;
  const pct = data.remaining / data.limit;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs"><span className="text-zinc-400">ElevenLabs · {data.tier}</span><span className={clsx('font-semibold', pct < .15 ? 'text-rose-300' : 'text-zinc-100')}>{data.remaining.toLocaleString()} left</span></div>
      <Progress value={pct} />
      {!compact && <div className="text-[11px] text-zinc-500">{data.used.toLocaleString()} / {data.limit.toLocaleString()} credits used{data.resetsAt && ` · resets ${new Date(data.resetsAt).toLocaleDateString()}`}</div>}
    </div>
  );
}

function JobWatcher() {
  const { data: jobs } = useJobs(); const qc = useQueryClient(); const seen = useRef<Record<string, string>>({});
  useEffect(() => {
    for (const j of jobs || []) {
      const prev = seen.current[j.id];
      if (prev && prev !== j.status && (j.status === 'done' || j.status === 'error')) {
        j.status === 'done' ? toast.success(`${j.label} finished`) : toast.error(`${j.label} failed: ${j.error}`);
        ['project', 'analysis', 'credits'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      }
      seen.current[j.id] = j.status;
    }
  }, [jobs, qc]);
  const running = (jobs || []).filter(j => j.status === 'running' || j.status === 'queued');
  if (!running.length) return null;
  return (
    <div className="rounded-xl bg-white/[.04] ring-1 ring-white/10 p-3 space-y-2">
      {running.map(j => <div key={j.id} className="space-y-1"><div className="flex justify-between text-[11px]"><span className="text-zinc-300 truncate">{j.label}</span><span className="text-zinc-500">{j.status === 'queued' ? 'queued' : Math.round(j.progress * 100) + '%'}</span></div><Progress value={j.status === 'queued' ? 0 : j.progress} /></div>)}
    </div>
  );
}

export default function App() {
  const { data: project, error } = useProject(); const [open, setOpen] = useState(false); const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const pending = project?.claudeRequests.filter(r => r.status === 'pending').length || 0;
  return (
    <div className="flex h-full">
      <aside className={clsx('fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-white/[.06] bg-zinc-950/90 backdrop-blur-xl p-4 flex flex-col gap-4 transition-transform lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="size-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 grid place-items-center shadow-lg shadow-pink-500/30"><Clapperboard className="size-5 text-white" /></div>
          <div className="min-w-0"><div className="font-bold text-white leading-tight">Reel Studio</div><div className="text-[11px] text-zinc-400 truncate">{project?.series.title || '…'}</div></div>
          <button className="ml-auto lg:hidden text-zinc-400" onClick={() => setOpen(false)}><X className="size-5" /></button>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => clsx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition', isActive ? 'bg-gradient-to-r from-pink-500/20 to-violet-500/10 text-white ring-1 ring-pink-500/20' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[.04]')}>
              <n.icon className="size-4" />{n.label}
              {n.to === '/plan' && pending > 0 && <span className="ml-auto rounded-full bg-amber-500/20 text-amber-300 text-[10px] px-1.5">{pending}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <JobWatcher />
          <div className="rounded-xl bg-white/[.04] ring-1 ring-white/10 p-3"><CreditsWidget compact /></div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 px-1"><Sparkles className="size-3.5 text-pink-400" />Writer: Claude (via Claude Code)</div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 border-b border-white/[.06] bg-zinc-950/80 backdrop-blur px-4 py-3">
          <button onClick={() => setOpen(true)}><Menu className="size-5" /></button><span className="font-semibold">Reel Studio</span>
        </div>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {error ? <div className="text-rose-300">Can't reach the studio server: {(error as Error).message}</div> : !project ? <div className="text-zinc-400">Loading studio…</div> : (
            <Routes>
              <Route path="/" element={<Dashboard p={project} />} />
              <Route path="/reels" element={<Reels p={project} />} />
              <Route path="/reels/:id" element={<ReelDetail p={project} />} />
              <Route path="/plan" element={<Plan p={project} />} />
              <Route path="/world" element={<World p={project} />} />
              <Route path="/profiles" element={<Profiles p={project} />} />
              <Route path="/style" element={<StyleDocs p={project} />} />
              <Route path="/settings" element={<Settings p={project} />} />
              {/* old links */}
              <Route path="/episodes/:id" element={<ReelDetail p={project} />} />
              <Route path="/episodes" element={<Navigate to="/reels" replace />} />
              <Route path="/inbox" element={<Navigate to="/plan?tab=inbox" replace />} />
              <Route path="/cast" element={<Navigate to="/world" replace />} />
              <Route path="/voices" element={<Navigate to="/world?tab=voices" replace />} />
              <Route path="/knowledge" element={<Navigate to="/style" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
