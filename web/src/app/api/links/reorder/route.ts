import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const ReorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number().int() })),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items } = parsed.data;

  // Verify ownership
  const ids = items.map(i => i.id);
  const links = await prisma.link.findMany({ where: { id: { in: ids }, userId: user.id } });
  if (links.length !== items.length) {
    return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
  }

  // Update orders in a transaction
  await prisma.$transaction(
    items.map(i =>
      prisma.link.update({
        where: { id: i.id },
        data: { order: i.order },
      })
    )
  );

  return NextResponse.json({ ok: true });
}