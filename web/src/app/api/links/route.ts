import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

const CreateLinkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  icon: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  collection: z.string().optional(),
  visibleFrom: z.string().datetime().optional(),
  visibleUntil: z.string().datetime().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json([], { status: 200 });

  const links = await prisma.link.findMany({
    where: { userId: user.id },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = CreateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const link = await prisma.link.create({
    data: {
      title: data.title,
      url: data.url,
      icon: data.icon,
      thumbnail: data.thumbnail,
      order: data.order,
      active: data.active,
      collection: data.collection,
      visibleFrom: data.visibleFrom ? new Date(data.visibleFrom) : undefined,
      visibleUntil: data.visibleUntil ? new Date(data.visibleUntil) : undefined,
      userId: user.id,
    },
  });

  return NextResponse.json(link, { status: 201 });
}