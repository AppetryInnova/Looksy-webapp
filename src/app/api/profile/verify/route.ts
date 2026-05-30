
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
        const { biometricData } = body; // Base64 data URI string

        if (!biometricData) {
            return NextResponse.json({ error: 'No biometric data provided' }, { status: 400 });
        }

        // Extract raw base64 from the data URI (e.g. "data:image/jpeg;base64,/9j/4AA...")
        const base64Data = biometricData.split(';base64,').pop();
        if (!base64Data) {
            return NextResponse.json({ error: 'Invalid biometric data format' }, { status: 400 });
        }

        // Run AI facial profile analysis on the server side (dynamic import keeps it server-only)
        const { analyzeImageCore } = await import('@/lib/gemini');
        const analysis = await analyzeImageCore(base64Data, 'image/jpeg', 'FACIAL_PROFILE');

        if (!analysis?.faceShape) {
            return NextResponse.json(
                { error: 'Could not detect facial features. Please use a clearer, well-lit photo.' },
                { status: 422 }
            );
        }

        // Build a feature string from the AI analysis results and hash it for uniqueness checks.
        // In a production system you would use proper face embedding vectors.
        const featureString = `${analysis.faceShape}-${analysis.skinTone}-${JSON.stringify(analysis.colorPalette || '')}`;

        // Simple but deterministic hash function
        let hash = 0;
        for (let i = 0; i < featureString.length; i++) {
            const char = featureString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        const biometricHash = 'bio_v1_' + Math.abs(hash).toString(16);

        // Check uniqueness — enforce one-account policy
        const existingUser = await prisma.user.findFirst({
            where: {
                biometricHash: biometricHash,
                NOT: { email: session.user.email } // Exclude the current user
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Identity validation failed: This face is associated with another account.' },
                { status: 409 }
            );
        }

        // Mark user as verified and award the "Verified Model" badge
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                isVerified: true,
                verificationLevel: 'BIOMETRIC',
                verifiedAt: new Date(),
                biometricHash: biometricHash,
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
