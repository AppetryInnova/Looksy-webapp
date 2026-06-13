import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión para canjear códigos.' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código inválido o ausente.' }, { status: 400 });
    }

    // Clean up code input (trim and uppercase)
    const cleanCode = code.trim().toUpperCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Query active unused promo code
    const promo = await prisma.promoCode.findFirst({
      where: {
        code: cleanCode,
        isActive: true,
        usedById: null
      }
    });

    if (!promo) {
      return NextResponse.json({ error: 'El código promocional no es válido, ya ha sido utilizado o ha expirado.' }, { status: 400 });
    }

    logger.info(`[PromoCode Redeem] User ${userId} is redeeming code: ${cleanCode} (${promo.type})`);

    let resultMessage = '';

    // Run transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mark code as used
      await tx.promoCode.update({
        where: { id: promo.id },
        data: {
          isActive: false,
          usedById: userId,
          usedAt: new Date()
        }
      });

      // 2. Grant rewards
      if (promo.type === 'TOKENS') {
        const tokensToGrant = promo.value || 50;
        await tx.user.update({
          where: { id: userId },
          data: {
            gravityTokens: { increment: tokensToGrant }
          }
        });
        resultMessage = `Se han acreditado ${tokensToGrant} tokens a tu cuenta con éxito.`;
      } else if (promo.type === 'SUBSCRIPTION') {
        const planToGrant = promo.plan || 'ELITE';
        const months = promo.value || 1;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);

        await tx.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan: planToGrant,
            status: 'ACTIVE',
            endDate,
          },
          update: {
            plan: planToGrant,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate,
          }
        });
        resultMessage = `¡Tu suscripción al plan ${planToGrant} ha sido activada con éxito por ${months} mes(es)!`;
      } else {
        throw new Error(`Tipo de código promocional no soportado: ${promo.type}`);
      }
    });

    return NextResponse.json({
      success: true,
      message: resultMessage,
      type: promo.type,
      value: promo.value,
      plan: promo.plan
    });

  } catch (error: any) {
    logger.error('Error redeeming promo code:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor.' }, { status: 500 });
  }
}
