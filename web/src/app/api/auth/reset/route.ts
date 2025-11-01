import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';

const ResetSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  // Clean up token
  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}