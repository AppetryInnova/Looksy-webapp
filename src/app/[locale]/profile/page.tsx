'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from '@/i18n/routing';
import { getNextLevelThreshold } from '@/lib/gamification';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import VerificationModal from '@/components/VerificationModal';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
import { motion } from 'framer-motion';
import posthog from 'posthog-js';
import DigitalTwinOnboarding from '@/components/DigitalTwinOnboarding';


import styles from './profile.module.css';

type UserProfile = {
    username: string;
    avatarUrl: string | null;
    isVerified?: boolean;
    verificationLevel?: string;
    level: string;
    stylePoints: number;
    badges: { id: string; name: string; iconUrl: string; description: string }[];
    _count: {
        items: number;
        scans: number;
        eventsAttending: number;
    };
    bio?: string | null;
    pronouns?: string | null;
    location?: string | null;
    coverPhotoUrl?: string | null;
    subscription?: { plan: string; status: string } | null;
    createdAt?: Date | string;
    isInfluencer?: boolean;
    baseModelUrl?: string | null;
    twinBackground?: string | null;
};


export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const t = useTranslations('ProfilePage');
    const tCommon = useTranslations('Common');

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        username: '',
        avatarUrl: '',
        bio: '',
        pronouns: '',
        location: '',
        coverPhotoUrl: ''
    });

    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const handleVerificationSuccess = (updatedUser: Record<string, unknown>) => {
        setUser(prev => prev ? { ...prev, ...updatedUser } : null);
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/profile')
                .then((res) => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to fetch profile');
                })
                .then((data) => setUser(data))
                .catch(err => logger.error('Error fetching profile:', err));
        }
    }, [status]);

    useEffect(() => {
        if (user) {
            setEditForm({
                username: user.username || '',
                avatarUrl: user.avatarUrl || '',
                bio: user.bio || '',
                pronouns: user.pronouns || '',
                location: user.location || '',
                coverPhotoUrl: user.coverPhotoUrl || ''
            });
        }
    }, [user]);

    if (!mounted) return null;

    if (status === 'loading') return <p className={styles.loading}>{t('loadingSession')}</p>;

    if (status === 'unauthenticated') {
        return (
            <main className={styles.unauthContainer}>
                <h1 className={styles.unauthTitle}>{t('welcome')}</h1>
                <p className={styles.unauthText}>{t('loginText')}</p>
                <button
                    onClick={() => signIn('google')}
                    className={styles.loginButton}
                >
                    {t('loginGoogle')}
                </button>
            </main>
        );
    }

    if (!user) return <p className={styles.loading}>{t('loadingProfile')}</p>;

    // Level calculation logic could be here or backend
    const nextLevelPoints = getNextLevelThreshold(user.stylePoints);
    const progress = (user.stylePoints / nextLevelPoints) * 100;

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(prev => prev ? { ...prev, ...updatedUser } : null);
                setIsEditing(false);
            } else {
                alert(t('updateError'));
            }
        } catch (error) {
            logger.error('Error saving profile:', error);
            alert(t('updateError'));
        }
    };

    return (
        <main className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerControls}>
                    <button onClick={() => setIsEditing(true)} className={`btn-secondary ${styles.controlButton}`}>
                        {t('edit')}
                    </button>
                    <button onClick={() => router.push('/settings')} className={`btn-secondary ${styles.controlButton}`}>
                        ⚙️ {t('settings')}
                    </button>
                    <button onClick={() => signOut()} className={`btn-secondary ${styles.controlButton}`}>
                        {t('logout')}
                    </button>
                </div>

                <div className={styles.avatarContainer}>
                    <div className={styles.avatarInner}>
                        {(user.avatarUrl || session?.user?.image) && (
                            <img src={user.avatarUrl || session?.user?.image || ''} alt={user.username} className={styles.avatarImage} />
                        )}
                    </div>
                </div>

                <div className={styles.usernameWrapper}>
                    <h1 className={styles.username}>
                        {user.username || session?.user?.name}
                    </h1>
                    {user.isVerified && (
                        <div title={t('verifiedTitle')} className={styles.verifiedBadge}>
                            ✓
                        </div>
                    )}
                </div>

                <motion.div
                    className={styles.levelBadge}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.8, delay: 0.2 }}
                    whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0], transition: { duration: 0.3 } }}
                >
                    {user.level}
                </motion.div>

                <div className={styles.headerBadges}>
                    {/* Subscription Badge */}
                    <motion.button
                        onClick={() => router.push('/subscription')}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`${styles.badgeLink} ${user.subscription?.plan === 'ELITE' ? styles.eliteBadge : ''}`}
                    >
                        {user.subscription?.plan === 'ELITE' ? '💎 ELITE' : '☁️ FREE'}
                    </motion.button>

                    {/* Early Adopter Badge */}
                    {(() => {
                        const MONETIZATION_START = new Date('2026-07-08T00:00:00Z');
                        const isEarlyAdopter = user.createdAt && new Date(user.createdAt) < MONETIZATION_START;
                        return isEarlyAdopter && (
                            <motion.div
                                title={t('earlyAdopter')}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.4 }}
                                className={styles.earlyAdopterBadge}
                            >
                                <motion.span
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                                >
                                    🌟
                                </motion.span>
                                Early Adopter
                            </motion.div>
                        );
                    })()}
                </div>

                <div className={styles.settingsRow}>
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                </div>
            </header>

            {/* Bento Grid */}
            <div className={styles.bentoGrid}>

                <div
                    className={`card ${styles.verificationCard}`}
                    style={{
                        gridColumn: 'span 12',
                        background: user.isVerified
                            ? 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,120,255,0.1))'
                            : 'rgba(30,30,30,0.8)',
                        border: user.isVerified ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '24px',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        borderRadius: '24px',
                        transition: 'all 0.3s ease',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}
                    onClick={() => !user.isVerified && setShowVerificationModal(true)}
                >
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, minWidth: '200px' }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%',
                            background: user.isVerified ? '#00ff88' : 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', color: user.isVerified ? '#000' : '#fff',
                            boxShadow: user.isVerified ? '0 0 20px rgba(0,255,136,0.4)' : 'none',
                            flexShrink: 0
                        }}>
                            {user.isVerified ? '✓' : '🛡️'}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                                {user.isVerified ? t('verifiedTitle') : t('identityVerification')}
                            </h3>
                            <p style={{ margin: '6px 0 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                                {user.isVerified
                                    ? t('verifiedText')
                                    : t('unverifiedText')}
                            </p>
                        </div>
                    </div>
                    {!user.isVerified && (
                        <button className="btn-primary" style={{ padding: '12px 32px', fontSize: '1rem', fontWeight: 'bold', minWidth: '140px' }}>
                            {t('verify')}
                        </button>
                    )}
                </div>

                {/* Level Progress - Large Card */}
                <div className={`card ${styles.levelCard}`}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h3 className={styles.cardTitle}>{t('styleLevel')}</h3>
                        <div className={styles.pointsContainer}>
                            <span>{user.stylePoints} <span className={styles.pointsLabel}>{tCommon('points')}</span></span>
                            <span style={{ color: 'var(--color-text-dim)' }}>{nextLevelPoints} <span style={{ fontSize: '0.8rem' }}>{tCommon('next')}</span></span>
                        </div>
                        <div className={styles.progressBarContainer}>
                            <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className={styles.levelDescription}>
                            {t('levelLocked')}
                        </p>
                    </div>
                </div>

                {/* Business Hub Access */}
                {user._count.items === 0 && ( // Just an example condition, should really be based on a 'role' or 'hasStore'
                    <div
                        className={`card ${styles.businessCard}`}
                        onClick={() => {
                            posthog.capture('business_hub_clicked');
                            router.push('/business');
                        }}
                        style={{
                            gridColumn: 'span 12',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            padding: '24px',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            color: 'white',
                            marginTop: '16px'
                        }}
                    >
                        <div style={{ fontSize: '2.5rem' }}>🏪</div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Business Hub</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                                Gestiona tus tiendas, campañas y contrata influencers.
                            </p>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '1.5rem' }}>→</div>
                    </div>
                )}

                {/* Influencer Hub Access - Always visible for discovery */}

                    <div
                        className={`card ${styles.influencerCard}`}
                        onClick={() => {
                            posthog.capture('influencer_hub_clicked');
                            router.push('/influencer/dashboard');
                        }}
                        style={{
                            gridColumn: 'span 12',
                            background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                            padding: '24px',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            color: 'white',
                            marginTop: '16px'
                        }}
                    >
                        <div style={{ fontSize: '2.5rem' }}>🌟</div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Influencer Hub</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                                {user.isInfluencer 
                                    ? 'Gestiona tus campañas y monetiza tu estilo.' 
                                    : (user.stylePoints > 1000 
                                        ? '¡Eres elegible para campañas! Conecta tus redes.' 
                                        : 'Monetiza tu estilo. Mira los requisitos para ser Influencer.')}
                            </p>
                        </div>
                </div>


                {/* Digital Twin Setup */}
                <div style={{ gridColumn: 'span 12', marginTop: '16px', marginBottom: '16px' }}>
                    <DigitalTwinOnboarding 
                        initialBaseModelUrl={user.baseModelUrl}
                        initialTwinBackground={user.twinBackground}
                        onComplete={async () => {
                            fetch('/api/profile')
                                .then((res) => {
                                    if (res.ok) return res.json();
                                    throw new Error('Failed to fetch profile');
                                })
                                .then((data) => setUser(data))
                                .catch(err => logger.error('Error fetching profile after twin update:', err));
                        }}
                    />
                </div>

                {/* Stats - Small Cards */}

                <div className={`card ${styles.statCard}`}>
                    <h2 className={styles.statValue}>{user._count.items}</h2>
                    <p className={styles.statLabel}>{t('items')}</p>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <h2 className={styles.statValue}>{user._count.scans}</h2>
                    <p className={styles.statLabel}>{t('scans')}</p>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <h2 className={styles.statValue}>{user._count.eventsAttending}</h2>
                    <p className={styles.statLabel}>{t('events')}</p>
                </div>

                {/* Badges - Medium Card */}
                {user.badges && user.badges.length > 0 && (
                    <div className={`card ${styles.badgesCard}`}>
                        <h3 className={styles.cardTitle}>{t('badges')}</h3>
                        <div className={styles.badgesContainer}>
                            {user.badges.map((badge: { id: string, name: string, description?: string, iconUrl?: string }) => (
                                <div
                                    key={badge.id}
                                    className={styles.badgeItem}
                                    title={badge.description} // Simple tooltip
                                    style={{ cursor: 'help' }}
                                >
                                    <div className={styles.badgeIcon} style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                        padding: '10px',
                                        marginBottom: '8px',
                                        transition: 'transform 0.2s'
                                    }}>
                                        <img src={badge.iconUrl} alt={badge.name} className={styles.badgeImage} style={{ width: '32px', height: '32px' }} />
                                    </div>
                                    <p className={styles.badgeName} style={{ fontSize: '0.8rem', fontWeight: 600 }}>{badge.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className={styles.modalOverlay}>
                    <form onSubmit={handleSaveProfile} className={`card ${styles.modalContent}`}>
                        <h3 className={styles.modalTitle}>{t('editProfileTitle')}</h3>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('username')}</label>
                            <input
                                type="text"
                                value={editForm.username}
                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                className={styles.input}
                                maxLength={30}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('bio')}</label>
                            <textarea
                                value={editForm.bio || ''}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                className={styles.textarea}
                                placeholder={t('bioPlaceholder')}
                                maxLength={150}
                                style={{ minHeight: '80px' }}
                            />
                            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                                {(editForm.bio || '').length}/150
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('pronouns')}</label>
                            <input
                                type="text"
                                value={editForm.pronouns || ''}
                                onChange={(e) => setEditForm({ ...editForm, pronouns: e.target.value })}
                                className={styles.input}
                                placeholder={t('pronounsPlaceholder')}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('location')}</label>
                            <input
                                type="text"
                                value={editForm.location || ''}
                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                className={styles.input}
                                placeholder={t('locationPlaceholder')}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('avatarUrl')}</label>
                            <input
                                type="text"
                                value={editForm.avatarUrl}
                                onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                                placeholder="https://..."
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('coverPhotoUrl')}</label>
                            <input
                                type="text"
                                value={editForm.coverPhotoUrl || ''}
                                onChange={(e) => setEditForm({ ...editForm, coverPhotoUrl: e.target.value })}
                                placeholder="https://..."
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.buttonGroup}>
                            <button type="submit" className={`btn-primary ${styles.saveButton}`}>{tCommon('save')}</button>
                            <button type="button" className={`btn-secondary ${styles.cancelButton}`} onClick={() => setIsEditing(false)}>{tCommon('cancel')}</button>
                        </div>
                    </form>
                </div>
            )}

            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onSuccess={handleVerificationSuccess}
            />
        </main>
    );
}
