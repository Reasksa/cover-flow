'use client';

import Link from 'next/link';

type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
};

export default function ProfileLinks({ links, borderColor }: { links: LinkItem[]; borderColor: string }) {
  const trackClick = async (linkId: string) => {
    try {
      await fetch('/api/analytics/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId,
          device: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop') : undefined,
          referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        }),
        keepalive: true,
      });
    } catch (_) {
      // swallow errors; tracking should not block navigation
    }
  };

  return (
    <div className="mt-6 space-y-3">
      {links.filter((l) => l.active).map((l) => (
        <Link
          key={l.id}
          href={l.url}
          className="block rounded-lg border p-3 hover:scale-105 hover:shadow-lg transition"
          style={{ borderColor }}
          onClick={() => trackClick(l.id)}
        >
          {l.title}
        </Link>
      ))}
    </div>
  );
}