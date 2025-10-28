import { prisma } from '../../lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

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

  return (
    <main
      className="min-h-screen"
      style={{ background: user.theme?.background ?? '#FFFFFF' }}
    >
      <section className="mx-auto max-w-xl px-6 py-12 text-center">
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

        <div className="mt-6 space-y-3">
          {user.links
            .filter((l) => l.active)
            .map((l) => (
              <Link
                key={l.id}
                href={l.url}
                className="block rounded-lg border p-3 hover:scale-105 hover:shadow-lg transition"
                style={{ borderColor: user.theme?.primary ?? '#6366F1' }}
              >
                {l.title}
              </Link>
            ))}
        </div>

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