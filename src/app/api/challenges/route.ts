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

        // 3. Otherwise, generate new ones via AI
        let newChallengesData;
        try {
            newChallengesData = await generateChallenges();
        } catch (aiErr: any) {
            logger.warn("AI Challenges generation failed, using default challenges:", aiErr.message);
            newChallengesData = [
                {
                    title: "Monocromático Chic 🖤",
                    description: "Vístete usando prendas de un solo color con diferentes texturas.",
                    difficulty: "EASY",
                    category: "STYLE",
                    xp: 150,
                    badgeName: "Monocromo",
                    rules: ["Todas las prendas principales del mismo color", "Accesorios permitidos de otro tono neutro"]
                },
                {
                    title: "Estampado Mix & Match 🎨",
                    description: "Combina dos estampados diferentes (ej. rayas y flores) con total confianza.",
                    difficulty: "MEDIUM",
                    category: "CREATIVITY",
                    xp: 250,
                    badgeName: "Mix Master",
                    rules: ["Usar al menos dos estampados distintos", "Mantener una paleta cromática coherente"]
                },
                {
                    title: "Vintage Vibe 🕰️",
                    description: "Arma un look inspirado en una década pasada (e.g. 70s, 80s o 90s).",
                    difficulty: "MEDIUM",
                    category: "VINTAGE",
                    xp: 200,
                    badgeName: "Time Traveler",
                    rules: ["Inspiración vintage clara", "Escribir la década inspirada en el comentario del post"]
                }
            ];
        }

        if (!newChallengesData || !newChallengesData.length) {
            // Fallback if AI fails and no defaults
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
