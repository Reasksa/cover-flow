import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: Request) {
  if (!process.env.ENABLE_TEST_ROUTES) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || '';
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 404 });

  return NextResponse.json({ token: token.token });
}