'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../profile.module.css';
import WardrobeGrid from '@/components/WardrobeGrid';
import PostCard from '@/components/PostCard';
import OptimizedImage from '@/components/OptimizedImage';

type ExternalUserProfile = {
    id: string;
    username: string;
    avatarUrl: string | null;
    isVerified?: boolean;
    level: string;
    stylePoints?: number;
    bio?: string | null;
    pronouns?: string | null;
    location?: string | null;
    profileLocked: boolean;
    isFollowing: boolean;
    badges?: { id: string; name: string; iconUrl: string; description: string }[];
    _count: {
        items: number;
        scans: number;
        eventsAttending: number;
        followers: number;
        following: number;
    };
};

type Scan = {
    id: string;
    photoUrl: string;
    harmonyScore: number;
    createdAt: string;
};

type Post = {
    id: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    user: { id: string; username?: string | null; avatarUrl?: string | null; isVerified?: boolean };
    likedByMe: boolean;
    _count: { likes: number; comments: number };
};

type FollowUser = {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    isVerified?: boolean;
    level?: string;
};

export default function VisitedProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: targetUserId } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('ProfilePage');
    const tCommon = useTranslations('Common');
    const tSocial = useTranslations('SocialFeed');

    const [user, setUser] = useState<ExternalUserProfile | null>(null);
    const [scans, setScans] = useState<Scan[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'looks' | 'wardrobe' | 'posts'>('looks');
    const [loading, setLoading] = useState(true);
    const [loadingTabContent, setLoadingTabContent] = useState(false);
    const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following'; users: FollowUser[] }>({
        isOpen: false,
        type: 'followers',
        users: []
    });

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/profile/${targetUserId}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                
                if (data.id === session?.user?.id) {
                    // Redirect to own profile if they visit themselves
                    router.push('/profile');
                    return;
                }
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (error) {
            logger.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (targetUserId) {
            fetchProfile();
        }
    }, [targetUserId, session?.user?.id]);

    useEffect(() => {
        if (user && !user.profileLocked) {
            loadTabContent();
        }
    }, [user, activeTab]);

    const loadTabContent = async () => {
        setLoadingTabContent(true);
        try {
            if (activeTab === 'looks') {
                const res = await fetch(`/api/scans?userId=${targetUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setScans(data);
                }
            } else if (activeTab === 'wardrobe') {
                const res = await fetch(`/api/items?userId=${targetUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setWardrobeItems(data);
                }
            } else if (activeTab === 'posts') {
                const res = await fetch(`/api/posts?userId=${targetUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.posts || []);
                }
            }
        } catch (err) {
            logger.error('Error loading tab content:', err);
        } finally {
            setLoadingTabContent(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!user) return;
        const currentFollowing = user.isFollowing;
        const method = currentFollowing ? 'DELETE' : 'POST';

        // Optimistic UI update
        setUser(prev => prev ? {
            ...prev,
            isFollowing: !currentFollowing,
            _count: {
                ...prev._count,
                followers: currentFollowing ? prev._count.followers - 1 : prev._count.followers + 1
            }
        } : null);

        try {
            const res = await fetch(`/api/follow/${targetUserId}`, { method });
            if (!res.ok) {
                // Rollback
                fetchProfile();
            } else {
                // Reload profile data to check if privacy states updated (e.g. unlocking private profile)
                fetchProfile();
            }
        } catch (error) {
            logger.error('Error toggling follow:', error);
            fetchProfile();
        }
    };

    const handleOpenFollowModal = async (type: 'followers' | 'following') => {
        if (!user || user.profileLocked) return;
        try {
            const res = await fetch(`/api/follow/${targetUserId}/${type}`);
            if (res.ok) {
                const data = await res.json();
                setFollowModal({
                    isOpen: true,
                    type,
                    users: data
                });
            }
        } catch (error) {
            logger.error(`Error fetching ${type}:`, error);
        }
    };

    if (!mounted) return null;

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <p className={styles.loading}>{t('loadingProfile')}</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h2 style={{ color: 'white', fontWeight: 900 }}>Usuario no encontrado</h2>
                <button onClick={() => router.push('/')} className="btn-secondary" style={{ marginTop: '16px', padding: '10px 24px' }}>
                    Volver al Inicio
                </button>
            </div>
        );
    }

    return (
        <main className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerControls} style={{ justifyContent: 'flex-start' }}>
                    <button onClick={() => router.back()} className={`btn-secondary ${styles.controlButton}`}>
                        ← Atrás
                    </button>
                </div>

                <div className={styles.avatarContainer}>
                    <div className={styles.avatarInner}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username} className={styles.avatarImage} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem', color: '#666', background: '#222' }}>
                                {user.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.usernameWrapper}>
                    <h1 className={styles.username}>
                        @{user.username}
                    </h1>
                    {user.isVerified && (
                        <div title={t('verifiedTitle')} className={styles.verifiedBadge}>
                            ✓
                        </div>
                    )}
                </div>

                <motion.div className={styles.levelBadge}>
                    {user.level}
                </motion.div>

                {/* Follow Button */}
                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={handleFollowToggle}
                        className={user.isFollowing ? 'btn-secondary' : 'btn-luxury'}
                        style={{ padding: '8px 24px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}
                    >
                        {user.isFollowing ? tSocial('following') : tSocial('follow')}
                    </button>
                </div>

                {/* Bio / Details */}
                {!user.profileLocked && (
                    <div style={{ marginTop: '16px', maxWidth: '500px', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                        {user.pronouns && <span style={{ fontWeight: 'bold', marginRight: '8px' }}>({user.pronouns})</span>}
                        {user.location && <span>📍 {user.location}</span>}
                        {user.bio && <p style={{ marginTop: '8px', color: '#ccc', fontStyle: 'italic' }}>"{user.bio}"</p>}
                    </div>
                )}

                {/* Follower / Following Counts Row */}
                <div style={{ display: 'flex', gap: '24px', marginTop: '20px', justifyContent: 'center' }}>
                    <button
                        onClick={() => handleOpenFollowModal('followers')}
                        disabled={user.profileLocked}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: user.profileLocked ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{user._count.followers}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Seguidores</span>
                    </button>
                    <button
                        onClick={() => handleOpenFollowModal('following')}
                        disabled={user.profileLocked}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: user.profileLocked ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{user._count.following}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Siguiendo</span>
                    </button>
                </div>
            </header>

            {/* Locked Profile Overlay */}
            {user.profileLocked ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '24px',
                    border: 'var(--glass-border)',
                    boxShadow: 'var(--shadow-premium)',
                    marginTop: '20px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
                    <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.3rem' }}>Esta cuenta es privada</h3>
                    <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', marginTop: '8px', maxWidth: '360px', margin: '8px auto 0' }}>
                        Sigue a @{user.username} para poder ver sus looks, ropero virtual y publicaciones.
                    </p>
                </div>
            ) : (
                <>
                    {/* Stats Summary Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 0' }}>
                        <div className={`card ${styles.statCard}`} style={{ padding: '16px', textAlign: 'center' }}>
                            <h2 className={styles.statValue}>{user._count.scans}</h2>
                            <p className={styles.statLabel}>{t('scans')}</p>
                        </div>
                        <div className={`card ${styles.statCard}`} style={{ padding: '16px', textAlign: 'center' }}>
                            <h2 className={styles.statValue}>{user._count.items}</h2>
                            <p className={styles.statLabel}>{t('items')}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className={styles.settingsRow} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '20px' }}>
                        <button
                            onClick={() => setActiveTab('looks')}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: activeTab === 'looks' ? 'var(--color-primary)' : 'var(--color-text-dim)',
                                fontWeight: activeTab === 'looks' ? 850 : 500, fontSize: '0.9rem',
                                padding: '8px 16px', borderBottom: activeTab === 'looks' ? '2px solid var(--color-primary)' : 'none'
                            }}
                        >
                            👗 Outfits
                        </button>
                        <button
                            onClick={() => setActiveTab('wardrobe')}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: activeTab === 'wardrobe' ? 'var(--color-primary)' : 'var(--color-text-dim)',
                                fontWeight: activeTab === 'wardrobe' ? 850 : 500, fontSize: '0.9rem',
                                padding: '8px 16px', borderBottom: activeTab === 'wardrobe' ? '2px solid var(--color-primary)' : 'none'
                            }}
                        >
                            🧥 Ropero
                        </button>
                        <button
                            onClick={() => setActiveTab('posts')}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: activeTab === 'posts' ? 'var(--color-primary)' : 'var(--color-text-dim)',
                                fontWeight: activeTab === 'posts' ? 850 : 500, fontSize: '0.9rem',
                                padding: '8px 16px', borderBottom: activeTab === 'posts' ? '2px solid var(--color-primary)' : 'none'
                            }}
                        >
                            📝 Posts
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div style={{ minHeight: '30vh' }}>
                        {loadingTabContent ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <p style={{ color: 'var(--color-text-dim)' }}>{tCommon('loading')}</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'looks' && (
                                    scans.length === 0 ? (
                                        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-dim)' }}>Aún no hay outfits escaneados.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                                            {scans.map(scan => (
                                                <div key={scan.id} className="card" style={{ padding: '8px', cursor: 'pointer' }} onClick={() => router.push(`/community`)}>
                                                    <div style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                                                        <img src={scan.photoUrl} alt="Scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div style={{ position: 'absolute', bottom: '6px', right: '6px', padding: '4px 8px', background: 'rgba(0,0,0,0.6)', color: '#00ff88', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            ✨ {scan.harmonyScore}%
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                                {activeTab === 'wardrobe' && (
                                    <WardrobeGrid
                                        items={wardrobeItems}
                                        loading={false}
                                        error={null}
                                        onRefresh={loadTabContent}
                                        filter="ALL"
                                    />
                                )}

                                {activeTab === 'posts' && (
                                    posts.length === 0 ? (
                                        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-dim)' }}>No hay publicaciones aún.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {posts.map(post => (
                                                <PostCard key={post.id} post={post} currentUserId={session?.user?.id} />
                                            ))}
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Followers / Following Modal */}
            <AnimatePresence>
                {followModal.isOpen && (
                    <div
                        onClick={() => setFollowModal(prev => ({ ...prev, isOpen: false }))}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 99999
                        }}
                    >
                        <div
                            className="glass-premium"
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '90%', maxWidth: '400px', maxHeight: '70vh',
                                overflowY: 'auto', padding: '24px', borderRadius: '24px',
                                display: 'flex', flexDirection: 'column'
                            }}
                        >
                            <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '16px', textTransform: 'capitalize', color: 'white' }}>
                                {followModal.type === 'followers' ? 'Seguidores' : 'Siguiendo'}
                            </h3>

                            {followModal.users.length === 0 ? (
                                <p style={{ color: 'var(--color-text-dim)', textAlign: 'center', padding: '16px' }}>Aún no hay usuarios en esta lista.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {followModal.users.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                                setFollowModal(prev => ({ ...prev, isOpen: false }));
                                                router.push(`/profile/${u.id}`);
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', cursor: 'pointer', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        >
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#333' }}>
                                                {u.avatarUrl ? (
                                                    <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        {u.username?.slice(0, 2).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'white' }}>@{u.username}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{u.name || ''}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setFollowModal(prev => ({ ...prev, isOpen: false }))}
                                className="btn-secondary"
                                style={{ marginTop: '20px', padding: '10px', width: '100%' }}
                            >
                                {tCommon('cancel')}
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
