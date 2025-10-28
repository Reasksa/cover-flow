import { prisma } from '../../lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import ProfileLinks from '@/src/components/ProfileLinks';
import { fontClass } from '@/src/lib/fonts';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: { links: { orderBy: { order: 'asc' } }, theme: true, socials: true }
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="mt-4 text-gray-600">The username “{params.username}” does not exist.</p>
      </main>
    );
  }

  const fontCls = fontClass(user.selectedFont || 'Inter');

  return (
    <main
      className="min-h-screen"
      style={{ background: user.theme?.background ?? '#FFFFFF' }}
    >
      <section className={`mx-auto max-w-xl px-6 py-12 text-center ${fontCls}`}>
        {user.avatar && (
          <Image
            src={user.avatar}
            alt={user.name ?? user.username}
            width={96}
            height={96}
            className="mx-auto rounded-full"
          />
        )}
        <h1 className="mt-4 text-2xl font-bold" style={{ color: '#1F2937' }}>
          {user.name ?? user.username}
        </h1>
        {user.bio && <p className="mt-2 text-gray-600">{user.bio}</p>}

        <ProfileLinks
          links={user.links.map(l => ({
            id: l.id,
            title: l.title,
            url: l.url,
            active: l.active,
            thumbnail: l.thumbnail,
            visibleFrom: l.visibleFrom ? l.visibleFrom.toISOString() : null,
            visibleUntil: l.visibleUntil ? l.visibleUntil.toISOString() : null,
          }))}
          borderColor={user.theme?.primary ?? '#6366F1'}
          hoverEnabled={user.hoverEnabled}
          shadowEnabled={user.shadowEnabled}
          showThumbnails={true}
        />

        {user.socials?.length ? (
          <div className="mt-8 flex justify-center gap-4">
            {user.socials.map((s) => (
              <Link key={s.id} href={s.url} className="underline">
                {s.platform}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}