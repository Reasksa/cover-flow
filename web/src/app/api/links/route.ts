import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CreateLinkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  icon: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function GET() {
  // For scaffold, return all links (in real app, scope to current user)
  const links = await prisma.link.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Scaffold: assign to a placeholder user; replace with session user
  const demoUser = await prisma.user.findFirst();
  if (!demoUser) {
    return NextResponse.json({ error: 'No user exists. Create a user first.' }, { status: 400 });
  }

  const link = await prisma.link.create({
    data: {
      title: data.title,
      url: data.url,
      icon: data.icon,
      thumbnail: data.thumbnail,
      order: data.order,
      active: data.active,
      userId: demoUser.id,
    },
  });

  return NextResponse.json(link, { status: 201 });
}