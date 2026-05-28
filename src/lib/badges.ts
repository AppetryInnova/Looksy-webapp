import { prisma } from './prisma';

export type BadgeDefinition = {
    name: string;
    description: string;
    iconUrl: string;
    criteria: {
        type: 'scan_count' | 'event_created' | 'wardrobe_size' | 'harmony_score' | 'first_scan';
        value?: number;
    };
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    {
        name: 'First Steps',
        description: 'Realizaste tu primer scan de estilo',
        iconUrl: '👶',
        criteria: { type: 'first_scan' }
    },
    {
        name: 'Style Explorer',
        description: 'Completaste 10 scans',
        iconUrl: '🔍',
        criteria: { type: 'scan_count', value: 10 }
    },
    {
        name: 'Fashion Pro',
        description: 'Completaste 50 scans',
        iconUrl: '⭐',
        criteria: { type: 'scan_count', value: 50 }
    },
    {
        name: 'Style Master',
        description: 'Completaste 100 scans',
        iconUrl: '👑',
        criteria: { type: 'scan_count', value: 100 }
    },
    {
        name: 'Event Organizer',
        description: 'Creaste tu primer evento',
        iconUrl: '🎉',
        criteria: { type: 'event_created', value: 1 }
    },
    {
        name: 'Wardrobe Collector',
        description: 'Agregaste 20 prendas a tu ropero',
        iconUrl: '👕',
        criteria: { type: 'wardrobe_size', value: 20 }
    },
    {
        name: 'Perfect Harmony',
        description: 'Lograste un scan con 95% de armonía',
        iconUrl: '✨',
        criteria: { type: 'harmony_score', value: 95 }
    }
];

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
    const newBadges: string[] = [];

    // Get user's current badges
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { badges: true, scans: true, items: true, eventsCreated: true }
    });

    if (!user) return [];

    const currentBadgeNames = user.badges.map(b => b.name);

    for (const badgeDef of BADGE_DEFINITIONS) {
        // Skip if user already has this badge
        if (currentBadgeNames.includes(badgeDef.name)) continue;

        let shouldAward = false;

        switch (badgeDef.criteria.type) {
            case 'first_scan':
                shouldAward = user.scans.length >= 1;
                break;
            case 'scan_count':
                shouldAward = user.scans.length >= (badgeDef.criteria.value || 0);
                break;
            case 'event_created':
                shouldAward = user.eventsCreated.length >= (badgeDef.criteria.value || 0);
                break;
            case 'wardrobe_size':
                shouldAward = user.items.length >= (badgeDef.criteria.value || 0);
                break;
            case 'harmony_score':
                const maxScore = Math.max(...user.scans.map(s => s.harmonyScore), 0);
                shouldAward = maxScore >= (badgeDef.criteria.value || 0);
                break;
        }

        if (shouldAward) {
            // Find or create badge
            let badge = await prisma.badge.findUnique({
                where: { name: badgeDef.name }
            });

            if (!badge) {
                badge = await prisma.badge.create({
                    data: {
                        name: badgeDef.name,
                        description: badgeDef.description,
                        iconUrl: badgeDef.iconUrl,
                        criteria: JSON.stringify(badgeDef.criteria)
                    }
                });
            }

            // Award badge to user
            await prisma.user.update({
                where: { id: userId },
                data: {
                    badges: {
                        connect: { id: badge.id }
                    }
                }
            });

            newBadges.push(badge.name);
        }
    }

    return newBadges;
}

export async function getUserBadges(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { badges: true }
    });

    return user?.badges || [];
}

export async function getAllBadgesWithStatus(userId: string) {
    const userBadges = await getUserBadges(userId);
    const userBadgeNames = userBadges.map(b => b.name);

    return BADGE_DEFINITIONS.map(def => ({
        ...def,
        unlocked: userBadgeNames.includes(def.name)
    }));
}
