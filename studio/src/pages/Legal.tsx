import { ReactNode } from 'react';
import clsx from 'clsx';
import { card, muted } from '../components/ui';

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className={clsx(card, 'mx-auto max-w-3xl')}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep dark:text-gold">Strangers to Forever Studio</div>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-wide">{title}</h1>
      <p className={clsx('mt-1 text-xs', muted)}>Last updated {new Date('2026-11-19').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div className="mt-5 grid gap-4 text-sm leading-relaxed [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold">{children}</div>
    </article>
  );
}

export const About = () => <Page title="About"><p>Strangers to Forever Studio is the private production tool behind the animated Hinglish love-story series <b>Strangers to Forever</b>. Reels are written, voiced, animated and rendered with Claude, then reviewed and published here.</p></Page>;

export const Privacy = () => (
  <Page title="Privacy policy">
    <h2>What we collect</h2><p>Studio content only: scripts, captions, rendered reels and publishing status. Real names of the people the story is based on are never stored in this app.</p>
    <h2>Google user data</h2><p>If YouTube is connected, the studio requests the YouTube scopes <span className="font-mono">youtube.upload</span> and <span className="font-mono">youtube.readonly</span>, only to upload this series' Shorts and read the channel name. It follows the Google API Services User Data Policy.</p>
    <h2>Instagram data</h2><p>If Instagram is connected, the studio uses <span className="font-mono">instagram_business_basic</span> and <span className="font-mono">instagram_business_content_publish</span> only to publish this series' reels.</p>
    <h2>Retention and deletion</h2><p>Tokens can be removed at any time from Settings; disconnecting deletes them.</p>
    <h2>Security</h2><p>Tokens are kept in private server-side storage, never in the public repository or the online copy.</p>
  </Page>
);

export const Terms = () => (
  <Page title="Terms of service">
    <p>Strangers to Forever Studio is a private tool for the series' creators. Access is limited to people the owner has given the PIN to.</p>
    <p>Use the studio only to prepare and publish this series' own content. Content published through the studio must follow the YouTube and Instagram terms and community guidelines.</p>
    <p>The studio is provided as is, without warranty. The owner may change or withdraw access at any time.</p>
  </Page>
);
