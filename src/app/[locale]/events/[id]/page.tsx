'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EventChat from '@/components/EventChat';
import EventPhotoGallery from '@/components/EventPhotoGallery';
import styles from './event-detail.module.css';
import { logger } from '@/lib/logger';
import { showToast } from '@/components/Toast';

type Event = {
    id: string;
    title: string;
    description?: string;
    date: string;
    endTime?: string;
    location: string;
    dressCode: string;
    imageUrl?: string;
    visibility: string;
    category?: string;
    maxAttendees?: number;
    requiresApproval: boolean;
    creator: {
        id: string;
        username: string;
        avatarUrl?: string;
    };
    attendees: Array<{
        id: string;
        rsvpStatus: string;
        responseMessage?: string;
        plusOnes: number;
        user: {
            id: string;
            username: string;
            avatarUrl?: string;
        };
        plannedOutfit?: {
            id: string;
            imageUrl: string;
            name: string;
        };
    }>;
    _count: {
        attendees: number;
        messages: number;
        photos: number;
    };
    userRSVP?: string | null;
};

const visibilityIcons: Record<string, string> = {
    'PUBLIC': '🌍',
    'PRIVATE': '🔒',
    'FRIENDS_ONLY': '👥'
};

const categoryIcons: Record<string, string> = {
    'Party': '🎉',
    'Fashion Show': '👗',
    'Meetup': '☕',
    'Shopping': '🛍️',
    'Networking': '🤝',
    'Other': '✨'
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'attendees' | 'discussion' | 'photos'>('attendees');
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [eventId, setEventId] = useState<string>('');

    useEffect(() => {
        params.then(({ id }) => {
            setEventId(id);
            fetchEvent(id);
        });
    }, []);

    const fetchEvent = async (id: string) => {
        try {
            const res = await fetch(`/api/events/${id}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
            } else if (res.status === 403) {
                showToast('No tienes acceso a este evento', 'error');
                router.push('/events');
            } else {
                showToast('Error al cargar el evento', 'error');
            }
        } catch (error) {
            logger.error('Error fetching event:', error);
            showToast('Error al cargar el evento', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRSVP = async (status: 'GOING' | 'MAYBE' | 'NOT_GOING') => {
        if (!session?.user) {
            alert('Debes iniciar sesión para confirmar asistencia');
            return;
        }

        setRsvpLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchEvent(eventId); // Refresh event data
                showToast('Asistencia actualizada', 'success');
            } else {
                const data = await res.json();
                showToast(data.error || 'Error al confirmar asistencia', 'error');
            }
        } catch (error) {
            logger.error('Error updating RSVP:', error);
            showToast('Error al confirmar asistencia', 'error');
        } finally {
            setRsvpLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;

        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showToast('Evento eliminado exitosamente', 'success');
                router.push('/events');
            } else {
                showToast('Error al eliminar el evento', 'error');
            }
        } catch (error) {
            logger.error('Error deleting event:', error);
            showToast('Error al eliminar el evento', 'error');
        }
    };

    if (loading) {
        return (
            <main className={styles.container}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <p>Cargando evento...</p>
                </div>
            </main>
        );
    }

    if (!event) {
        return (
            <main className={styles.container}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h2>Evento no encontrado</h2>
                    <Link href="/events" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                        Volver a eventos
                    </Link>
                </div>
            </main>
        );
    }

    const eventDate = new Date(event.date);
    const endDate = event.endTime ? new Date(event.endTime) : null;
    const isCreator = session?.user?.email && event.creator.id === session.user.id;
    const goingCount = event.attendees.filter(a => a.rsvpStatus === 'GOING').length;
    const maybeCount = event.attendees.filter(a => a.rsvpStatus === 'MAYBE').length;

    return (
        <main className={styles.container}>
            {/* Cover Image */}
            {event.imageUrl && (
                <div className={styles.coverImage} style={{ backgroundImage: `url(${event.imageUrl})` }}>
                    <div className={styles.coverOverlay} />
                </div>
            )}

            {/* Header */}
            <div className={`card ${styles.header}`}>
                <div className={styles.headerTop}>
                    <div className={styles.badges}>
                        <span className={styles.visibilityBadge}>
                            {visibilityIcons[event.visibility]} {event.visibility === 'PUBLIC' ? 'Público' : event.visibility === 'PRIVATE' ? 'Privado' : 'Amigos'}
                        </span>
                        {event.category && (
                            <span className={styles.categoryBadge}>
                                {categoryIcons[event.category]} {event.category}
                            </span>
                        )}
                    </div>
                    {isCreator && (
                        <div className={styles.hostControls}>
                            <button className="btn-secondary" onClick={() => router.push(`/events/${eventId}/edit`)}>
                                ✏️ Editar
                            </button>
                            <button className="btn-secondary" onClick={handleDelete} style={{ color: '#ef4444' }}>
                                🗑️ Eliminar
                            </button>
                        </div>
                    )}
                </div>

                <h1 className={styles.title}>{event.title}</h1>

                {event.description && (
                    <p className={styles.description}>{event.description}</p>
                )}

                <div className={styles.details}>
                    <div className={styles.detailItem}>
                        <span className={styles.icon}>📅</span>
                        <div>
                            <strong>{eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                            <p>{eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                {endDate && ` - ${endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.icon}>📍</span>
                        <div>
                            <strong>{event.location}</strong>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.icon}>👗</span>
                        <div>
                            <strong>Dress Code:</strong> {event.dressCode}
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.icon}>👤</span>
                        <div>
                            <strong>Organizador:</strong> {event.creator.username}
                        </div>
                    </div>
                </div>

                {event.maxAttendees && (
                    <div className={styles.capacity}>
                        <div className={styles.capacityBar}>
                            <div
                                className={styles.capacityFill}
                                style={{ width: `${Math.min((goingCount / event.maxAttendees) * 100, 100)}%` }}
                            />
                        </div>
                        <p>{goingCount} / {event.maxAttendees} asistentes confirmados</p>
                    </div>
                )}
            </div>

            {/* RSVP Section */}
            {session?.user && (
                <div className={`card ${styles.rsvpSection}`}>
                    <h3>¿Asistirás?</h3>
                    <div className={styles.rsvpButtons}>
                        <button
                            className={`${styles.rsvpButton} ${event.userRSVP === 'GOING' ? styles.active : ''}`}
                            onClick={() => handleRSVP('GOING')}
                            disabled={rsvpLoading}
                            style={{ borderColor: '#22c55e', color: event.userRSVP === 'GOING' ? '#fff' : '#22c55e', background: event.userRSVP === 'GOING' ? '#22c55e' : 'transparent' }}
                        >
                            ✓ Asistiré
                        </button>
                        <button
                            className={`${styles.rsvpButton} ${event.userRSVP === 'MAYBE' ? styles.active : ''}`}
                            onClick={() => handleRSVP('MAYBE')}
                            disabled={rsvpLoading}
                            style={{ borderColor: '#eab308', color: event.userRSVP === 'MAYBE' ? '#fff' : '#eab308', background: event.userRSVP === 'MAYBE' ? '#eab308' : 'transparent' }}
                        >
                            ? Tal vez
                        </button>
                        <button
                            className={`${styles.rsvpButton} ${event.userRSVP === 'NOT_GOING' ? styles.active : ''}`}
                            onClick={() => handleRSVP('NOT_GOING')}
                            disabled={rsvpLoading}
                            style={{ borderColor: '#ef4444', color: event.userRSVP === 'NOT_GOING' ? '#fff' : '#ef4444', background: event.userRSVP === 'NOT_GOING' ? '#ef4444' : 'transparent' }}
                        >
                            ✗ No asistiré
                        </button>
                    </div>
                    {event.requiresApproval && event.userRSVP === 'PENDING' && (
                        <p className={styles.pendingMessage}>⏳ Tu solicitud está pendiente de aprobación</p>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className={`card ${styles.tabsContainer}`}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'attendees' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('attendees')}
                    >
                        👥 Asistentes ({goingCount + maybeCount})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'discussion' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('discussion')}
                    >
                        💬 Discusión ({event._count.messages})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'photos' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('photos')}
                    >
                        📸 Fotos ({event._count.photos})
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'attendees' && (
                        <div className={styles.attendeesList}>
                            {event.attendees.length === 0 ? (
                                <p className={styles.emptyState}>Aún no hay asistentes confirmados</p>
                            ) : (
                                <>
                                    {['GOING', 'MAYBE', 'NOT_GOING', 'PENDING'].map(status => {
                                        const attendeesWithStatus = event.attendees.filter(a => a.rsvpStatus === status);
                                        if (attendeesWithStatus.length === 0) return null;

                                        return (
                                            <div key={status} className={styles.attendeeGroup}>
                                                <h4 className={styles.attendeeGroupTitle}>
                                                    {status === 'GOING' && '✓ Confirmados'}
                                                    {status === 'MAYBE' && '? Tal vez'}
                                                    {status === 'NOT_GOING' && '✗ No asistirán'}
                                                    {status === 'PENDING' && '⏳ Pendientes'}
                                                    {' '}({attendeesWithStatus.length})
                                                </h4>
                                                <div className={styles.attendeeGrid}>
                                                    {attendeesWithStatus.map(attendee => (
                                                        <div key={attendee.id} className={styles.attendeeCard}>
                                                            <div className={styles.attendeeAvatar}>
                                                                {attendee.user.avatarUrl ? (
                                                                    <img src={attendee.user.avatarUrl} alt={attendee.user.username} />
                                                                ) : (
                                                                    <div className={styles.avatarPlaceholder}>
                                                                        {attendee.user.username[0].toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={styles.attendeeInfo}>
                                                                <strong>{attendee.user.username}</strong>
                                                                {attendee.plusOnes > 0 && (
                                                                    <span className={styles.plusOnes}>+{attendee.plusOnes}</span>
                                                                )}
                                                                {attendee.responseMessage && (
                                                                    <p className={styles.responseMessage}>{attendee.responseMessage}</p>
                                                                )}
                                                                {attendee.plannedOutfit && (
                                                                    <div className={styles.plannedOutfit}>
                                                                        <img src={attendee.plannedOutfit.imageUrl} alt={attendee.plannedOutfit.name} />
                                                                        <span>Outfit planeado</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'discussion' && (
                        <EventChat eventId={eventId} />
                    )}

                    {activeTab === 'photos' && (
                        <EventPhotoGallery eventId={eventId} />
                    )}
                </div>
            </div>

            <Link href="/events" className="btn-secondary" style={{ marginTop: '20px', display: 'inline-block' }}>
                ← Volver a eventos
            </Link>
        </main>
    );
}
