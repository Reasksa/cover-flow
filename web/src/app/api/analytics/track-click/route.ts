import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const TrackSchema = z.object({
  linkId: z.string().min(1),
  device: z.string().optional(),
  referrer: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { linkId, device, referrer } = parsed.data;

  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

  await prisma.link.update({
    where: { id: linkId },
    data: { clicks: { increment: 1 } },
  });

  await prisma.analytic.create({
    data: {
      linkId,
      clicks: 1,
      date: new Date(),
      device,
      referrer,
    },
  });

  return NextResponse.json({ ok: true });
}