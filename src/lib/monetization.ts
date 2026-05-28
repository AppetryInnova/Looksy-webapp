/**
 * Progressive Monetization Configuration & Utilities
 * 
 * Strategy:
 * - Phase 1 (FREE): Months 0-6 - Everything free for everyone
 * - Phase 2 (SOFT): Months 7-9 - Soft limits with friendly warnings
 * - Phase 3 (FULL): Month 10+ - Full monetization with Early Adopter benefits
 */

// App launch date (today)
export const APP_LAUNCH_DATE = new Date('2026-01-08T00:00:00Z');

// Monetization starts 6 months after launch
export const MONETIZATION_START_DATE = new Date('2026-07-08T00:00:00Z');

// Soft limit phase starts (warnings but no blocks)
export const SOFT_LIMIT_START_DATE = new Date('2026-07-08T00:00:00Z');

// Full monetization starts
export const FULL_MONETIZATION_DATE = new Date('2026-10-08T00:00:00Z');

export type MonetizationPhase = 'FREE' | 'SOFT' | 'FULL';

/**
 * Get the current monetization phase
 */
export function getMonetizationPhase(): MonetizationPhase {
    const now = new Date();

    if (now < SOFT_LIMIT_START_DATE) {
        return 'FREE';
    } else if (now < FULL_MONETIZATION_DATE) {
        return 'SOFT';
    } else {
        return 'FULL';
    }
}

/**
 * Check if monetization is currently active
 */
export function isMonetizationActive(): boolean {
    return getMonetizationPhase() !== 'FREE';
}

/**
 * Check if a user is an Early Adopter
 * Early Adopters are users who registered before monetization started
 */
export function isEarlyAdopter(userCreatedAt: Date): boolean {
    return userCreatedAt < MONETIZATION_START_DATE;
}

/**
 * Get Early Adopter benefits
 */
export function getEarlyAdopterBenefits() {
    return {
        discountPercentage: 50,
        badge: 'Early Adopter 🌟',
        accessToNewFeatures: true,
        generousLimits: true
    };
}

/**
 * Check if limits should be enforced for a given user
 */
export function shouldEnforceLimits(userCreatedAt: Date, isPremium: boolean = false): boolean {
    const phase = getMonetizationPhase();

    // During FREE phase, no limits for anyone
    if (phase === 'FREE') {
        return false;
    }

    // Premium users never have limits
    if (isPremium) {
        return false;
    }

    // During SOFT phase, show warnings but don't enforce
    if (phase === 'SOFT') {
        return false;
    }

    // During FULL phase, enforce limits (but Early Adopters get more generous limits)
    return true;
}

/**
 * Get usage limits based on user status
 */
export function getUsageLimits(userCreatedAt: Date, isPremium: boolean = false) {
    const phase = getMonetizationPhase();
    const earlyAdopter = isEarlyAdopter(userCreatedAt);

    // Premium users have unlimited access
    if (isPremium) {
        return {
            scansPerDay: Infinity,
            beautyAnalysisPerDay: Infinity,
            unlimited: true
        };
    }

    // During FREE phase, everyone has unlimited
    if (phase === 'FREE') {
        return {
            scansPerDay: Infinity,
            beautyAnalysisPerDay: Infinity,
            unlimited: true
        };
    }

    // Early Adopters get more generous limits
    if (earlyAdopter) {
        return {
            scansPerDay: 10,
            beautyAnalysisPerDay: 5,
            unlimited: false
        };
    }

    // Regular free users get standard limits
    return {
        scansPerDay: 3,
        beautyAnalysisPerDay: 1,
        unlimited: false
    };
}
