import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { theme: true, links: { orderBy: { order: 'asc' } }, socials: true }
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Only return necessary fields
  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    hoverEnabled: user.hoverEnabled,
    shadowEnabled: user.shadowEnabled,
    theme: user.theme ? { primary: user.theme.primary, background: user.theme.background } : null,
    links: user.links.map(l => ({ id: l.id, title: l.title, url: l.url, active: l.active, order: l.order })),
    socials: user.socials,
  });
}