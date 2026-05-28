'use client';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';

type Notification = {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
};

type NotificationPanelProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            logger.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true })
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            logger.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'POST'
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            logger.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return '❤️';
            case 'COMMENT': return '💬';
            case 'EVENT_INVITE': return '🎉';
            case 'BADGE_UNLOCK': return '🏆';
            case 'LEVEL_UP': return '⭐';
            default: return '🔔';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'ahora';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 9999,
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '60px',
                    right: '20px',
                    width: '90%',
                    maxWidth: '400px',
                    maxHeight: '80vh',
                    background: 'var(--color-surface-elevated)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-xl)',
                    overflow: 'hidden',
                    animation: 'slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                        Notificaciones
                    </h3>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={markAllAsRead}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Marcar todas
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div style={{
                    maxHeight: 'calc(80vh - 80px)',
                    overflowY: 'auto',
                    padding: '8px'
                }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                            Cargando...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔔</div>
                            <p>No tienes notificaciones</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => {
                                    markAsRead(notification.id);
                                    if (notification.link) {
                                        window.location.href = notification.link;
                                    }
                                }}
                                style={{
                                    padding: '16px',
                                    marginBottom: '8px',
                                    borderRadius: '12px',
                                    background: notification.read
                                        ? 'transparent'
                                        : 'var(--color-surface)',
                                    cursor: notification.link ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease',
                                    border: '1px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (notification.link) {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            >
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'start',
                                            marginBottom: '4px'
                                        }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '0.95rem',
                                                fontWeight: notification.read ? '500' : '700'
                                            }}>
                                                {notification.title}
                                            </h4>
                                            {!notification.read && (
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: 'var(--color-primary)',
                                                    flexShrink: 0,
                                                    marginLeft: '8px'
                                                }} />
                                            )}
                                        </div>
                                        <p style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '0.85rem',
                                            color: 'var(--color-text-dim)',
                                            lineHeight: '1.4'
                                        }}>
                                            {notification.message}
                                        </p>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-text-dim)'
                                        }}>
                                            {formatTimeAgo(notification.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
