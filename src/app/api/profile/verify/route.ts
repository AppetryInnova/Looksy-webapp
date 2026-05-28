
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { biometricData } = body; // Base64 string

        if (!biometricData) {
            return NextResponse.json({ error: 'No biometric data provided' }, { status: 400 });
        }

        // Convert Base64 to Buffer/Blob for Gemini
        // Data URL format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        const base64Data = biometricData.split(';base64,').pop();
        const buffer = Buffer.from(base64Data, 'base64');

        // Create a Mock File object compatible with analyzeImage
        const file = {
            arrayBuffer: async () => buffer,
            type: 'image/jpeg'
        } as unknown as File;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('facialProfile', 'Verify this is a real human face and analyzing features for ID.');

        // Call Gemini for real analysis
        // This will THROW if it fails or if the image is not valid/flagged
        const analysis = await import('@/lib/gemini').then(m => m.analyzeImage(formData, 'FACIAL_PROFILE'));

        if (!analysis || !analysis.faceShape) {
            return NextResponse.json({ error: 'Verification failed: Face not clearly detected.' }, { status: 422 });
        }

        // Generate a deterministic hash based on the AI's analysis of features (Simulated "FaceID")
        // In a real high-security app, we'd use vector embeddings. 
        // Here we hash the classified features to ensure basic uniqueness/consistency check.
        const featureString = `${analysis.faceShape}-${analysis.skinTone}-${JSON.stringify(analysis.colorPalette)}`;

        // Simple hash function for demo
        let hash = 0;
        for (let i = 0; i < featureString.length; i++) {
            const char = featureString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const biometricHash = 'bio_v1_' + Math.abs(hash).toString(16);

        // Check uniqueness (Real one-account policy enforcement)
        const existingUser = await prisma.user.findFirst({
            where: {
                biometricHash: biometricHash,
                NOT: { email: session.user.email } // Exclude self
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Identity validation failed: This face is associated with another account.' }, { status: 409 });
        }

        // Logic to verify user
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                isVerified: true,
                verificationLevel: 'BIOMETRIC',
                verifiedAt: new Date(),
                biometricHash: biometricHash,
                // Award "Verified Model" badge if not exists
                badges: {
                    connectOrCreate: {
                        where: { name: 'Verified Model' },
                        create: {
                            name: 'Verified Model',
                            description: 'Identity verified via biometric scan.',
                            iconUrl: '/badges/verified_face.png',
                            criteria: 'Complete facial verification.'
                        }
                    }
                }
            },
            include: {
                badges: true
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: 'Identity verified successfully with AI analysis.'
        });

    } catch (error) {
        logger.error('Verification error:', error);
        return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
    }
}
