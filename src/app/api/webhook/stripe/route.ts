import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe webhook signature' }, { status: 400 });
  }

  // Si STRIPE_WEBHOOK_SECRET está vacío, advertimos pero permitimos bypass (solo util para testing ciego)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  let event;

  try {
    if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
        // Fallback: Analizar JSON sin validar firma (SOLO EN DESARROLLO SI FALTAN LLAVES)
        logger.warn('WARNING: Stripe Webhook Secret missing. Bypassing validation.');
        event = JSON.parse(body);
    }
  } catch (error: any) {
    logger.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as any;
      const userId = session.client_reference_id; // Recibido desde la creación del link
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (!userId) {
          logger.error('Webhook Error: No client_reference_id found in session');
          break;
      }

      // Check if payment was already processed (Idempotency)
      const existingPayment = await prisma.processedPayment.findUnique({
        where: { paymentId: session.id }
      });

      if (existingPayment) {
        logger.info(`Webhook Warning: Stripe Checkout Session ${session.id} already processed. Skipping duplicate.`);
        break;
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Record payment to guarantee idempotency
          await tx.processedPayment.create({
            data: {
              paymentId: session.id,
              provider: 'STRIPE',
              userId: userId,
              amount: session.amount_total ? session.amount_total / 100 : null
            }
          });

          if (session.mode === 'payment' && session.metadata?.purchaseType === 'tokens') {
            // Es una compra de tokens
            const amount = parseInt(session.metadata?.amount || '0', 10);
            logger.info(`Valid checkout session for User ${userId}. Adding ${amount} tokens via Stripe transaction.`);
            
            await tx.user.update({
              where: { id: userId },
              data: { gravityTokens: { increment: amount } }
            });
            logger.info(`User ${userId} successfully received ${amount} tokens.`);
          } else {
            // Es una suscripción ELITE
            logger.info(`Valid checkout session for User ${userId}. Upgrading to ELITE via Stripe transaction.`);

            await tx.subscription.upsert({
              where: { userId },
              create: {
                userId,
                plan: "ELITE", // Hardcoded para este MVP
                status: "ACTIVE",
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
              },
              update: {
                plan: "ELITE",
                status: "ACTIVE",
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
              }
            });
            logger.info(`User ${userId} successfully upgraded to premium via Stripe.`);
          }
        });
      } catch (txErr: any) {
        logger.error(`Prisma transaction failed processing Stripe checkout for user ${userId}:`, txErr);
      }
      break;

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated':
        // Aquí puedes manejar cancelaciones y rebajar status a FREE
        logger.info(`Subscription Updated Event: ${event.type}. Please implement logic.`);
        break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
