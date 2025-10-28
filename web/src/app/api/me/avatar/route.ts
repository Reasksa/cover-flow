import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const AvatarSchema = z.object({
  avatarUrl: z.string().url(),
});

function transformCloudinaryAvatar(url: string): string {
  // If this is a Cloudinary URL, insert face-centered circular crop
  // Supported pattern: https://res.cloudinary.com/<cloud>/image/upload/.../<public_id>.<format>
  try {
    const u = new URL(url);
    if (u.hostname.includes('res.cloudinary.com') && u.pathname.includes('/image/upload/')) {
      // If there's already a transformation segment, replace it; else insert after /image/upload/
      const replaced = u.pathname.replace(
        '/image/upload/',
        '/image/upload/c_fill,g_face,r_max,w_192,h_192/'
      );
      u.pathname = replaced;
      return u.toString();
    }
  } catch {
    // Fall through to original url
  }
  return url;
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = AvatarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const finalUrl = transformCloudinaryAvatar(parsed.data.avatarUrl);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatar: finalUrl },
  });

  return NextResponse.json({ ok: true, avatar: updated.avatar });
}