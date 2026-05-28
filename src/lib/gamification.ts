
export const BADGES = [
    {
        name: 'Trendsetter',
        description: 'Create 5 outfits',
        iconUrl: 'https://api.iconify.design/lucide:shirt.svg?color=%23FFD700',
        criteria: { type: 'count', field: 'items', threshold: 5 }
    },
    {
        name: 'Social Butterfly',
        description: 'Attend 3 events',
        iconUrl: 'https://api.iconify.design/lucide:party-popper.svg?color=%23FF69B4',
        criteria: { type: 'count', field: 'eventsAttending', threshold: 3 }
    },
    {
        name: 'Visionary',
        description: 'Scan 10 items',
        iconUrl: 'https://api.iconify.design/lucide:scan-eye.svg?color=%2300CED1',
        criteria: { type: 'count', field: 'scans', threshold: 10 }
    }
];

export function calculateLevel(points: number): string {
    if (points >= 1000) return 'Fashion Icon';
    if (points >= 500) return 'Trend Hunter';
    if (points >= 200) return 'Style Enthusiast';
    return 'New Face';
}

export function getNextLevelThreshold(points: number): number {
    if (points >= 1000) return 2000; // Cap or next tier
    if (points >= 500) return 1000;
    if (points >= 200) return 500;
    return 200;
}

export function checkBadgeUnlocks(userCounts: { items: number; scans: number; eventsAttending: number }) {
    return BADGES.filter(badge => {
        const { field, threshold } = badge.criteria as any;
        return userCounts[field as keyof typeof userCounts] >= threshold;
    });
}
