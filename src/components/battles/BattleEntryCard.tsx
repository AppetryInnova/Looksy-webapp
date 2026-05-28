'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BattleEntryProps {
    entry: {
        id: string;
        score: number;
        user: {
            id: string;
            username: string;
            avatarUrl: string | null;
        };
        scan: {
            photoUrl: string;
            harmonyScore: number;
        };
    };
    battleId: string;
    onVote: (entryId: string) => Promise<boolean>;
}

export default function BattleEntryCard({ entry, battleId, onVote }: BattleEntryProps) {
    const [isVoting, setIsVoting] = useState(false);
    const [voted, setVoted] = useState(false);
    const [localScore, setLocalScore] = useState(entry.score);

    const handleVote = async () => {
        if (voted || isVoting) return;
        setIsVoting(true);
        const success = await onVote(entry.id);
        if (success) {
            setVoted(true);
            setLocalScore(prev => prev + 1);
        }
        setIsVoting(false);
    };

    return (
        <motion.div 
            className="battle-entry-card"
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="image-container">
                <img src={entry.scan.photoUrl} alt={`Entry by ${entry.user.username}`} />
                <div className="score-badge">
                    <span className="heart">❤️</span> {localScore}
                </div>
            </div>
            
            <div className="content">
                <div className="user-info">
                    <img src={entry.user.avatarUrl || '/default-avatar.png'} alt={entry.user.username} className="avatar" />
                    <span className="username">@{entry.user.username}</span>
                </div>
                
                <div className="stats">
                    <span className="harmony">{entry.scan.harmonyScore}% Harmony</span>
                </div>

                <button 
                    className={`btn-primary vote-btn ${voted ? 'voted' : ''}`}
                    onClick={handleVote}
                    disabled={voted || isVoting}
                >
                    {isVoting ? 'Voting...' : voted ? 'Voted ✓' : 'Vote'}
                </button>
            </div>

            <style jsx>{`
                .battle-entry-card {
                    background: var(--color-surface);
                    border-radius: var(--radius-card);
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: var(--shadow-glow);
                }
                .image-container {
                    position: relative;
                    width: 100%;
                    height: 350px;
                }
                .image-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .score-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(8px);
                    padding: 6px 12px;
                    border-radius: 20px;
                    color: white;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .heart {
                    font-size: 1.1rem;
                }
                .content {
                    padding: 16px;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    background: #eee;
                }
                .username {
                    font-weight: 600;
                    color: var(--color-text);
                }
                .stats {
                    margin-bottom: 16px;
                    font-size: 0.9rem;
                    color: var(--color-primary);
                    font-weight: 500;
                }
                .vote-btn {
                    width: 100%;
                    padding: 12px;
                    transition: all 0.2s;
                }
                .vote-btn.voted {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-primary);
                    border: 1px solid var(--color-primary);
                    box-shadow: none;
                    cursor: default;
                }
            `}</style>
        </motion.div>
    );
}
