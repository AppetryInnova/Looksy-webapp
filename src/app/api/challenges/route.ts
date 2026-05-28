import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChallenges } from '@/lib/gemini';
import logger from '@/lib/logger';

export async function GET() {
    try {
        // 1. Check for active challenges in DB
        const today = new Date();
        const activeChallenges = await prisma.challenge.findMany({
            where: {
                isActive: true,
                endDate: { gt: today }
            }
        });

        // 2. If we have enough active challenges, return them
        if (activeChallenges.length >= 3) {
            return NextResponse.json(activeChallenges);
        }

        // 3. Otherwise, generate new ones based on date context
        // Generate new challenges via AI

        const newChallengesData = await generateChallenges({
            date: today.toISOString()
        });

        if (!newChallengesData.length) {
            // Fallback if AI fails
            return NextResponse.json(activeChallenges);
        }

        // 4. Save new challenges to DB
        const createdChallenges = [];
        for (const data of newChallengesData) {
            const endDate = new Date();
            endDate.setDate(today.getDate() + 7); // 1 week duration

            const challenge = await prisma.challenge.create({
                data: {
                    title: data.title,
                    description: data.description,
                    difficulty: data.difficulty,
                    category: data.category,
                    xp: data.xp,
                    badgeName: data.badgeName,
                    rules: JSON.stringify(data.rules || []),
                    generatedByAI: true,
                    // Season is now implicit/not stored or we could extract it if needed, but for now we simplify
                    startDate: today,
                    endDate: endDate,
                }
            });
            createdChallenges.push(challenge);
        }

        return NextResponse.json([...activeChallenges, ...createdChallenges]);

    } catch (error) {
        logger.error("Error fetching challenges:", error);
        return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
    }
}
