import { describe, it, expect } from 'vitest';
import { calculateLevel, getNextLevelThreshold, checkBadgeUnlocks } from '../../src/lib/gamification';

describe('Gamification Logic', () => {
    describe('calculateLevel', () => {
        it('returns "New Face" for points < 200', () => {
            expect(calculateLevel(0)).toBe('New Face');
            expect(calculateLevel(199)).toBe('New Face');
        });

        it('returns "Style Enthusiast" for 200 <= points < 500', () => {
            expect(calculateLevel(200)).toBe('Style Enthusiast');
            expect(calculateLevel(499)).toBe('Style Enthusiast');
        });

        it('returns "Trend Hunter" for 500 <= points < 1000', () => {
            expect(calculateLevel(500)).toBe('Trend Hunter');
            expect(calculateLevel(999)).toBe('Trend Hunter');
        });

        it('returns "Fashion Icon" for points >= 1000', () => {
            expect(calculateLevel(1000)).toBe('Fashion Icon');
            expect(calculateLevel(5000)).toBe('Fashion Icon');
        });
    });

    describe('getNextLevelThreshold', () => {
        it('returns 200 for points < 200', () => {
            expect(getNextLevelThreshold(0)).toBe(200);
            expect(getNextLevelThreshold(199)).toBe(200);
        });

        it('returns 500 for 200 <= points < 500', () => {
            expect(getNextLevelThreshold(200)).toBe(500);
            expect(getNextLevelThreshold(499)).toBe(500);
        });

        it('returns 1000 for 500 <= points < 1000', () => {
            expect(getNextLevelThreshold(500)).toBe(1000);
            expect(getNextLevelThreshold(999)).toBe(1000);
        });

        it('returns 2000 for points >= 1000', () => {
            expect(getNextLevelThreshold(1000)).toBe(2000);
        });
    });

    describe('checkBadgeUnlocks', () => {
        it('unlocks nothing if criteria are not met', () => {
            const unlocked = checkBadgeUnlocks({ items: 0, scans: 0, eventsAttending: 0 });
            expect(unlocked.length).toBe(0);
        });

        it('unlocks Trendsetter for 5 items', () => {
            const unlocked = checkBadgeUnlocks({ items: 5, scans: 0, eventsAttending: 0 });
            expect(unlocked).toContainEqual(expect.objectContaining({ name: 'Trendsetter' }));
            expect(unlocked.length).toBe(1);
        });

        it('unlocks Social Butterfly for 3 events', () => {
            const unlocked = checkBadgeUnlocks({ items: 0, scans: 0, eventsAttending: 3 });
            expect(unlocked).toContainEqual(expect.objectContaining({ name: 'Social Butterfly' }));
            expect(unlocked.length).toBe(1);
        });

        it('unlocks Visionary for 10 scans', () => {
            const unlocked = checkBadgeUnlocks({ items: 0, scans: 10, eventsAttending: 0 });
            expect(unlocked).toContainEqual(expect.objectContaining({ name: 'Visionary' }));
            expect(unlocked.length).toBe(1);
        });

        it('unlocks multiple badges if multiple criteria are met', () => {
            const unlocked = checkBadgeUnlocks({ items: 6, scans: 15, eventsAttending: 4 });
            expect(unlocked.length).toBe(3);
        });
    });
});
