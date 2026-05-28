'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

type Event = {
    id: string;
    title: string;
    description?: string;
    date: string;
    location: string;
    dressCode: string;
    imageUrl?: string;
    visibility?: string;
    category?: string;
    _count?: {
        attendees: number;
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

const rsvpColors: Record<string, string> = {
    'GOING': '#22c55e',
    'MAYBE': '#eab308',
    'NOT_GOING': '#ef4444',
    'PENDING': '#3b82f6'
};

export default function EventCard({ event }: { event: Event }) {
    const params = useParams();
    const locale = params?.locale || 'es';
    const eventDate = new Date(event.date);
    const visibility = event.visibility || 'PUBLIC';

    return (
        <Link href={`/${locale}/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                padding: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
            >
                {/* Cover Image */}
                {event.imageUrl && (
                    <div style={{
                        width: '100%',
                        height: '160px',
                        backgroundImage: `url(${event.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                    }}>
                        {/* Overlay gradient */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '60px',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
                        }} />
                    </div>
                )}

                {/* Content */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Badges Row */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {/* Visibility Badge */}
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: visibility === 'PUBLIC' ? 'var(--color-primary-alpha)' : 'var(--color-bg-elevated)',
                            color: 'var(--color-text)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {visibilityIcons[visibility]} {visibility === 'PUBLIC' ? 'Público' : visibility === 'PRIVATE' ? 'Privado' : 'Amigos'}
                        </span>

                        {/* Category Badge */}
                        {event.category && (
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: 'var(--color-bg-elevated)',
                                color: 'var(--color-text)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {categoryIcons[event.category] || '✨'} {event.category}
                            </span>
                        )}

                        {/* RSVP Status Badge */}
                        {event.userRSVP && (
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: rsvpColors[event.userRSVP] + '20',
                                color: rsvpColors[event.userRSVP],
                                border: `1px solid ${rsvpColors[event.userRSVP]}40`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {event.userRSVP === 'GOING' ? '✓ Asistiré' :
                                    event.userRSVP === 'MAYBE' ? '? Tal vez' :
                                        event.userRSVP === 'NOT_GOING' ? '✗ No asistiré' :
                                            '⏳ Pendiente'}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: 'var(--color-text)',
                        lineHeight: '1.3'
                    }}>
                        {event.title}
                    </h3>

                    {/* Description */}
                    {event.description && (
                        <p style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-dim)',
                            marginBottom: '12px',
                            lineHeight: '1.5',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {event.description}
                        </p>
                    )}

                    {/* Event Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-dim)', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>📅</span>
                            <span style={{ textTransform: 'capitalize' }}>
                                {eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>🕐</span>
                            <span>
                                {eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>📍</span>
                            <span>{event.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>👗</span>
                            <span>{event.dressCode}</span>
                        </div>

                        {/* Attendee Count */}
                        {event._count && event._count.attendees > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid var(--color-border)'
                            }}>
                                <span style={{ fontSize: '1.1rem' }}>👥</span>
                                <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                                    {event._count.attendees} {event._count.attendees === 1 ? 'asistente' : 'asistentes'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Accent Border */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    background: 'var(--gradient-primary)'
                }} />
            </div>
        </Link>
    );
}
