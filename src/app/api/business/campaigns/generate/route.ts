import { NextResponse } from 'next/server';
import { generateCampaignContent } from '@/lib/gemini';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { topic, locale } = await req.json();
        if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

        let result;
        try {
            result = await generateCampaignContent(topic, locale || 'es');
        } catch (aiErr: any) {
            console.error("Gemini campaign generation failed, using fallback:", aiErr);
            result = {
                title: `Campaña Especial: ${topic}`,
                subjectLine: `¡Descubre lo nuevo en ${topic} de Looksy!`,
                description: `Te presentamos nuestra última colección inspirada en ${topic}. Una propuesta única diseñada para destacar y elevar tu estilo diario con el toque exclusivo de Looksy.`,
                callToAction: "Ver Colección",
                socialMediaPosts: [
                    `¡Llegó la hora de renovar tu clóset! Descubre las piezas inspiradas en ${topic} que marcan tendencia esta temporada. ✨ #LooksyStyle #${topic.replace(/\s+/g, '')}`,
                    `Exclusividad, diseño y estilo en un solo lugar. Conoce la colección ${topic} en Looksy. 🛍️ #Looksy #TrendAlert`
                ]
            };
        }
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process campaign generation request' }, { status: 500 });
    }
}
