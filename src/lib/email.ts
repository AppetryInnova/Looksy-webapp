import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
    ? new Resend(process.env.RESEND_API_KEY) 
    : null;

export async function sendWelcomeEmail(email: string, name: string) {
    if (!resend) {
        console.warn('RESEND_API_KEY not found, skipping welcome email');
        return;
    }

    try {
        await resend.emails.send({
            from: 'Looksy Gravity <welcome@looksy.fashion>',
            to: email,
            subject: '¡Bienvenido a la Revolución de la Moda! 🚀',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #10b981;">¡Hola ${name}!</h1>
                    <p>Estamos emocionados de tenerte en <strong>Looksy Gravity</strong>.</p>
                    <p>Tu armario ahora tiene superpoderes. Escanea tus outfits, únete a batallas y descubre tu mejor versión con nuestra IA.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://looksy.fashion/dashboard" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Empieza a Escanear</a>
                    </div>
                    <p style="font-size: 0.8rem; color: #666;">Si no creaste esta cuenta, ignora este mensaje.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
}
