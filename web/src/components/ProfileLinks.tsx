'use client';

import Link from 'next/link';

type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
};

export default function ProfileLinks({
  links,
  borderColor,
  hoverEnabled = true,
  shadowEnabled = true,
}: {
  links: LinkItem[];
  borderColor: string;
  hoverEnabled?: boolean;
  shadowEnabled?: boolean;
}) {
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

  const hoverClasses = `${hoverEnabled ? 'hover:scale-105' : ''} ${shadowEnabled ? 'hover:shadow-lg' : ''}`.trim();

  return (
    <div className="mt-6 space-y-3">
      {links.filter((l) => l.active).map((l) => (
        <Link
          key={l.id}
          href={l.url}
          className={`block rounded-lg border p-3 transition ${hoverClasses}`}
          style={{ borderColor }}
          onClick={() => trackClick(l.id)}
        >
          {l.title}
        </Link>
      ))}
    </div>
  );
}