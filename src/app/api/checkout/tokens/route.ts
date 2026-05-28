import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión para comprar tokens.' }, { status: 401 });
    }

    // Usamos el tunel publico si está en dev, o la URL original
    const baseUrl = process.env.NEXTAUTH_URL || req.headers.get('origin') || 'http://localhost:3000';
    
    // Crear Checkout Session para Pago Único (Tokens)
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Pago único, no suscripción
      line_items: [
        {
          price_data: {
             currency: 'usd',
             product_data: {
               name: '50 Looksy Tokens',
               description: 'Recarga tu saldo para seguir usando el Espejo Virtual (VTO).',
               images: ['https://hnxpercbdncbzhldvzkm.supabase.co/storage/v1/object/public/looksy-media/icon-192x192.png'], // Ajusta a la URL real de tu logo/moneda
             },
             unit_amount: 199, // $1.99
          },
          quantity: 1,
        },
      ],
      client_reference_id: session.user.id,
      metadata: {
        purchaseType: 'tokens',
        amount: '50'
      },
      success_url: `${baseUrl}/es/wardrobe?success=tokens_purchased`,
      cancel_url: `${baseUrl}/es/wardrobe?canceled=true`,
    });

    if (!stripeSession.url) throw new Error('Stripe returned no session URL');

    return NextResponse.json({ url: stripeSession.url });

  } catch (error) {
    console.error('Error creating Stripe Checkout session for tokens:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
