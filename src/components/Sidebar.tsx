'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link, usePathname } from '@/i18n/routing';
import logger from '@/lib/logger';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [userData, setUserData] = useState<{ username?: string, level?: string, avatarUrl?: string, stylePoints?: number } | null>(null);

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/profile')
                .then(res => res.json())
                .then(data => setUserData(data))
                .catch(err => logger.error('Error fetching profile:', err));
        }
    }, [status]);

    useEffect(() => {
        onClose();
    }, [pathname]);

    const displayName = userData?.username || session?.user?.name || 'Invitado';
    const displayLevel = userData?.level || 'New Face';
    const avatarUrl = userData?.avatarUrl || session?.user?.image || '';
    const stylePoints = userData?.stylePoints || 0;
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    const menuSections = [
        {
            label: 'Principal',
            items: [
                { icon: '🏠', label: 'Inicio', href: '/' },
                { icon: '✨', label: 'Análisis IA', href: '/scanner', badge: 'AI', badgeColor: '#10b981' },
                { icon: '👤', label: 'Análisis de Belleza', href: '/beauty-analysis', badge: 'NEW', badgeColor: '#8b5cf6' },
            ]
        },
        {
            label: 'Comunidad',
            items: [
                { icon: '👥', label: 'Comunidad', href: '/community' },
                { icon: '🏆', label: 'Challenges', href: '/challenges', badge: 'HOT', badgeColor: '#ef4444' },
                { icon: '📅', label: 'Eventos', href: '/events' },
            ]
        },
        {
            label: 'Mi Estilo',
            items: [
                { icon: '👕', label: 'Mi Ropero', href: '/wardrobe' },
                { icon: '🛍️', label: 'Marketplace', href: '/marketplace', badge: 'NEW', badgeColor: '#10b981' },
                { icon: '📍', label: 'Tiendas Cercanas', href: '/stores' },
            ]
        },
        {
            label: 'Profesional',
            items: [
                { icon: '🚀', label: 'Influencer Hub', href: '/influencer/dashboard', badge: 'PRO', badgeColor: '#a855f7' },
                { icon: '💼', label: 'Business Hub', href: '/business/analytics', badge: 'CORP', badgeColor: '#3b82f6' },
            ]
        },
        {
            label: 'Premium',
            items: [
                { icon: '💎', label: 'Upgrade a Elite', href: '/subscription', badge: 'PRO', badgeColor: '#f59e0b', isPremium: true },
            ]
        }
    ];

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1199,
                    }}
                />
            )}

            <aside
                className={`sidebar-desktop ${isOpen ? 'mobile-open' : ''}`}
                style={{
                    background: 'var(--glass-surface)',
                    backdropFilter: 'blur(32px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                    borderRight: '1px solid var(--glass-border)',
                    boxShadow: 'var(--shadow-premium)',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 20px 20px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/logo.png" alt="Looksy" style={{ height: '36px', objectFit: 'contain' }} />
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 900,
                                fontSize: '1.1rem',
                                background: 'linear-gradient(135deg, #10b981, #34d399)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                letterSpacing: '-0.03em',
                            }}>Looksy</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Gravity App</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="mobile-only-close"
                        style={{
                            background: 'var(--glass-border)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '10px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                    {menuSections.map((section) => (
                        <div key={section.label} style={{ marginBottom: '24px' }}>
                            <div style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                opacity: 0.45,
                                padding: '0 8px',
                                marginBottom: '6px',
                            }}>
                                {section.label}
                            </div>

                            {section.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            borderRadius: '14px',
                                            background: isActive
                                                ? 'hsla(160, 84%, 39%, 0.12)'
                                                : (item as any).isPremium
                                                    ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04))'
                                                    : 'transparent',
                                            color: isActive ? '#10b981' : 'inherit',
                                            fontWeight: isActive ? 700 : 500,
                                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                            fontSize: '0.9rem',
                                            textDecoration: 'none',
                                            border: isActive
                                                ? '1px solid rgba(16,185,129,0.2)'
                                                : (item as any).isPremium
                                                    ? '1px solid rgba(245,158,11,0.15)'
                                                    : '1px solid transparent',
                                            marginBottom: '2px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                fontSize: '1.15rem',
                                                width: '28px',
                                                textAlign: 'center',
                                                filter: isActive ? 'none' : 'saturate(0.7)',
                                                transition: 'filter 0.2s ease',
                                            }}>{item.icon}</span>
                                            <span style={{ fontFamily: 'var(--font-sans)' }}>{item.label}</span>
                                        </div>
                                        {item.badge && (
                                            <span style={{
                                                fontSize: '0.6rem',
                                                padding: '3px 7px',
                                                borderRadius: '999px',
                                                background: item.badgeColor,
                                                color: 'white',
                                                fontWeight: 800,
                                                letterSpacing: '0.05em',
                                                boxShadow: `0 2px 8px ${item.badgeColor}55`,
                                            }}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User Profile Footer */}
                <div style={{
                    padding: '16px',
                    borderTop: '1px solid var(--glass-border)',
                    background: 'var(--glass-surface)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--glass-border)',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 800,
                            overflow: 'hidden',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                            border: '2px solid rgba(16, 185, 129, 0.3)',
                        }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '1rem' }}>{initials || '?'}</span>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontFamily: 'var(--font-display)',
                            }}>{displayName}</div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '2px',
                            }}>
                                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>{displayLevel}</span>
                                <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>·</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{stylePoints.toLocaleString()} pts</span>
                            </div>
                        </div>

                        {/* Settings Link */}
                        <Link href="/profile" style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '10px',
                            background: 'var(--glass-surface)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '1rem',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                        }}>
                            ⚙️
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
