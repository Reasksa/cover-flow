'use client';

import Image from 'next/image';
import Link from 'next/link';

type Theme = {
  primary: string;
  background: string;
};

type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
};

type Props = {
  username: string;
  name?: string | null;
  bio?: string | null;
  avatar?: string | null;
  links: LinkItem[];
  theme: Theme;
};

export default function ProfilePreview({ username, name, bio, avatar, links, theme }: Props) {
  return (
    <div className="rounded-xl border p-6" style={{ background: theme.background }}>
      <div className="text-center">
        {avatar ? (
          <Image src={avatar} alt={name ?? username} width={64} height={64} className="mx-auto rounded-full" />
        ) : null}
        <h3 className="mt-2 font-semibold">{name ?? username}</h3>
        {bio ? <p className="mt-1 text-sm text-gray-700">{bio}</p> : null}
      </div>
      <div className="mt-4 space-y-2">
        {links.filter(l => l.active).slice(0, 4).map(l => (
          <Link
            key={l.id}
            href={l.url}
            className="block rounded border p-2 text-sm hover:shadow transition"
            style={{ borderColor: theme.primary }}
          >
            {l.title}
          </Link>
        ))}
      </div>
    </div>
  );
}