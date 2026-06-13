'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import SocialFeedModern from '@/components/SocialFeedModern';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import styles from './community.module.css';
import { logger } from '@/lib/logger';
import posthog from 'posthog-js';
import SocialFeedImmersive from '@/components/SocialFeedImmersive';

interface Post {
    id: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    user: { id: string; username?: string | null; avatarUrl?: string | null; isVerified?: boolean };
    likedByMe: boolean;
    _count: { likes: number; comments: number };
    comments?: { id: string; username: string; avatarUrl?: string | null; content: string; createdAt: string }[];
}

export default function CommunityPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'posts' | 'outfits' | 'following'>('posts');
    const [suggestedUsers, setSuggestedUsers] = useState<{ id: string; username: string; avatarUrl?: string | null; level?: string }[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewMode, setViewMode] = useState<'modern' | 'immersive'>('modern');


    useEffect(() => {
        fetch('/api/community/discovery')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setSuggestedUsers(data); })
            .catch(err => logger.error('Error fetching discovery:', err));
    }, []);

    const fetchPosts = useCallback(async (cursor?: string) => {
        setLoadingPosts(true);
        try {
            const url = cursor ? `/api/posts?cursor=${cursor}` : '/api/posts';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPosts(prev => cursor ? [...prev, ...data.posts] : data.posts);
                setNextCursor(data.nextCursor);
            }
        } catch (err) {
            logger.error('Error fetching posts:', err);
        } finally {
            setLoadingPosts(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'posts') fetchPosts();
    }, [activeTab, fetchPosts]);

    const handleFollowFromSuggestion = async (userId: string) => {
        try {
            const res = await fetch(`/api/follow/${userId}`, { method: 'POST' });
            if (res.ok) setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) { logger.error('Error following:', error); }
    };

    const handlePostCreated = (newPost: Record<string, unknown>) => {
        setPosts(prev => [newPost as unknown as Post, ...prev]);
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Comunidad Looksy</h1>
                    <p className={styles.subtitle}>Inspiración y tendencias en tiempo real</p>
                    <div className={styles.tabs}>
                        {([
                            { id: 'posts', label: '📝 Posts' },
                            { id: 'outfits', label: '👗 Outfits' },
                            { id: 'following', label: '👥 Siguiendo' },
                        ] as const).map(tab => (
                            <button
                                key={tab.id}
                                className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    <div style={{ marginTop: '16px' }}>
                        <button 
                            onClick={() => {
                                const next = viewMode === 'modern' ? 'immersive' : 'modern';
                                setViewMode(next);
                                posthog.capture('view_mode_changed', { mode: next });
                            }}
                            className={styles.viewToggle}
                        >
                            {viewMode === 'modern' ? '✨ Modo Inmersivo' : '📱 Vista Cuadrícula'}
                        </button>
                    </div>
                </div>
            </header>


            <div className={styles.mainLayout}>
                <div className={styles.content}>
                    {activeTab === 'posts' && (
                        <>
                            {loadingPosts && posts.length === 0 ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="skeleton" style={{ height: 220, borderRadius: 20, marginBottom: 12 }} />
                                ))
                            ) : posts.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '3rem 1.5rem',
                                    color: 'var(--color-text-dim)',
                                    background: 'var(--glass-bg)', borderRadius: 20,
                                    border: 'var(--glass-border)'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✨</div>
                                    <p style={{ fontWeight: 600 }}>Sé el primero en publicar</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Comparte tu look de hoy</p>
                                </div>
                            ) : (
                                <>
                                    {posts.map(post => (
                                         <PostCard key={post.id} post={post} currentUserId={session?.user?.id} onDelete={() => fetchPosts()} />
                                     ))}
                                    {nextCursor && (
                                        <button
                                            onClick={() => fetchPosts(nextCursor)}
                                            disabled={loadingPosts}
                                            style={{
                                                width: '100%', padding: '0.875rem',
                                                background: 'var(--glass-bg)', border: 'var(--glass-border)',
                                                borderRadius: 14, color: 'var(--color-text-dim)',
                                                fontWeight: 600, cursor: 'pointer', marginBottom: '1rem'
                                            }}
                                        >
                                            {loadingPosts ? 'Cargando...' : 'Ver más posts'}
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}
                    {activeTab === 'outfits' && (
                        viewMode === 'modern' 
                            ? <SocialFeedModern feedType="global" /> 
                            : <SocialFeedImmersive feedType="global" />
                    )}
                    {activeTab === 'following' && (
                        viewMode === 'modern'
                            ? <SocialFeedModern feedType="following" />
                            : <SocialFeedImmersive feedType="following" />
                    )}
                </div>


                <aside className={styles.sidebar}>
                    <div className={styles.discoveryCard}>
                        <h3 className={styles.sidebarTitle}>Gente a seguir</h3>
                        <div className={styles.suggestionsList}>
                            {suggestedUsers.map(user => (
                                <div key={user.id} className={styles.suggestionItem}>
                                    <div className={styles.suggestionAvatar}>
                                        {user.avatarUrl ? <img src={user.avatarUrl} alt={user.username} /> : user.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.suggestionInfo}>
                                        <div className={styles.suggestionUsername}>@{user.username}</div>
                                        <div className={styles.suggestionLevel}>{user.level}</div>
                                    </div>
                                    <button className={styles.suggestionFollowBtn} onClick={() => handleFollowFromSuggestion(user.id)}>
                                        Seguir
                                    </button>
                                </div>
                            ))}
                            {suggestedUsers.length === 0 && <p className={styles.noSuggestions}>¡Estás al día con todos!</p>}
                        </div>
                    </div>
                </aside>
            </div>

            {session?.user && activeTab === 'posts' && (
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        position: 'fixed', bottom: '5.5rem', right: '1.25rem',
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'var(--gradient-primary)', border: 'none', cursor: 'pointer', zIndex: 50,
                        fontSize: '1.4rem', boxShadow: '0 8px 24px rgba(168, 85, 247, 0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Crear post"
                >
                    ✏️
                </button>
            )}

            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onPostCreated={handlePostCreated}
                    currentUser={{ username: session?.user?.name, avatarUrl: session?.user?.image }}
                />
            )}
        </main>
    );
}
