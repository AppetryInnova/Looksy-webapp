import { NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { uploadLooksyMedia } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;

        // Subir directamente a Supabase Cloud Storage (looksy-media)
        const publicUrl = await uploadLooksyMedia(file, filename);

        if (!publicUrl) {
             return NextResponse.json({ error: 'Failed to upload file to cloud storage' }, { status: 500 });
        }

        // Devolvemos la URL publica final devuelta por la CDN de Supabase
        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        logger.error('Upload error in route handler:', error);
        return NextResponse.json({ error: 'Error processing upload request' }, { status: 500 });
    }
}
