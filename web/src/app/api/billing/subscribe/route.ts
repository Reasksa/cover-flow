import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // For simplicity, create a Checkout Session for "Pro" plan.
  // Expect a Price ID in env: STRIPE_PRO_PRICE_ID
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Missing STRIPE_PRO_PRICE_ID' }, { status: 500 });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=1`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: checkout.url });
}