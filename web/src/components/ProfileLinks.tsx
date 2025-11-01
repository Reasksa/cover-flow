'use client';

import Link from 'next/link';
import Image from 'next/image';

type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  thumbnail?: string | null;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
};

export default function ProfileLinks({
  links,
  borderColor,
  hoverEnabled = true,
  shadowEnabled = true,
  showThumbnails = true,
}: {
  links: LinkItem[];
  borderColor: string;
  hoverEnabled?: boolean;
  shadowEnabled?: boolean;
  showThumbnails?: boolean;
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

  const now = new Date();
  const isWithinSchedule = (l: LinkItem) => {
    const fromOk = l.visibleFrom ? new Date(l.visibleFrom) <= now : true;
    const untilOk = l.visibleUntil ? new Date(l.visibleUntil) >= now : true;
    return fromOk && untilOk;
  };

  return (
    <div className="mt-6 space-y-3">
      {links
        .filter((l) => l.active && isWithinSchedule(l))
        .map((l) => (
          <Link
            key={l.id}
            href={l.url}
            className={`block rounded-lg border p-3 transition ${hoverClasses}`}
            style={{ borderColor }}
            onClick={() => trackClick(l.id)}
          >
            <div className="flex items-center gap-3">
              {showThumbnails && l.thumbnail ? (
                <Image
                  src={l.thumbnail}
                  alt=""
                  width={64}
                  height={40}
                  className="rounded object-cover"
                />
              ) : null}
              <span>{l.title}</span>
            </div>
          </Link>
        ))}
    </div>
  );
}