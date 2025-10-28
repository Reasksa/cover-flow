import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const ThemeUpdateSchema = z.object({
  themeId: z.string().min(1),
  // optional direct colors to create a custom theme in future
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = ThemeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const theme = await prisma.theme.findUnique({ where: { id: parsed.data.themeId } });
  if (!theme) return NextResponse.json({ error: 'Theme not found' }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { themeId: theme.id },
    include: { theme: true },
  });

  return NextResponse.json({ ok: true, theme: updated.theme });
}