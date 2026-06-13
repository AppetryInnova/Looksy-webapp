import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión para realizar el pago.' }, { status: 401 });
    }

    const { purchaseType, plan } = await req.json();

    const baseUrl = process.env.NEXTAUTH_URL || req.headers.get('origin') || 'http://localhost:3000';
    
    // Configurar el ítem y precio
    let title = '50 Looksy Tokens';
    let unitPrice = 1.99; // $1.99 USD
    let itemId = 'tokens_50';

    if (purchaseType === 'subscription') {
      if (plan === 'PRO') {
        title = 'Plan Looksy PRO';
        unitPrice = 9.99; // $9.99 USD / mes
        itemId = 'sub_pro';
      } else if (plan === 'ELITE') {
        title = 'Plan Looksy ELITE';
        unitPrice = 19.99; // $19.99 USD / mes
        itemId = 'sub_elite';
      } else {
        return NextResponse.json({ error: 'Plan inválido.' }, { status: 400 });
      }
    }

    // A. Simulador de Mercado Pago si falta el Token de Acceso
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      console.warn('WARNING: MERCADO_PAGO_ACCESS_TOKEN missing. Using Mercado Pago Sandbox Simulator.');
      const simulatorUrl = `${baseUrl}/es/wardrobe?success=mercadopago_mock&purchaseType=${purchaseType}&plan=${plan || ''}&userId=${userId}`;
      return NextResponse.json({ url: simulatorUrl, isSimulator: true });
    }

    // B. Mercado Pago Real Integration
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: itemId,
            title: title,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: 'USD',
            description: purchaseType === 'subscription' 
              ? `Suscripción mensual al plan ${plan} de Looksy.` 
              : 'Tokens para recargar saldo de escaneos y VTO.',
          }
        ],
        metadata: {
          userId: userId,
          purchaseType: purchaseType,
          plan: plan || '',
          amount: purchaseType === 'tokens' ? 50 : 0
        },
        notification_url: `${baseUrl}/api/webhook/mercadopago`,
        back_urls: {
          success: `${baseUrl}/es/wardrobe?success=mercadopago_purchased`,
          failure: `${baseUrl}/es/wardrobe?canceled=true`,
          pending: `${baseUrl}/es/wardrobe?pending=true`
        },
        auto_return: 'approved'
      }
    });

    const checkoutUrl = result.init_point || result.sandbox_init_point;
    if (!checkoutUrl) throw new Error('Mercado Pago returned no preference URL');

    return NextResponse.json({ url: checkoutUrl, isSimulator: false });

  } catch (error) {
    console.error('Error creating Mercado Pago Preference:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
