import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const UpdateLinkSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  icon: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  collection: z.string().optional(),
  visibleFrom: z.string().datetime().nullable().optional(),
  visibleUntil: z.string().datetime().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const link = await prisma.link.findUnique({ where: { id: params.id } });
  if (!link || link.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.link.update({
    where: { id: params.id },
    data: {
      ...('title' in data ? { title: data.title! } : {}),
      ...('url' in data ? { url: data.url! } : {}),
      ...('icon' in data ? { icon: data.icon } : {}),
      ...('thumbnail' in data ? { thumbnail: data.thumbnail } : {}),
      ...('order' in data ? { order: data.order! } : {}),
      ...('active' in data ? { active: data.active! } : {}),
      ...('collection' in data ? { collection: data.collection } : {}),
      ...('visibleFrom' in data
        ? { visibleFrom: data.visibleFrom ? new Date(data.visibleFrom) : null }
        : {}),
      ...('visibleUntil' in data
        ? { visibleUntil: data.visibleUntil ? new Date(data.visibleUntil) : null }
        : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const link = await prisma.link.findUnique({ where: { id: params.id } });
  if (!link || link.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.link.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}