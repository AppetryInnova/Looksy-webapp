import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const isMock = req.headers.get('x-mock-payment') === 'true';
    
    let userId: string;
    let purchaseType: string;
    let plan: string | null = null;
    let amount = 0;
    let paymentId = 'unknown';

    if (isMock) {
      // 1. Simulator Bypass Flow (Allowed ONLY in non-production)
      if (process.env.NODE_ENV === 'production') {
        logger.warn('[MercadoPago Webhook] Mock payment request rejected in production.');
        return NextResponse.json({ error: 'Mock payments are disabled in production' }, { status: 403 });
      }

      logger.info('[MercadoPago Webhook] Processing MOCK payment request.');
      const body = await req.json();
      const mockMetadata = body.mockMetadata;
      
      if (!mockMetadata || !mockMetadata.userId) {
        return NextResponse.json({ error: 'Missing mock metadata or userId' }, { status: 400 });
      }
      
      userId = mockMetadata.userId;
      purchaseType = mockMetadata.purchaseType;
      plan = mockMetadata.plan || null;
      amount = mockMetadata.amount || 0;
      paymentId = body.data?.id || `mock_${Date.now()}`;
    } else {
      // 2. Real Mercado Pago Integration Flow
      const { searchParams } = new URL(req.url);
      
      // MP notifications can come in body as JSON or as query parameters
      let id = searchParams.get('id') || searchParams.get('data.id');
      let type = searchParams.get('type') || searchParams.get('topic');

      // Parse body if query string is empty
      if (!id || !type) {
        try {
          const body = await req.json();
          if (body.type === 'payment' || body.topic === 'payment') {
            type = 'payment';
            id = body.data?.id || body.id;
          }
        } catch (_) {
          // Body might not be JSON or is empty
        }
      }

      if (!id || type !== 'payment') {
        logger.info('[MercadoPago Webhook] Ignored event type or missing id:', { type, id });
        return NextResponse.json({ received: true });
      }

      paymentId = String(id);

      if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        logger.error('[MercadoPago Webhook] Real webhook notification received but MERCADO_PAGO_ACCESS_TOKEN is missing.');
        return NextResponse.json({ error: 'Mercado Pago token missing' }, { status: 500 });
      }

      logger.info(`[MercadoPago Webhook] Verifying payment ${paymentId} with Mercado Pago...`);
      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
      const payment = new Payment(client);
      
      const paymentData = await payment.get({ id: paymentId });
      
      if (paymentData.status !== 'approved') {
        logger.info(`[MercadoPago Webhook] Payment ${paymentId} is not approved. Status: ${paymentData.status}`);
        return NextResponse.json({ received: true });
      }

      // Safe metadata checking (snake_case from MP, camelCase if custom-passed)
      const metadata = paymentData.metadata || {};
      userId = metadata.user_id || metadata.userId;
      purchaseType = metadata.purchase_type || metadata.purchaseType;
      plan = metadata.plan || null;
      amount = Number(metadata.amount || 0);

      if (!userId) {
        logger.error(`[MercadoPago Webhook] Payment ${paymentId} approved but missing userId in metadata.`);
        return NextResponse.json({ error: 'Missing userId in metadata' }, { status: 400 });
      }
    }

    // Check if payment was already processed (Idempotency)
    const existingPayment = await prisma.processedPayment.findUnique({
      where: { paymentId }
    });

    if (existingPayment) {
      logger.info(`[MercadoPago Webhook] Payment ${paymentId} has already been processed. Skipping duplicate credit.`);
      return NextResponse.json({ success: true, paymentId, alreadyProcessed: true });
    }

    // 3. Process the credit in the database inside a transaction
    logger.info(`[MercadoPago Webhook] Processing approved payment ${paymentId} for User ${userId}. Type: ${purchaseType}, Plan: ${plan}`);

    try {
      await prisma.$transaction(async (tx) => {
        // Record payment to guarantee idempotency
        await tx.processedPayment.create({
          data: {
            paymentId,
            provider: 'MERCADOPAGO',
            userId,
            amount: purchaseType === 'tokens' ? 1.99 : (plan === 'PRO' ? 9.99 : 19.99)
          }
        });

        // Credit tokens or update subscription
        if (purchaseType === 'tokens') {
          const tokensToAdd = amount || 50;
          await tx.user.update({
            where: { id: userId },
            data: { gravityTokens: { increment: tokensToAdd } }
          });
          logger.info(`[MercadoPago Webhook] Transaction succeeded: Added ${tokensToAdd} tokens to user ${userId}`);
        } else if (purchaseType === 'subscription') {
          if (!plan || !['PRO', 'ELITE'].includes(plan)) {
            throw new Error(`Invalid subscription plan: ${plan}`);
          }

          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);

          await tx.subscription.upsert({
            where: { userId },
            create: {
              userId,
              plan: plan,
              status: 'ACTIVE',
              endDate,
            },
            update: {
              plan: plan,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate,
            }
          });
          logger.info(`[MercadoPago Webhook] Transaction succeeded: Upgraded user ${userId} to subscription plan ${plan}`);
        }
      });
    } catch (txErr: any) {
      logger.error('[MercadoPago Webhook] Prisma transaction failed:', txErr);
      return NextResponse.json({ error: txErr.message || 'Transaction failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, paymentId });

  } catch (error: any) {
    logger.error('[MercadoPago Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
