import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, username } = parsed.data;

  // Note: For scaffold, we are not storing password. Replace with hashed password in real app.
  try {
    const user = await prisma.user.create({
      data: { email, username }
    });
    return NextResponse.json({ id: user.id, email: user.email, username: user.username }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}