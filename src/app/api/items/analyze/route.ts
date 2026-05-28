import { NextResponse } from 'next/server';
import { identifyGarment } from '@/lib/gemini';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        const result = await identifyGarment(base64Data, file.type);

        return NextResponse.json(result);
    } catch (error) {
        logger.error('Error in item analysis API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
