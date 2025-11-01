import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '../../../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string | undefined;
      const customerId = session.customer as string | undefined;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: 'PRO',
          },
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
      if (user) {
        const status = sub.status;
        const plan = status === 'active' ? 'PRO' : 'FREE';
        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionId: sub.id,
            plan,
          },
        });
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      // No-op for now
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};