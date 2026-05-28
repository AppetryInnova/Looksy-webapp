'use client';

import { useState } from 'react';
import posthog from 'posthog-js';

interface Comment {
    id: string;
    username: string;
    avatarUrl?: string | null;
    content: string;
    createdAt: string;
}

interface PostUser {
    id: string;
    username?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
}

interface Post {
    id: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    user: PostUser;
    likedByMe: boolean;
    _count: { likes: number; comments: number };
    comments?: Comment[];
}

interface PostCardProps {
    post: Post;
    currentUserId?: string;
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
    const [liked, setLiked] = useState(post.likedByMe);
    const [likeCount, setLikeCount] = useState(post._count.likes);
    const [likeAnim, setLikeAnim] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [comments, setComments] = useState<Comment[]>(post.comments ?? []);
    const [commentCount, setCommentCount] = useState(post._count.comments);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);

    const handleLike = async () => {
        if (!currentUserId) return;
        setLiked(prev => !prev);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
        setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 600);

        try {
            await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
            posthog.capture('post_liked', { 
                postId: post.id, 
                action: !liked ? 'like' : 'unlike' 
            });
        } catch {

            // revert on error
            setLiked(prev => !prev);
            setLikeCount(prev => liked ? prev + 1 : prev - 1);
        }
    };

    const loadAllComments = async () => {
        if (allCommentsLoaded) return;
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
                setAllCommentsLoaded(true);
            }
        } finally {
            setLoadingComments(false);
        }
    };

    const handleExpandComments = () => {
        const next = !expanded;
        setExpanded(next);
        if (next) loadAllComments();
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !currentUserId) return;
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentText.trim() })
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [...prev, newComment]);
                setCommentCount(prev => prev + 1);
                setCommentText('');
                posthog.capture('post_comment_added', { postId: post.id });
            }

        } finally {
            setSubmittingComment(false);
        }
    };

    const initials = post.user.username
        ? post.user.username.slice(0, 2).toUpperCase()
        : '??';

    return (
        <article style={{
            background: 'var(--glass-bg)',
            border: 'var(--glass-border)',
            borderRadius: '20px',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            marginBottom: '1rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem 0.75rem' }}>
                {post.user.avatarUrl ? (
                    <img
                        src={post.user.avatarUrl} alt={post.user.username ?? ''}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(168,85,247,0.4)' }}
                    />
                ) : (
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', fontWeight: 700, color: 'white', flexShrink: 0
                    }}>
                        {initials}
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            @{post.user.username ?? 'usuario'}
                        </span>
                        {post.user.isVerified && (
                            <span title="Verificado" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>✓</span>
                        )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                        {timeAgo(post.createdAt)}
                    </span>
                </div>
            </div>

            {/* Image */}
            {post.imageUrl && (
                <img
                    src={post.imageUrl} alt="Post"
                    style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                />
            )}

            {/* Content */}
            {post.content && (
                <p style={{ padding: '0.75rem 1.25rem 0.5rem', fontSize: '0.92rem', lineHeight: 1.55, margin: 0 }}>
                    {post.content}
                </p>
            )}

            {/* Actions */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.5rem 1.25rem 0.875rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem'
            }}>
                {/* Like button */}
                <button
                    onClick={handleLike}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'none', border: 'none', cursor: currentUserId ? 'pointer' : 'default',
                        color: liked ? '#f43f5e' : 'var(--color-text-dim)',
                        fontSize: '0.875rem', fontWeight: 600, padding: '0.4rem 0',
                        transition: 'color 0.2s',
                    }}
                    disabled={!currentUserId}
                >
                    <span style={{
                        fontSize: '1.15rem',
                        display: 'inline-block',
                        transform: likeAnim ? 'scale(1.4)' : 'scale(1)',
                        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}>
                        {liked ? '❤️' : '🤍'}
                    </span>
                    {likeCount > 0 && likeCount}
                </button>

                {/* Comment button */}
                <button
                    onClick={handleExpandComments}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: expanded ? 'var(--color-primary)' : 'var(--color-text-dim)',
                        fontSize: '0.875rem', fontWeight: 600, padding: '0.4rem 0',
                        transition: 'color 0.2s',
                    }}
                >
                    <span style={{ fontSize: '1.1rem' }}>💬</span>
                    {commentCount > 0 && commentCount}
                </button>

                {/* Share */}
                <button
                    onClick={() => {
                        navigator.share?.({ text: post.content, url: window.location.href });
                        posthog.capture('post_shared', { postId: post.id });
                    }}

                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-dim)', fontSize: '0.875rem', padding: '0.4rem 0',
                        marginLeft: 'auto',
                    }}
                >
                    <span style={{ fontSize: '1rem' }}>↗️</span>
                </button>
            </div>

            {/* Comments section */}
            {expanded && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.875rem 1.25rem' }}>
                    {loadingComments ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                            Cargando comentarios...
                        </div>
                    ) : comments.length === 0 ? (
                        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', textAlign: 'center', margin: '0.5rem 0' }}>
                            Sé el primero en comentar
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1rem' }}>
                            {comments.map(c => (
                                <div key={c.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.65rem', fontWeight: 700, color: 'white',
                                        overflow: 'hidden',
                                    }}>
                                        {c.avatarUrl
                                            ? <img src={c.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : c.username.slice(0, 2).toUpperCase()
                                        }
                                    </div>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                                        padding: '0.5rem 0.75rem', flex: 1
                                    }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>@{c.username} </span>
                                        <span style={{ fontSize: '0.85rem' }}>{c.content}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Comment input */}
                    {currentUserId && (
                        <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Escribe un comentario..."
                                maxLength={300}
                                style={{
                                    flex: 1, padding: '0.6rem 0.875rem', borderRadius: '999px',
                                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--color-text)', fontSize: '0.85rem', outline: 'none',
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || submittingComment}
                                style={{
                                    padding: '0.6rem 1rem', borderRadius: '999px', border: 'none',
                                    background: 'var(--gradient-primary)', color: 'white',
                                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                    opacity: !commentText.trim() || submittingComment ? 0.5 : 1,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                {submittingComment ? '...' : 'Enviar'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </article>
    );
}
