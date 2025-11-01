import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const ForgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Avoid disclosing user existence
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASS,
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_SERVER_USER,
    to: email,
    subject: 'Reset your password',
    text: `Click the link to reset your password: ${resetUrl}`,
    html: `<p>Click the link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  return NextResponse.json({ ok: true });
}