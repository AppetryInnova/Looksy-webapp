'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { PostSkeleton } from '@/components/ui/Skeleton';
import OptimizedImage from '@/components/OptimizedImage';
import CommentsSheet from '@/components/CommentsSheet';
import DailyFitCard from './DailyFitCard';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import logger from '@/lib/logger';
import styles from './SocialFeedImmersive.module.css';
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
    };
    _count?: {
        likes: number;
        comments: number;
    };
    isLiked?: boolean;
    isFollowing?: boolean;
};

interface SocialFeedProps {
    feedType: 'global' | 'personal' | 'following';
}

export default function SocialFeedImmersive({ feedType }: SocialFeedProps) {
    const { data: session } = useSession();
    const t = useTranslations('SocialFeed');
    const [scans, setScans] = useState<Scan[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedScan, setSelectedScan] = useState<string | null>(null);
    const observerTarget = useRef<HTMLDivElement>(null);
    const [activeScanIndex, setActiveScanIndex] = useState(0);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);


    const fetchScans = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        if (!session?.user) return;
        try {
            let url = `/api/scans?page=${pageNum}&limit=5`;
            if (feedType === 'personal') url += `&userId=${session.user.id}`;
            if (feedType === 'following') url += `&following=true`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch scans');
            const data = await res.json();
            if (data.length < 5) setHasMore(false);

            // Use real _count from API, with safe defaults
            const enriched = data.map((scan: any) => ({
                ...scan,
                _count: scan._count || { likes: 0, comments: 0 },
                isLiked: scan.isLiked ?? false,
                isFollowing: scan.isFollowing ?? false
            }));

            if (append) {
                setScans(prev => [...prev, ...enriched]);
            } else {
                setScans(enriched);
            }
        } catch (err) {
            logger.error(err);
        } finally {
            setLoading(false);
            posthog.capture('immersive_feed_viewed', { feedType, count: enriched?.length || 0 });
        }

    }, [session, feedType]);

    useEffect(() => {
        if (session) {
            fetchScans(1, false);
        }
    }, [session, feedType, fetchScans]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => {
                        const next = prev + 1;
                        fetchScans(next, true);
                        return next;
                    });
                }
            },
            { threshold: 0.1 }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore, loading, fetchScans]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget as HTMLDivElement;
        // Offset by 1 because DailyFitCard occupies index 0
        const rawIndex = Math.round(target.scrollTop / target.clientHeight);
        const scanIdx = rawIndex - 1;
        if (scanIdx !== activeScanIndex) {
            setActiveScanIndex(scanIdx);
            // Pre-load comments for active scan if needed
            if (scanIdx >= 0 && scans[scanIdx]) {
                // handleShowComments(scans[scanIdx].id);
            }
        }
    };

    const handleLike = async (scanId: string) => {
        try {
            const res = await fetch(`/api/scans/${scanId}/like`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setScans(prev => prev.map(s => 
                    s.id === scanId ? { ...s, isLiked: data.isLiked, _count: { ...s._count!, likes: data.count } } : s
                ));
                posthog.capture('scan_liked', { scanId, location: 'immersive' });
            }
        } catch (error) { logger.error(error); }
    };

    const handleShowComments = async (scanId: string) => {
        setSelectedScan(scanId);
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/scans/${scanId}/comments`);
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (error) { 
            logger.error(error);
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
                    s.id === scanId ? { ...s, _count: { ...s._count!, comments: (s._count?.comments || 0) + 1 } } : s
                ));
                posthog.capture('scan_comment_added', { scanId, location: 'immersive' });
            }
        } catch (error) { logger.error(error); }
    };


    if (loading && page === 1) {
        return (
            <div className={styles.snapContainer}>
                <PostSkeleton />
            </div>
        );
    }

    return (
        <div className={styles.snapContainer} onScroll={handleScroll}>
            {/* INJECTED DAILY FIT CARD AT TOP */}
            <div className={styles.snapItem}>
                <DailyFitCard />
            </div>

            {scans.map((scan, index) => (
                <div key={scan.id} className={styles.snapItem}>
                    {/* Background Layer */}
                    <div className={styles.imageWrapper}>
                        <img src={scan.photoUrl} alt="Outfit" className={styles.fullScreenImage} />
                        <div className={styles.gradientOverlay}></div>
                    </div>

                    {/* Content Layer (UI) */}
                    <AnimatePresence>
                        {index === activeScanIndex && (
                            <motion.div 
                                className={styles.uiLayer}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Left Side: User Info & Tags */}
                                <div className={styles.bottomLeft}>
                                    <h3 className={styles.username}>@{scan.user?.username || 'user'}</h3>
                                    <p className={styles.harmonyScore}>Harmonía: {scan.harmonyScore}% ✨</p>
                                    <div className={styles.hotspots}>
                                        <button className={styles.tagBtn}>👖 Vintage Denim</button>
                                        <button className={styles.tagBtn}>👟 Nike AF1</button>
                                    </div>
                                </div>

                                {/* Right Side: Actions */}
                                <div className={styles.actionSidebar}>
                                    <button 
                                        className={`${styles.actionBtn} ${scan.isLiked ? styles.liked : ''}`}
                                        onClick={() => handleLike(scan.id)}
                                    >
                                        <span className={styles.icon}>{scan.isLiked ? '❤️' : '🤍'}</span>
                                        <span>{scan._count?.likes}</span>
                                    </button>
                                    <button className={styles.actionBtn} onClick={() => handleShowComments(scan.id)}>
                                        <span className={styles.icon}>💬</span>
                                        <span>{scan._count?.comments}</span>
                                    </button>

                                    <button 
                                        className={styles.actionBtn}
                                        onClick={() => posthog.capture('immersive_shop_clicked', { scanId: scan.id })}
                                    >
                                        <span className={styles.icon}>🛒</span>
                                        <span>Shop</span>
                                    </button>
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
            
            {hasMore && (
                <div ref={observerTarget} className={styles.snapItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PostSkeleton />
                </div>
            )}

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
