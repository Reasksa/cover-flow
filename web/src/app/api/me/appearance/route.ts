import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const AppearanceSchema = z.object({
  hoverEnabled: z.boolean().optional(),
  shadowEnabled: z.boolean().optional(),
  selectedFont: z.enum(['Inter', 'Poppins', 'Montserrat', 'Nunito']).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = AppearanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...('hoverEnabled' in parsed.data ? { hoverEnabled: parsed.data.hoverEnabled } : {}),
      ...('shadowEnabled' in parsed.data ? { shadowEnabled: parsed.data.shadowEnabled } : {}),
      ...('selectedFont' in parsed.data ? { selectedFont: parsed.data.selectedFont } : {}),
    },
    select: { hoverEnabled: true, shadowEnabled: true, selectedFont: true },
  });

  return NextResponse.json(updated);
}