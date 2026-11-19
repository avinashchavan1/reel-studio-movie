import { Pencil, Send } from 'lucide-react';
import { Project } from '../api';
import { Tabs, useTab } from '../components/ui';
import EpisodeEditor from './EpisodeEditor';
import Publish from './Publish';

export default function ReelDetail({ p }: { p: Project }) {
  const [tab, setTab] = useTab('edit');
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'edit', label: 'Edit & produce', icon: <Pencil className="size-4" /> }, { id: 'publish', label: 'Publish', icon: <Send className="size-4" /> }]} />
      {tab === 'publish' ? <Publish p={p} /> : <EpisodeEditor p={p} />}
    </>
  );
}
