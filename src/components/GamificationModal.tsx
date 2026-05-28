'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface GamificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type: 'level-up' | 'badge' | 'points';
    iconUrl?: string;
    imageUrl?: string;
}

const typeConfig = {
    'level-up': {
        emoji: '🚀',
        gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        glow: 'rgba(139, 92, 246, 0.4)',
        badge: 'NIVEL DESBLOQUEADO',
        badgeColor: '#8b5cf6',
    },
    'badge': {
        emoji: '🏆',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        glow: 'rgba(245, 158, 11, 0.4)',
        badge: 'NUEVO BADGE',
        badgeColor: '#f59e0b',
    },
    'points': {
        emoji: '✨',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        glow: 'rgba(16, 185, 129, 0.4)',
        badge: 'PUNTOS GANADOS',
        badgeColor: '#10b981',
    },
};

export default function GamificationModal({ isOpen, onClose, title, message, type, iconUrl, imageUrl }: GamificationModalProps) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const config = typeConfig[type];

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9000,
                padding: '24px',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.3s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '380px',
                    width: '100%',
                    textAlign: 'center',
                    padding: '40px 32px',
                    position: 'relative',
                    background: 'var(--glass-elevated)',
                    backdropFilter: 'blur(32px)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: `0 40px 80px -20px ${config.glow}, 0 0 0 1px rgba(255,255,255,0.06)`,
                    borderRadius: '32px',
                    overflow: 'hidden',
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                }}
            >
                {/* Ambient glow orb */}
                <div style={{
                    position: 'absolute',
                    top: '-40%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '200px',
                    height: '200px',
                    background: `radial-gradient(circle, ${config.glow}, transparent 70%)`,
                    pointerEvents: 'none',
                    zIndex: 0,
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Category badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: `${config.badgeColor}20`,
                        border: `1px solid ${config.badgeColor}40`,
                        color: config.badgeColor,
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        marginBottom: '24px',
                        fontFamily: 'var(--font-display)',
                    }}>
                        ✦ {config.badge}
                    </div>

                    {/* Icon / Image */}
                    {imageUrl ? (
                        <div style={{ marginBottom: '24px' }}>
                            <img
                                src={imageUrl}
                                alt="Reward"
                                style={{
                                    width: '100%',
                                    maxHeight: '180px',
                                    objectFit: 'contain',
                                    borderRadius: '20px',
                                    boxShadow: `0 16px 40px ${config.glow}`,
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{
                            fontSize: '5rem',
                            marginBottom: '24px',
                            display: 'block',
                            lineHeight: 1,
                            filter: `drop-shadow(0 8px 24px ${config.glow})`,
                            animation: 'modalBounce 1s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}>
                            {iconUrl ? (
                                <img src={iconUrl} alt="" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                            ) : config.emoji}
                        </div>
                    )}

                    {/* Title */}
                    <h2 style={{
                        fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
                        marginBottom: '12px',
                        background: config.gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                    }}>
                        {title}
                    </h2>

                    {/* Message */}
                    <p style={{
                        fontSize: '1rem',
                        color: 'hsl(var(--foreground) / 0.65)',
                        marginBottom: '32px',
                        lineHeight: 1.6,
                        maxWidth: '280px',
                        margin: '0 auto 32px',
                    }}>
                        {message}
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '16px',
                            background: config.gradient,
                            color: 'white',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-display)',
                            cursor: 'pointer',
                            boxShadow: `0 12px 30px -8px ${config.glow}`,
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={e => {
                            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)';
                        }}
                        onMouseLeave={e => {
                            (e.target as HTMLButtonElement).style.transform = 'none';
                        }}
                    >
                        ¡Genial! 🎉
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modalBounce {
                    0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
                    60% { transform: scale(1.15) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
            `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}
