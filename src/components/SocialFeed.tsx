'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import PollCard from '@/components/PollCard';
import CreatePollModal from '@/components/CreatePollModal';
import OptimizedImage from '@/components/OptimizedImage';
import logger from '@/lib/logger';

type Scan = {
    id: string;
    photoUrl: string;
    harmonyScore: number;
    createdAt: string;
    user?: {
        username: string;
    };
    _count?: {
        likes: number;
        comments: number;
    };
    isLiked?: boolean;
};

type Comment = {
    id: string;
    content: string;
    username: string;
    createdAt: string;
};

interface SocialFeedProps {
    feedType: 'global' | 'personal';
}

export default function SocialFeed({ feedType }: SocialFeedProps) {
    const [scans, setScans] = useState<Scan[]>([]);
    const [polls, setPolls] = useState<any[]>([]); // Add polls state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedScan, setSelectedScan] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [pollModalOpen, setPollModalOpen] = useState(false);

    const fetchScans = () => {
        setLoading(true);
        setError(null);
        const url = feedType === 'personal' ? '/api/scans?userId=user_1' : '/api/scans';
        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch scans');
                return res.json();
            })
            .then(async (data) => {
                // Fetch like counts and status for each scan
                const scansWithLikes = await Promise.all(
                    data.map(async (scan: Scan) => {
                        const likeRes = await fetch(`/api/scans/${scan.id}/like?userId=user_1`);
                        const likeData = await likeRes.json();
                        const commentsRes = await fetch(`/api/scans/${scan.id}/comments`);
                        const commentsData = await commentsRes.json();
                        return {
                            ...scan,
                            _count: {
                                likes: likeData.count || 0,
                                comments: commentsData.length || 0
                            },
                            isLiked: likeData.isLiked || false
                        };
                    })
                );
                setScans(scansWithLikes);
                setLoading(false);
            })
            .catch((err) => {
                logger.error(err);
                setError('No se pudieron cargar los scans');
                setLoading(false);
            });
    };

    const fetchPolls = () => {
        if (feedType === 'personal') return; // Only show polls in global feed for now
        fetch('/api/polls')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPolls(data);
                }
            })
            .catch((err: unknown) => logger.error('Error fetching polls:', err));
    };

    useEffect(() => {
        fetchScans();
        fetchPolls();
    }, [feedType]);

    const handleLike = async (scanId: string) => {
        try {
            const res = await fetch(`/api/scans/${scanId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user_1' })
            });

            if (res.ok) {
                fetchScans(); // Refresh to get updated counts
            }
        } catch (error) {
            logger.error('Error liking scan:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de borrar este scan?')) return;

        try {
            const res = await fetch(`/api/scans/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchScans();
            } else {
                alert('Error al borrar');
            }
        } catch (error) {
            logger.error(error);
            alert('Error al borrar');
        }
    };

    const handleShowComments = async (scanId: string) => {
        setSelectedScan(scanId);
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/scans/${scanId}/comments`);
            const data = await res.json();
            setComments(data);
        } catch (error) {
            logger.error('Error loading comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (scanId: string) => {
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`/api/scans/${scanId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'user_1',
                    username: 'Usuario',
                    content: newComment
                })
            });

            if (res.ok) {
                setNewComment('');
                handleShowComments(scanId); // Refresh comments
                fetchScans(); // Refresh counts
            }
        } catch (error) {
            logger.error('Error adding comment:', error);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={fetchScans} />;
    }

    return (
        <div style={{ width: '100%', maxWidth: '600px' }}>
            <CreatePollModal
                isOpen={pollModalOpen}
                onClose={() => setPollModalOpen(false)}
                onPollCreated={fetchPolls}
            />

            {feedType === 'global' && (
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setPollModalOpen(true)}
                        className="btn-primary"
                        style={{ fontSize: '0.9em', padding: '8px 16px' }}
                    >
                        📊 Crear Encuesta
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {/* Render Polls First (Mixed feel) */}
                {polls.map(poll => (
                    <PollCard key={poll.id} poll={poll} />
                ))}

                {/* Scans Grid */}
                {/* We'll use a grid for scans inside the main column layout if desired, 
                    but here we are mixing full width cards. Let's make scans full width too or grid.
                    The original code had gridTemplateColumns: '1fr 1fr'.
                    Let's restore that for scans only, or wrap polls in full width.
                */}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                    {scans.length === 0 && polls.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <EmptyState
                                icon="📸"
                                title={feedType === 'personal' ? 'No has escaneado outfits aún' : 'No hay scans récientes'}
                                description={feedType === 'personal' ? 'Usa el escáner para analizar tus looks y compartirlos' : 'Sé el primero en compartir tu estilo'}
                            />
                        </div>
                    ) : (
                        scans.map((scan) => (
                            <div key={scan.id} className="card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{ aspectRatio: '3/4', position: 'relative', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                                    <OptimizedImage
                                        src={scan.photoUrl}
                                        alt="Scan"
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '5px',
                                        right: '5px',
                                        background: 'rgba(255,255,255,0.9)',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        fontSize: '0.8em',
                                        fontWeight: 'bold',
                                        color: scan.harmonyScore >= 80 ? 'var(--color-primary)' : 'var(--color-alert)'
                                    }}>
                                        {scan.harmonyScore}%
                                    </div>
                                </div>

                                {feedType === 'global' && (
                                    <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '8px' }}>@{scan.user?.username || 'Usuario'}</p>
                                )}

                                {/* Interaction Buttons */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.9em' }}>
                                    <button
                                        onClick={() => handleLike(scan.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            color: scan.isLiked ? 'var(--color-primary)' : '#666'
                                        }}
                                    >
                                        {scan.isLiked ? '❤️' : '🤍'} {scan._count?.likes || 0}
                                    </button>
                                    <button
                                        onClick={() => handleShowComments(scan.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            color: '#666'
                                        }}
                                    >
                                        💬 {scan._count?.comments || 0}
                                    </button>
                                </div>

                                {feedType === 'personal' && (
                                    <button
                                        onClick={() => handleDelete(scan.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            background: 'rgba(255,255,255,0.8)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            cursor: 'pointer',
                                            color: 'red',
                                            zIndex: 10,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Comments Modal */}
            {selectedScan && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setSelectedScan(null)}>
                    <div className="card" style={{
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        padding: '20px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '16px' }}>Comentarios</h3>

                        {loadingComments ? (
                            <p>Cargando...</p>
                        ) : (
                            <>
                                <div style={{ marginBottom: '16px', maxHeight: '300px', overflow: 'auto' }}>
                                    {comments.length === 0 ? (
                                        <p style={{ color: '#999', textAlign: 'center' }}>No hay comentarios aún</p>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} style={{ marginBottom: '12px', padding: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                                                <p style={{ fontWeight: 'bold', fontSize: '0.9em', marginBottom: '4px' }}>@{comment.username}</p>
                                                <p style={{ fontSize: '0.9em' }}>{comment.content}</p>
                                                <p style={{ fontSize: '0.7em', color: '#999', marginTop: '4px' }}>
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Escribe un comentario..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(selectedScan)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            borderRadius: '20px',
                                            border: '1px solid #ddd',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={() => handleAddComment(selectedScan)}
                                        className="btn-primary"
                                        style={{ padding: '8px 16px', borderRadius: '20px' }}
                                    >
                                        Enviar
                                    </button>
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => setSelectedScan(null)}
                            className="btn-secondary"
                            style={{ marginTop: '16px', width: '100%' }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
