import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeImageCore } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('image') as File | null;
        const mode = formData.get('mode') as string | null;
        const locale = (formData.get('locale') as string) || 'es';
        const facialProfile = (formData.get('facialProfile') as string) || '';

        if (!file) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        if (!mode) {
            return NextResponse.json({ error: 'No analysis mode provided' }, { status: 400 });
        }

        // Convert the File object to base64 for the Gemini API
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';

        logger.info(`Running server-side Gemini analysis: Mode=${mode}, Locale=${locale}, Size=${buffer.length} bytes`);

        const result = await analyzeImageCore(
            base64Data,
            mimeType,
            mode as any,
            locale,
            '', // location context if any
            facialProfile
        );

        return NextResponse.json(result);
    } catch (error: any) {
        logger.error('Error in secure server-side image analysis:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze image' },
            { status: 500 }
        );
    }
}
