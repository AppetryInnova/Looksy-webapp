'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EnhancedEmptyState from '@/components/EnhancedEmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import StoryCircle from '@/components/StoryCircle';
import PollCard from '@/components/PollCard';
import CreatePollModal from '@/components/CreatePollModal';
import ScanPollCreator from '@/components/ScanPollCreator';
import OptimizedImage from '@/components/OptimizedImage';
import CommentsSheet from '@/components/CommentsSheet';
import { useTranslations } from 'next-intl';
import styles from './SocialFeed.module.css';
import logger from '@/lib/logger';
import posthog from 'posthog-js';

type Scan = {
    id: string;
    photoUrl: string;
    harmonyScore: number;
    createdAt: string;
    user?: {
        id: string;
        username: string;
        avatarUrl?: string;
        isVerified?: boolean;
    };

    _count?: {
        likes: number;
        comments: number;
    };
    isLiked?: boolean;
    isFollowing?: boolean;
};

type Comment = {
    id: string;
    content: string;
    username: string;
    createdAt: string;
};

interface SocialFeedProps {
    feedType: 'global' | 'personal' | 'following';
}

export default function SocialFeedModern({ feedType }: SocialFeedProps) {
    const { data: session } = useSession();
    const t = useTranslations('SocialFeed');
    const tc = useTranslations('Common');
    const [scans, setScans] = useState<Scan[]>([]);
    const [polls, setPolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedScan, setSelectedScan] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [animatingHearts, setAnimatingHearts] = useState<{ [key: string]: boolean }>({});
    const [pollModalOpen, setPollModalOpen] = useState(false);
    const [scanPollModal, setScanPollModal] = useState<{ scanId: string; photoUrl: string } | null>(null);

    // Infinite scroll state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Pull to refresh state
    const [pullStartY, setPullStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchScans = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        if (!session?.user) return;

        if (!append) setLoading(true);
        else setLoadingMore(true);

        setError(null);
        try {
            let url = '';
            if (feedType === 'personal') {
                url = `/api/scans?userId=${session.user.id}&page=${pageNum}&limit=10`;
            } else if (feedType === 'following') {
                url = `/api/scans?following=true&page=${pageNum}&limit=10`;
            } else {
                url = `/api/scans?page=${pageNum}&limit=10`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch scans');
            const data = await res.json();

            if (data.length < 10) setHasMore(false);
            else setHasMore(true);

            // Fetch likes and comments count for each scan
            const scansWithDetails = await Promise.all(
                data.map(async (scan: Scan) => {
                    const [likeRes, commentsRes, followRes] = await Promise.all([
                        fetch(`/api/scans/${scan.id}/like`),
                        fetch(`/api/scans/${scan.id}/comments`),
                        scan.user?.id ? fetch(`/api/follow/${scan.user.id}`) : Promise.resolve({ json: () => ({ isFollowing: false }) })
                    ]);

                    const likeData = await likeRes.json();
                    const commentsData = await commentsRes.json();
                    const followData = await (followRes as any).json();

                    return {
                        ...scan,
                        _count: {
                            likes: likeData.count || 0,
                            comments: Array.isArray(commentsData) ? commentsData.length : 0
                        },
                        isLiked: likeData.isLiked || false,
                        isFollowing: followData.isFollowing || false
                    };
                })
            );

            if (append) {
                setScans(prev => [...prev, ...scansWithDetails]);
            } else {
                setScans(scansWithDetails);
            }
        } catch (err) {
            logger.error(err);
            setError(t('loadingError') || tc('error')); // loadingError wasn't added yet, I'll use tc('error') for now or add it later. Actually I'll just use 'loadingError' and add it.
        } finally {
            setLoading(false);
            setLoadingMore(false);
            posthog.capture('feed_viewed', { feedType, count: scansWithDetails?.length || 0 });
        }

    }, [session, feedType]);

    const fetchPolls = useCallback(async () => {
        if (feedType === 'personal') {
            setPolls([]);
            return;
        }
        try {
            const res = await fetch('/api/polls');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPolls(data);
                }
            }
        } catch (error) {
            logger.error('Error fetching polls:', error);
        }
    }, [feedType]);

    useEffect(() => {
        if (session) {
            setPage(1);
            setHasMore(true);
            fetchScans(1, false);
            fetchPolls();
        }
    }, [feedType, session, fetchScans, fetchPolls]);

    // Realtime Listener for Social Updates
    useEffect(() => {
        if (!scans.length) return;

        const channel = supabase
            .channel('social-updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'Like' },
                (payload) => {
                    if (payload.new && payload.new.scanId) {
                        setScans(prev => prev.map(s => s.id === payload.new.scanId ? { ...s, _count: { ...s._count!, likes: (s._count?.likes || 0) + 1 } } : s));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'Like' },
                (payload) => {
                    if (payload.old && payload.old.scanId) {
                        setScans(prev => prev.map(s => s.id === payload.old.scanId ? { ...s, _count: { ...s._count!, likes: Math.max(0, (s._count?.likes || 0) - 1) } } : s));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'Comment' },
                (payload) => {
                    if (payload.new && payload.new.scanId) {
                        setScans(prev => prev.map(s => s.id === payload.new.scanId ? { ...s, _count: { ...s._count!, comments: (s._count?.comments || 0) + 1 } } : s));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [scans.length]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchScans(nextPage, true);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loadingMore, loading, page, fetchScans]);

    // Pull to refresh handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            setPullStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (pullStartY > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
            const currentY = e.touches[0].clientY;
            const distance = currentY - pullStartY;
            if (distance > 0 && distance < 150) {
                setPullDistance(distance);
            }
        }
    };

    const handleFollow = async (userId: string, currentStatus: boolean) => {
        try {
            const method = currentStatus ? 'DELETE' : 'POST';
            const res = await fetch(`/api/follow/${userId}`, { method });

            if (res.ok) {
                setScans(prev => prev.map(s =>
                    s.user?.id === userId ? { ...s, isFollowing: !currentStatus } : s
                ));
                posthog.capture('user_followed', { 
                    targetUserId: userId, 
                    action: currentStatus ? 'unfollow' : 'follow',
                    location: 'social_feed'
                });
            }

        } catch (error) {
            logger.error('Error toggling follow:', error);
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 80) {
            setIsRefreshing(true);
            setPage(1);
            setHasMore(true);
            Promise.all([fetchScans(1, false), fetchPolls()]).then(() => {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                    setPullStartY(0);
                }, 500);
            });
        } else {
            setPullDistance(0);
            setPullStartY(0);
        }
    };

    const handleLike = async (scanId: string) => {
        try {
            const res = await fetch(`/api/scans/${scanId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                const data = await res.json();
                setScans(prev => prev.map(s =>
                    s.id === scanId
                        ? { ...s, isLiked: data.isLiked, _count: { ...s._count!, likes: data.count } }
                        : s
                ));
                posthog.capture('scan_liked', { 
                    scanId, 
                    action: data.isLiked ? 'like' : 'unlike'
                });
            }


        } catch (error) {
            logger.error('Error liking scan:', error);
        }
    };

    const triggerHeartAnimation = (scanId: string) => {
        setAnimatingHearts(prev => ({ ...prev, [scanId]: true }));
        setTimeout(() => {
            setAnimatingHearts(prev => {
                const newState = { ...prev };
                delete newState[scanId];
                return newState;
            });
        }, 800);
    };

    const handleDoubleTap = (scanId: string) => {
        const scan = scans.find(s => s.id === scanId);
        if (!scan) return;

        triggerHeartAnimation(scanId);
        if (!scan.isLiked) {
            handleLike(scanId);
        }
    };

    const handleShowComments = async (scanId: string) => {
        setSelectedScan(scanId);
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/scans/${scanId}/comments`);
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error('Error loading comments:', error);
            setComments([]);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (scanId: string, content: string) => {
        if (!content.trim()) return;

        try {
            const res = await fetch(`/api/scans/${scanId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                handleShowComments(scanId);
                setScans(prev => prev.map(s =>
                    s.id === scanId
                        ? { ...s, _count: { ...s._count!, comments: (s._count?.comments || 0) + 1 } }
                        : s
                ));
                posthog.capture('scan_comment_added', { scanId });
            }

        } catch (error) {
            logger.error('Error adding comment:', error);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return t('now');
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    const getScoreClass = (score: number) => {
        if (score >= 80) return styles.scoreHigh;
        if (score >= 60) return styles.scoreMedium;
        return styles.scoreLow;
    };

    if (loading && page === 1) {
        return <LoadingSkeleton type="feed" />;
    }

    if (error && scans.length === 0) {
        return <ErrorMessage message={error} onRetry={() => fetchScans(1, false)} />;
    }

    return (
        <div
            className={styles.feedContainer}
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: 'relative',
                transform: `translateY(${pullDistance * 0.5}px)`,
                transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none'
            }}
        >
            {/* Pull to Refresh Indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div
                    className={`${styles.refreshIndicator} ${isRefreshing ? styles.refreshing : ''}`}
                    style={{
                        transform: `translateX(-50%) translateY(${pullDistance > 0 ? pullDistance : 60}px)`,
                        opacity: pullDistance > 20 ? 1 : pullDistance / 20,
                    }}
                >
                    <div className={styles.refreshSpinner}>
                        {isRefreshing ? '⟳' : '↓'}
                    </div>
                </div>
            )}

            <CreatePollModal
                isOpen={pollModalOpen}
                onClose={() => setPollModalOpen(false)}
                onPollCreated={fetchPolls}
            />

            {scanPollModal && (
                <ScanPollCreator
                    isOpen={true}
                    onClose={() => setScanPollModal(null)}
                    onPollCreated={() => {
                        fetchPolls();
                        setScanPollModal(null);
                    }}
                    scanId={scanPollModal.scanId}
                    scanImageUrl={scanPollModal.photoUrl}
                />
            )}

            {feedType === 'global' && (
                <div className={styles.createPollButtonContainer}>
                    <button
                        onClick={() => setPollModalOpen(true)}
                        className="btn-primary"
                        style={{ fontSize: '0.85rem', padding: '8px 16px', borderRadius: '12px' }}
                    >
                        {t('createPoll')}
                    </button>
                </div>
            )}

            {/* Stories Section */}
            {feedType === 'global' && scans.length > 0 && (
                <div className={styles.storiesContainer}>
                    {scans.slice(0, 10).map((scan) => (
                        <StoryCircle
                            key={scan.id}
                            imageUrl={scan.user?.avatarUrl}
                            username={scan.user?.username || t('usuario')}
                            hasGradient={true}
                            size="medium"
                        />
                    ))}
                </div>
            )}

            {/* Mixed Feed: Polls and Scans */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {polls.length > 0 && feedType === 'global' && (
                    <div style={{ padding: '0 16px', marginBottom: '16px' }}>
                        {polls.slice(0, 2).map(poll => (
                            <PollCard key={poll.id} poll={poll} />
                        ))}
                    </div>
                )}

                {scans.length === 0 && !loading ? (
                    <EnhancedEmptyState
                        type="scans"
                        onAction={() => window.location.href = '/es/scanner'}
                    />
                ) : (
                    <>
                        {scans.map((scan, index) => (
                            <div key={scan.id}>
                                <div className={styles.feedCard}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.userAvatar}>
                                            {scan.user?.avatarUrl ? (
                                                <OptimizedImage
                                                    src={scan.user.avatarUrl}
                                                    alt={scan.user.username}
                                                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                                />
                                            ) : (
                                                scan.user?.username?.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div className={styles.userInfo}>
                                            <div className={styles.username}>
                                                @{scan.user?.username || t('usuario')}
                                                {scan.user?.isVerified && <span className={styles.verifiedBadge}>✓</span>}
                                            </div>
                                            <div className={styles.timestamp}>{formatTimeAgo(scan.createdAt)}</div>
                                        </div>

                                        {scan.user?.id !== session?.user?.id && (
                                            <button
                                                onClick={() => handleFollow(scan.user!.id, !!scan.isFollowing)}
                                                className={`${styles.followButton} ${scan.isFollowing ? styles.following : ''}`}
                                            >
                                                {scan.isFollowing ? t('following') : t('follow')}
                                            </button>
                                        )}
                                    </div>

                                    <div
                                        className={styles.imageContainer}
                                        onDoubleClick={() => handleDoubleTap(scan.id)}
                                        style={{ cursor: 'pointer', position: 'relative' }}
                                    >
                                        <OptimizedImage
                                            src={scan.photoUrl}
                                            alt="Outfit scan"
                                            priority={index < 2}
                                        />
                                        <div className={`${styles.scoreOverlay} ${getScoreClass(scan.harmonyScore)}`}>
                                            ✨ {scan.harmonyScore}%
                                        </div>

                                        {/* Heart Animation Overlay */}
                                        {animatingHearts[scan.id] && (
                                            <div className={styles.heartAnimationOverlay}>
                                                <span className={styles.heartIcon}>❤️</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.cardActions}>
                                        <button
                                            onClick={() => handleLike(scan.id)}
                                            className={`${styles.actionButton} ${scan.isLiked ? styles.liked : ''}`}
                                        >
                                            <span className={styles.actionIcon}>{scan.isLiked ? '❤️' : '🤍'}</span>
                                            <span className={styles.actionCount}>{scan._count?.likes || 0}</span>
                                        </button>
                                        <button
                                            onClick={() => handleShowComments(scan.id)}
                                            className={styles.actionButton}
                                        >
                                            <span className={styles.actionIcon}>💬</span>
                                            <span className={styles.actionCount}>{scan._count?.comments || 0}</span>
                                        </button>
                                        <button
                                            onClick={() => setScanPollModal({ scanId: scan.id, photoUrl: scan.photoUrl })}
                                            className={styles.actionButton}
                                            title={t('askAdvice')}
                                        >
                                            <span className={styles.actionIcon}>💭</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Inject more polls occasionally */}
                                {index === 2 && polls.length > 2 && feedType === 'global' && (
                                    <div style={{ padding: '0 16px', marginBottom: '16px' }}>
                                        {polls.slice(2, 4).map(poll => (
                                            <PollCard key={poll.id} poll={poll} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Infinite Scroll Target */}
                        <div ref={observerTarget} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {loadingMore && <LoadingSpinner size="small" />}
                        </div>
                    </>
                )}
            </div>

            {/* Comments Sheet */}
            <CommentsSheet
                isOpen={!!selectedScan}
                onClose={() => setSelectedScan(null)}
                comments={comments}
                loading={loadingComments}
                onAddComment={(text) => handleAddComment(selectedScan!, text)}
            />
        </div>
    );
}
