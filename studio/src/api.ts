import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type Audio = { url: string; duration: number; text: string; at: string };
export type Line = { id: string; speaker: string; text: string; subtitle?: string; emotion: string; audio?: Audio };
export type Shot = { id: string; template: string; location: string; characters: string[]; mood: string; minDuration: number; params: any; lines: Line[] };
export type Render = { url: string; poster: string; duration: number; at: string; variant?: string };
export type PublishEntry = { id: string; platform: string; at: string; status: string; url?: string; error?: string; export?: boolean };
export type Episode = {
  id: string; num: number; title: string; synopsis: string; status: string; shots: Shot[]; musicVolume?: number;
  music?: { url: string; duration: number; plan: string[]; at: string; forDuration: number };
  render?: Render; renders?: Record<string, Render>;
  publish: { caption: string; hashtags: string[]; youtubeTitle: string; youtubePrivacy: string; cta?: Record<string, string>; history: PublishEntry[]; scheduled: { id: string; platform: string; at: string }[] };
  createdAt: string; updatedAt?: string;
};
export type Character = { id: string; name: string; role: string; description: string; color: string; look: string | null; voice: { id: string; name: string; model?: string } | null };
export type Place = { id: string; name: string; scene: string; description: string };
export type Story = { id: string; createdAt: string; text: string; tags: string[]; replaced: string[]; status: string };
export type ClaudeRequest = { id: string; createdAt: string; kind: string; storyIds: string[]; episodeId: string | null; note: string; status: string; result?: string };
export type KB = { id: string; title: string; tags: string[]; body: string };
export type PlanItem = { id: string; num: number; title: string; beats: string; status: 'idea' | 'planned' | 'production' | 'done'; episodeId?: string; hook?: string };
export type CalSlot = { id: string; date: string; platform: string; episodeNum?: number; note?: string };
export type Profile = { handle: string; displayName: string; bio: string; link: string; checklist: Record<string, boolean> };
export type Stat = { id: string; date: string; platform: string; followers: number; views: number };
export type Project = {
  series: { title: string; tagline: string; language: string; handle: string; hashtags: string[]; musicStyle: string[] };
  characters: Character[]; places: Place[]; stories: Story[]; claudeRequests: ClaudeRequest[]; knowledge: KB[]; episodes: Episode[];
  moods: Record<string, { label: string; styles: string[] }>;
  platforms: Record<string, { name: string; mode: 'api' | 'export' }>;
  variants: Record<string, { label: string; cta: string; color: string }>;
  plan: { items: PlanItem[] }; calendar: CalSlot[]; world: { relations: { a: string; b: string; label: string }[] };
  profiles: Record<string, Profile>; stats: Stat[];
  style: { captionTemplates: { id: string; name: string; text: string }[]; hashtagSets: { id: string; name: string; tags: string[] }[] };
};
export const saveDoc = (key: string, value: unknown) => api(`/doc/${key}`, { method: 'PUT', body: value });
export type Job = { id: string; kind: string; label: string; status: 'queued' | 'running' | 'done' | 'error'; progress: number; error?: string; createdAt: number; result?: any };

// View-only deployment: reads come from a static snapshot, writes are disabled.
export const STATIC = import.meta.env.VITE_STATIC === '1';
async function staticApi(path: string, method: string) {
  if (method !== 'GET') throw new Error('View-only studio. Ask Claude in Claude Code to make changes.');
  const p = path.split('?')[0];
  const map: Record<string, string> = { '/project': 'project', '/elevenlabs/credits': 'credits', '/integrations': 'integrations', '/hub': 'hub', '/elevenlabs/voices': 'voices' };
  if (p === '/jobs') return [];
  if (p === '/privacy/name-map') return [];
  const m = p.match(/^\/episodes\/([^/]+)\/analysis$/);
  const file = m ? `analysis-${m[1]}` : map[p];
  if (!file) throw new Error('Not available in the view-only studio');
  const r = await fetch(`/snapshot/${file}.json`); if (!r.ok) throw new Error('Snapshot missing'); return r.json();
}
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  if (STATIC) return staticApi(path, opts.method || (opts.body !== undefined ? 'POST' : 'GET')) as Promise<T>;
  const r = await fetch('/api' + path, {
    method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || r.statusText);
  return d as T;
}

export const useProject = () => useQuery({ queryKey: ['project'], queryFn: () => api<Project>('/project') });
export const useCredits = () => useQuery({ queryKey: ['credits'], queryFn: () => api<{ tier: string; used: number; limit: number; remaining: number; resetsAt: string | null }>('/elevenlabs/credits'), refetchInterval: 120000, retry: false });
export const useJobs = () => useQuery({ queryKey: ['jobs'], queryFn: () => api<Job[]>('/jobs'), refetchInterval: 1500 });
export const useAnalysis = (id?: string) => useQuery({ queryKey: ['analysis', id], enabled: !!id, queryFn: () => api<{ duration: number; shots: { id: string; start: number; dur: number }[]; viral: { score: number; checks: { id: string; label: string; ok: boolean; tip: string; weight: number }[] }; leaks: string[] }>(`/episodes/${id}/analysis`) });

export function useAct<V = void, R = any>(fn: (v: V) => Promise<R>, opts: { success?: string; invalidate?: string[] } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { (opts.invalidate || ['project', 'analysis', 'jobs']).forEach(k => qc.invalidateQueries({ queryKey: [k] })); if (opts.success) toast.success(opts.success); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const newId = (p = '') => p + Math.random().toString(36).slice(2, 9);
export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
export const stripTags = (t: string) => (t || '').replace(/\[[^\]]*\]\s*/g, '').trim();
