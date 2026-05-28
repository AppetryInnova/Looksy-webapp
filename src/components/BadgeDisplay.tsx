'use client';

import { useState } from 'react';

type Badge = {
    name: string;
    description: string;
    iconUrl: string;
    unlocked: boolean;
};

type BadgeDisplayProps = {
    badges: Badge[];
};

export default function BadgeDisplay({ badges }: BadgeDisplayProps) {
    const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

    if (badges.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-dim)' }}>
                <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>
                    No tienes insignias aún
                </p>
                <p style={{ fontSize: '0.9rem' }}>
                    ¡Completa desafíos para desbloquear insignias!
                </p>
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '16px',
            padding: '20px 0'
        }}>
            {badges.map((badge) => (
                <div
                    key={badge.name}
                    onMouseEnter={() => setHoveredBadge(badge.name)}
                    onMouseLeave={() => setHoveredBadge(null)}
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '16px',
                        borderRadius: '12px',
                        background: badge.unlocked
                            ? 'var(--gradient-primary)'
                            : 'var(--color-surface)',
                        opacity: badge.unlocked ? 1 : 0.4,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        transform: hoveredBadge === badge.name ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: badge.unlocked && hoveredBadge === badge.name
                            ? '0 8px 20px rgba(16, 185, 129, 0.4)'
                            : 'none'
                    }}
                >
                    {/* Badge Icon */}
                    <div style={{
                        fontSize: '2.5rem',
                        marginBottom: '8px',
                        filter: badge.unlocked ? 'none' : 'grayscale(100%)'
                    }}>
                        {badge.iconUrl}
                    </div>

                    {/* Badge Name */}
                    <p style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        color: badge.unlocked ? '#fff' : 'var(--color-text-dim)',
                        margin: 0
                    }}>
                        {badge.name}
                    </p>

                    {/* Lock Icon for Locked Badges */}
                    {!badge.unlocked && (
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            fontSize: '1rem'
                        }}>
                            🔒
                        </div>
                    )}

                    {/* Tooltip */}
                    {hoveredBadge === badge.name && (
                        <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '8px',
                            padding: '8px 12px',
                            background: 'var(--color-surface-elevated)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-xl)',
                            whiteSpace: 'nowrap',
                            fontSize: '0.8rem',
                            zIndex: 10,
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            {badge.description}
                            {/* Tooltip Arrow */}
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid var(--color-border)'
                            }} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
