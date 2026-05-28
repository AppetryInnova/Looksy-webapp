'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from './Toast';
import logger from '@/lib/logger';

interface FollowButtonProps {
    userId: string;
    username?: string;
    initialFollowing?: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
    userId,
    username,
    initialFollowing = false,
    onFollowChange
}: FollowButtonProps) {
    const { data: session } = useSession();
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check follow status on mount
        if (session?.user?.id && userId && session.user.id !== userId) {
            fetch(`/api/follow/${userId}`)
                .then(res => res.json())
                .then(data => setIsFollowing(data.isFollowing))
                .catch((err: unknown) => logger.error('Error checking follow status:', err));
        }
    }, [session, userId]);

    const handleFollow = async () => {
        if (!session?.user?.id) {
            showToast('Inicia sesión para seguir usuarios', 'error');
            return;
        }

        setLoading(true);
        try {
            const method = isFollowing ? 'DELETE' : 'POST';
            const res = await fetch(`/api/follow/${userId}`, { method });

            if (res.ok) {
                const newFollowState = !isFollowing;
                setIsFollowing(newFollowState);
                onFollowChange?.(newFollowState);

                showToast(
                    newFollowState
                        ? `Ahora sigues a ${username || 'este usuario'}`
                        : `Dejaste de seguir a ${username || 'este usuario'}`,
                    'success'
                );
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al actualizar', 'error');
            }
        } catch (error) {
            logger.error('Follow error:', error);
            showToast('Error de conexión', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Don't show button for own profile
    if (session?.user?.id === userId) {
        return null;
    }

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={isFollowing ? 'btn-secondary' : 'btn-primary'}
            style={{
                padding: '10px 24px',
                fontSize: '0.9rem',
                minWidth: '120px',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'wait' : 'pointer'
            }}
        >
            {loading ? '...' : isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>
    );
}
