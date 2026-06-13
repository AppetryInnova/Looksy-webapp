import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    // Basic protection: Only allow in development OR if a secret key is provided
    const secretHeader = req.headers.get('x-promo-secret');
    const systemSecret = process.env.NEXTAUTH_SECRET || 'development-secret-key-123';
    
    if (process.env.NODE_ENV === 'production' && secretHeader !== systemSecret) {
      logger.warn('[PromoCode Generate] Unauthorized generate attempt in production.');
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { type = 'TOKENS', value = 50, plan = 'ELITE', count = 1 } = await req.json();

    if (!['TOKENS', 'SUBSCRIPTION'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de cupón inválido.' }, { status: 400 });
    }

    const createdCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate unique random code format: LOOKSY-XXXX-YYYY
      const rand1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const rand2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `LOOKSY-${rand1}-${rand2}`;

      await prisma.promoCode.create({
        data: {
          code,
          type,
          value: Number(value),
          plan: type === 'SUBSCRIPTION' ? plan : null,
          isActive: true
        }
      });

      createdCodes.push(code);
    }

    logger.info(`[PromoCode Generate] Successfully generated ${count} codes of type ${type}`);

    return NextResponse.json({
      success: true,
      codes: createdCodes,
      type,
      value,
      plan: type === 'SUBSCRIPTION' ? plan : null
    });

  } catch (error: any) {
    logger.error('Error generating promo codes:', error);
    return NextResponse.json({ error: error.message || 'Error al generar códigos.' }, { status: 500 });
  }
}
