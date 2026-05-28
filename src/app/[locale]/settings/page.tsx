'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import styles from './settings.module.css';
import { logger } from '@/lib/logger';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '@/lib/push-notifications';

type SettingsData = {
    emailNotifications: boolean;
    pushNotifications: boolean;
    notifyLikes: boolean;
    notifyComments: boolean;
    notifyFollows: boolean;
    notifyEvents: boolean;
    notifyBattles: boolean;
    notifyRecommendations: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
    textSize: string;
    privacySettings?: string;
    bio?: string;
    pronouns?: string;
    location?: string;
};

export default function SettingsPage() {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const t = useTranslations('SettingsPage');
    const tCommon = useTranslations('Common');
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>('account');
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushSupported, setPushSupported] = useState(false);

    // Settings state
    const [settings, setSettings] = useState<SettingsData>({
        emailNotifications: true,
        pushNotifications: true,
        notifyLikes: true,
        notifyComments: true,
        notifyFollows: true,
        notifyEvents: true,
        notifyBattles: true,
        notifyRecommendations: true,
        reducedMotion: false,
        highContrast: false,
        textSize: 'medium',
    });

    // Profile editing
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        username: '',
        bio: '',
        pronouns: '',
        location: '',
    });

    useEffect(() => {
        setMounted(true);
        fetchSettings();
        // Check push support and subscription status
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPushSupported(true);
            isPushSubscribed().then(setPushSubscribed);
        }
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, ...data }));
                setProfileData({
                    username: data.username || '',
                    bio: data.bio || '',
                    pronouns: data.pronouns || '',
                    location: data.location || '',
                });
            }
        } catch (error) {
            logger.error('Error fetching settings:', error);
        }
    };

    const updateSetting = async (key: string, value: boolean | string) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        try {
            await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });
        } catch (error) {
            logger.error('Error updating setting:', error);
            // Revert on error
            setSettings(prev => ({ ...prev, [key]: !value }));
        }
    };

    const handleProfileUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData),
            });

            if (res.ok) {
                setEditingProfile(false);
                alert(t('actions.updateSuccess'));
            } else {
                alert(t('actions.updateError'));
            }
        } catch (error) {
            logger.error('Error updating profile from settings:', error);
            alert(t('actions.updateError'));
        } finally {
            setLoading(false);
        }
    };

    const handlePushToggle = async () => {
        setPushLoading(true);
        try {
            if (pushSubscribed) {
                const ok = await unsubscribeFromPush();
                if (ok) setPushSubscribed(false);
            } else {
                const sub = await subscribeToPush();
                if (sub) setPushSubscribed(true);
                else alert('No se pudo activar las notificaciones. Revisa los permisos del navegador.');
            }
        } catch (err) {
            logger.error('Push toggle error:', err);
        } finally {
            setPushLoading(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    if (!mounted) return null;

    const sections = [
        { id: 'account', icon: '👤', title: t('sections.account') },
        { id: 'appearance', icon: '🎨', title: t('sections.appearance') },
        { id: 'notifications', icon: '🔔', title: t('sections.notifications') },
        { id: 'privacy', icon: '🔒', title: t('sections.privacy') },
        { id: 'accessibility', icon: '♿', title: t('sections.accessibility') },
        { id: 'help', icon: '❓', title: t('sections.help') },
        { id: 'about', icon: 'ℹ️', title: t('sections.about') }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.subtitle}>
                    {t('subtitle')}
                </p>
            </header>

            <div className={styles.grid}>
                {/* Account Section */}
                <div 
                    className={`${styles.bentoCard} ${expandedSection === 'account' ? styles.fullWidthCard : ''}`}
                    onClick={() => toggleSection('account')}
                >
                    <div className={styles.bentoHeader}>
                        <div className={styles.iconWrapper}>👤</div>
                        <div className={styles.bentoTitle}>{t('sections.account')}</div>
                    </div>

                    {expandedSection === 'account' && (
                        <div className={styles.sectionContent} onClick={(e) => e.stopPropagation()}>
                            {!editingProfile ? (
                                <>
                                    <div className={styles.row}>
                                        <div>
                                            <div className={styles.label}>{t('labels.profile')}</div>
                                            <div className={styles.description}>
                                                {session?.user?.email}
                                            </div>
                                        </div>
                                        <button
                                            className="btn-premium"
                                            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                                            onClick={() => setEditingProfile(true)}
                                        >
                                            {t('actions.edit')}
                                        </button>
                                    </div>
                                    <div className={styles.row}>
                                        <div>
                                            <div className={styles.label}>{t('labels.username')}</div>
                                            <div className={styles.description}>
                                                {profileData.username || t('placeholders.notSet')}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.editForm}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>{t('labels.username')}</label>
                                        <input
                                            type="text"
                                            value={profileData.username}
                                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>{t('labels.bio')}</label>
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            className={styles.textarea}
                                            maxLength={150}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-premium" style={{ flex: 1 }} onClick={handleProfileUpdate} disabled={loading}>
                                            {loading ? t('actions.saving') : t('actions.save')}
                                        </button>
                                        <button className="btn-secondary" style={{ flex: 1, border: '1px solid rgba(0,0,0,0.1)', borderRadius: '99px' }} onClick={() => setEditingProfile(false)}>
                                            {t('actions.cancel')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Appearance Section */}
                <div 
                    className={`${styles.bentoCard} ${expandedSection === 'appearance' ? styles.fullWidthCard : ''}`}
                    onClick={() => toggleSection('appearance')}
                >
                    <div className={styles.bentoHeader}>
                        <div className={styles.iconWrapper} style={{ background: 'rgba(168, 85, 247, 0.1)' }}>🎨</div>
                        <div className={styles.bentoTitle}>{t('sections.appearance')}</div>
                    </div>

                    {expandedSection === 'appearance' && (
                        <div className={styles.sectionContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.row}>
                                <div>
                                    <div className={styles.label}>{t('labels.theme')}</div>
                                    <div className={styles.description}>{t('labels.themeDesc')}</div>
                                </div>
                                <select value={theme} onChange={(e) => setTheme(e.target.value)} className={styles.select}>
                                    <option value="light">{t('themes.light')}</option>
                                    <option value="dark">{t('themes.dark')}</option>
                                    <option value="system">{t('themes.system')}</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications Section */}
                <div 
                    className={`${styles.bentoCard} ${expandedSection === 'notifications' ? styles.fullWidthCard : ''}`}
                    style={{ gridColumn: expandedSection === 'notifications' ? 'span 2' : 'span 2' }} /* Notifications is always wide if we want */
                    onClick={() => toggleSection('notifications')}
                >
                    <div className={styles.bentoHeader}>
                        <div className={styles.iconWrapper} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>🔔</div>
                        <div className={styles.bentoTitle}>{t('sections.notifications')}</div>
                    </div>

                    {expandedSection === 'notifications' && (
                        <div className={styles.sectionContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.row}>
                                <div>
                                    <div className={styles.label}>{t('labels.pushNotifications')}</div>
                                    <div className={styles.description}>{t('labels.pushNotificationsDesc')}</div>
                                </div>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={settings.pushNotifications}
                                        onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            {pushSupported && (
                                <div className={styles.row} style={{ background: pushSubscribed ? 'rgba(16,185,129,0.06)' : 'rgba(168,85,247,0.03)', borderRadius: 16, padding: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className={styles.label} style={{ fontSize: '0.85rem' }}>Native Alerts</div>
                                        <div className={styles.description} style={{ fontSize: '0.75rem' }}>{pushSubscribed ? 'Alertas activas' : 'Activar notificaciones de sistema'}</div>
                                    </div>
                                    <button onClick={handlePushToggle} disabled={pushLoading} className="btn-premium" style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem' }}>
                                        {pushLoading ? '...' : pushSubscribed ? 'Off' : 'On'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Privacy & Support (Smaller Tiles) */}
                <div className={styles.bentoCard} style={{ background: 'rgba(0,0,0,0.02)' }} onClick={() => toggleSection('privacy')}>
                    <div className={styles.bentoHeader}>
                        <div className={styles.iconWrapper} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>🔒</div>
                        <div className={styles.bentoTitle} style={{ fontSize: '0.9rem' }}>{t('sections.privacy')}</div>
                    </div>
                </div>

                <div className={styles.bentoCard} style={{ background: 'rgba(0,0,0,0.02)' }} onClick={() => toggleSection('help')}>
                    <div className={styles.bentoHeader}>
                        <div className={styles.iconWrapper} style={{ background: 'rgba(234, 179, 8, 0.1)' }}>❓</div>
                        <div className={styles.bentoTitle} style={{ fontSize: '0.9rem' }}>{t('sections.help')}</div>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <button className={styles.logoutButton} onClick={() => signOut()}>
                {t('actions.logout')}
            </button>
        </div>
    );
}
