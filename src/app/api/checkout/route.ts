import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión para suscribirte.' }, { status: 401 });
    }

    // Usamos el tunel publico si está en dev, o la URL original
    const baseUrl = process.env.NEXTAUTH_URL || req.headers.get('origin');
    
    // Crear Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          // TODO: Para ir full prod, debes crear un Producto en tu panel de Stripe y 
          // reemplazar este precio hardcoded por el ID real del precio, ej: price_1xxxx...
          price_data: {
             currency: 'usd',
             product_data: {
               name: 'Looksy Elite Subscription',
               description: 'Looks ilimitados, Escáner V2.5 Pro y Cero Restricciones.',
               images: ['https://hnxpercbdncbzhldvzkm.supabase.co/storage/v1/object/public/looksy-media/icon-192x192.png'],
             },
             unit_amount: 999, // $9.99
             recurring: { interval: 'month' }
          },
          quantity: 1,
        },
      ],
      client_reference_id: session.user.id,
      success_url: `${baseUrl}/subscription?success=true`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
    });

    if (!stripeSession.url) throw new Error('Stripe returned no session URL');

    return NextResponse.json({ url: stripeSession.url });

  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
