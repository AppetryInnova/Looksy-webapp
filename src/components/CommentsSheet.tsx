'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './CommentsSheet.module.css';
import OptimizedImage from './OptimizedImage';

interface Comment {
    id: string;
    content: string;
    username: string;
    createdAt: string;
}

interface CommentsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    comments: Comment[];
    loading: boolean;
    onAddComment: (text: string) => void;
}

export default function CommentsSheet({ isOpen, onClose, comments, loading, onAddComment }: CommentsSheetProps) {
    const [newComment, setNewComment] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setNewComment('');
        }, 300); // Match CSS animation duration
    };

    const handleSubmit = () => {
        if (!newComment.trim()) return;
        onAddComment(newComment);
        setNewComment('');
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'hace un momento';
        if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
        return `hace ${Math.floor(seconds / 86400)}d`;
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div className={`${styles.overlay} ${isClosing ? styles.fadeOut : ''}`} onClick={handleClose}>
            <div
                ref={sheetRef}
                className={`${styles.sheet} ${isClosing ? styles.slideDown : styles.slideUp}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.handle} />

                <div className={styles.header}>
                    <h3>Comentarios <span className={styles.count}>({comments.length})</span></h3>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>💬</span>
                            <p>Sé el primero en comentar</p>
                        </div>
                    ) : (
                        <div className={styles.commentsList}>
                            {comments.map((comment) => (
                                <div key={comment.id} className={styles.commentItem}>
                                    <div className={styles.avatar}>
                                        {comment.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.commentBody}>
                                        <div className={styles.commentHeader}>
                                            <span className={styles.username}>@{comment.username}</span>
                                            <span className={styles.time}>{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className={styles.text}>{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.inputArea}>
                    <input
                        type="text"
                        placeholder="Escribe un comentario..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        className={styles.input}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!newComment.trim()}
                        className={styles.sendButton}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
