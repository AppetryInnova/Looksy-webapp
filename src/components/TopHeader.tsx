'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getNextLevelThreshold } from '@/lib/gamification';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import logger from '@/lib/logger';
import styles from './TopHeader.module.css';
import GetTokensModal from './GetTokensModal';
import { FaBolt } from 'react-icons/fa';

const TopHeader = ({ onMenuToggle }: { onMenuToggle: () => void }) => {
    const { data: session, status } = useSession();
    const t = useTranslations('Header');
    const router = useRouter();
    const locale = useLocale();
    const [userData, setUserData] = useState<{ stylePoints: number, level: string, currentStreak?: number, gravityTokens?: number } | null>(null);
    const [showTierDetails, setShowTierDetails] = useState(false);
    const [showGetTokensModal, setShowGetTokensModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const tierRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/profile')
                .then(res => res.json())
                .then(data => setUserData(data))
                .catch(err => logger.error('Error fetching profile for header:', err));
        }
    }, [status]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tierRef.current && !tierRef.current.contains(e.target as Node)) {
                setShowTierDetails(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const nextLevelPoints = userData ? getNextLevelThreshold(userData.stylePoints) : 0;
    const progress = userData ? Math.min((userData.stylePoints / nextLevelPoints) * 100, 100) : 0;

    const levelColors: Record<string, string> = {
        'New Face': '#64748b',
        'Trend Hunter': '#10b981',
        'Style Icon': '#8b5cf6',
        'Fashion Elite': '#f59e0b',
        'Looksy Legend': '#ef4444',
    };
    const levelColor = levelColors[userData?.level || 'New Face'] || '#10b981';

    return (
        <>
        <header
            className={styles.topHeader}
            style={{
                boxShadow: isScrolled ? 'var(--shadow-md)' : 'none',
            }}
        >
            {/* Left: Menu + Search */}
            <div className={styles.leftSection}>
                <button
                    className={styles.menuBtn}
                    onClick={onMenuToggle}
                    aria-label="Toggle Menu"
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.4rem',
                        cursor: 'pointer',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                    }}
                >
                    ☰
                </button>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <span className={styles.searchIcon} style={{ fontSize: '0.95rem', opacity: 0.5 }}>🔍</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className={styles.rightSection}>
                {/* Streak Badge */}
                {(userData?.currentStreak ?? 0) > 0 && (
                    <div className={styles.streakBadge}>
                        <span>🔥</span>
                        <span>{userData?.currentStreak}</span>
                    </div>
                )}

                {/* Token Store Button */}
                <button
                    className={styles.iconBtn}
                    onClick={() => setShowGetTokensModal(true)}
                    aria-label="Get Tokens"
                    style={{ 
                        border: 'none', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem'
                    }}
                >
                    <FaBolt /> {userData?.gravityTokens ?? 5}
                </button>

                {/* Notification Bell */}
                <button
                    className={styles.iconBtn}
                    onClick={() => router.push(`/${locale}/notifications`)}
                    aria-label="Notifications"
                    style={{ border: 'none', cursor: 'pointer', background: 'none' }}
                >
                    🔔
                </button>

                {/* Level / Tier Badge with Dropdown */}
                <div
                    className={styles.tierWrapper}
                    ref={tierRef}
                    style={{ position: 'relative' }}
                    onClick={() => setShowTierDetails(prev => !prev)}
                >
                    <div
                        className={styles.tierBadge}
                        style={{
                            background: `${levelColor}15`,
                            color: levelColor,
                            border: `1px solid ${levelColor}30`,
                            boxShadow: `0 4px 12px ${levelColor}20`,
                        }}
                    >
                        <span>✦</span>
                        <span>{userData?.level || 'New Face'}</span>
                    </div>

                    {showTierDetails && userData && (
                        <div className={styles.tierDropdown}>
                            <div className={styles.progressTitle}>{t('rankProgress')}</div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px',
                                fontSize: '1.5rem',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 900,
                            }}>
                                {userData.stylePoints.toLocaleString()}
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 500 }}>pts</span>
                            </div>
                            <div className={styles.progressBarContainer}>
                                <div
                                    className={styles.progressBarFill}
                                    style={{
                                        width: `${progress}%`,
                                        background: `linear-gradient(90deg, ${levelColor}, ${levelColor}cc)`,
                                    }}
                                />
                            </div>
                            <div className={styles.progressStats}>
                                <span style={{ color: levelColor, fontWeight: 700 }}>{userData.level}</span>
                                <span>{nextLevelPoints.toLocaleString()} {t('next')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
        <GetTokensModal isOpen={showGetTokensModal} onClose={() => setShowGetTokensModal(false)} />
        </>
    );
};

export default TopHeader;
