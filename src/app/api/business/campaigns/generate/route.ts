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

        const result = await generateCampaignContent(topic, locale || 'es');
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate campaign' }, { status: 500 });
    }
}
