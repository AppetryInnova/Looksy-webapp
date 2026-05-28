'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';

interface PollOption {
    id: string;
    text: string;
    imageUrl?: string;
    votes: { userId: string }[];
}

interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    creator?: { username: string };
    scan?: { photoUrl: string };  // Outfit context
    createdAt: string;
}

interface PollCardProps {
    poll: Poll;
}

export default function PollCard({ poll }: PollCardProps) {
    const { data: session } = useSession();
    const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
    const [localPoll, setLocalPoll] = useState(poll);

    const totalVotes = localPoll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0) + (votedOptionId ? 1 : 0);

    const handleVote = async (optionId: string) => {
        if (votedOptionId) return;

        if (!session?.user?.id) {
            alert('Debes iniciar sesión para votar.');
            return;
        }

        try {
            const res = await fetch(`/api/polls/${poll.id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    optionId
                })
            });

            if (res.ok) {
                setVotedOptionId(optionId);
                const newOptions = localPoll.options.map(opt => {
                    if (opt.id === optionId) {
                        return { ...opt, votes: [...(opt.votes || []), { userId: session.user.id }] };
                    }
                    return opt;
                });
                setLocalPoll({ ...localPoll, options: newOptions });
            }
        } catch (error) {
            logger.error("Vote failed", error);
        }
    };

    // Check if this is an image-based poll
    const hasImages = localPoll.options.some(opt => opt.imageUrl);

    return (
        <div className="card" style={{ padding: '20px', marginBottom: '20px', borderRadius: '20px' }}>
            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-primary)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    💭 Consejo de Estilo
                </span>
                <p style={{ fontSize: '0.8em', color: '#888', marginTop: '4px' }}>Por @{localPoll.creator?.username || 'Usuario'}</p>
            </div>

            {/* Outfit Context */}
            {localPoll.scan?.photoUrl && (
                <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '0.85em', color: 'var(--color-text-dim)', marginBottom: '8px' }}>Sobre este outfit:</p>
                    <img
                        src={localPoll.scan.photoUrl}
                        alt="Outfit context"
                        style={{
                            width: '100%',
                            maxHeight: '250px',
                            objectFit: 'cover',
                            borderRadius: '16px',
                            border: '2px solid rgba(var(--color-primary-rgb), 0.3)'
                        }}
                    />
                </div>
            )}

            {/* Question */}
            <h3 style={{ margin: '12px 0 16px 0', fontSize: '1.15rem', fontWeight: 600 }}>{localPoll.question}</h3>

            {/* Options */}
            {hasImages ? (
                // Image-based voting
                <div style={{ display: 'grid', gridTemplateColumns: localPoll.options.length === 2 ? '1fr 1fr' : '1fr', gap: '12px' }}>
                    {localPoll.options.map((option) => {
                        const votes = option.votes?.length || 0;
                        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                        const isSelected = votedOptionId === option.id;

                        return (
                            <div
                                key={option.id}
                                onClick={() => handleVote(option.id)}
                                style={{
                                    position: 'relative',
                                    cursor: votedOptionId ? 'default' : 'pointer',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    border: isSelected ? '3px solid var(--color-primary)' : '2px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s ease',
                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                <img
                                    src={(option.imageUrl && (option.imageUrl.startsWith('http') || option.imageUrl.startsWith('/')))
                                        ? option.imageUrl
                                        : '/placeholders/default.svg'}
                                    alt={option.text}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        filter: votedOptionId && !isSelected ? 'brightness(0.6)' : 'brightness(1)'
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholders/default.svg';
                                    }}
                                />

                                {/* Option Label */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                    padding: '16px 12px 12px',
                                    color: 'white'
                                }}>
                                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>{option.text}</p>
                                    {votedOptionId && (
                                        <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                            {percentage}%
                                        </p>
                                    )}
                                </div>

                                {/* Checkmark for selected */}
                                {isSelected && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: 'var(--color-primary)',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2em',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}>
                                        ✓
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Text-based voting (fallback)
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {localPoll.options.map((option) => {
                        const votes = option.votes?.length || 0;
                        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                        const isSelected = votedOptionId === option.id;

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleVote(option.id)}
                                disabled={!!votedOptionId}
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--color-text)',
                                    textAlign: 'left',
                                    cursor: votedOptionId ? 'default' : 'pointer',
                                    overflow: 'hidden'
                                }}
                            >
                                {votedOptionId && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        width: `${percentage}%`,
                                        background: 'rgba(var(--color-primary-rgb), 0.2)',
                                        transition: 'width 0.5s ease',
                                        zIndex: 0
                                    }} />
                                )}

                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{option.text}</span>
                                    {votedOptionId && (
                                        <span style={{ fontWeight: 'bold' }}>{percentage}%</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '16px', fontSize: '0.8em', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}</span>
                <span>{new Date(localPoll.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
}
