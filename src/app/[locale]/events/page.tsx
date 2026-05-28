'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import EmptyState from '@/components/EmptyState';
import { logger } from '@/lib/logger';
import { showToast } from '@/components/Toast';

type Event = {
    id: string;
    title: string;
    date: string;
    location: string;
    dressCode: string;
};

import styles from './events.module.css';

import { useSession } from 'next-auth/react';

export default function EventsPage() {
    const { data: session } = useSession();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [dressCode, setDressCode] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [category, setCategory] = useState('');
    const [maxAttendees, setMaxAttendees] = useState('');
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [creating, setCreating] = useState(false);

    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = () => {
        fetch('/api/events')
            .then((res) => res.json())
            .then((data) => {
                setEvents(data);
                setLoading(false);
            });
    };

    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const now = new Date();
        // Reset time for accurate date comparison
        now.setHours(0, 0, 0, 0);

        if (filter === 'upcoming') {
            return eventDate >= now;
        } else {
            return eventDate < now;
        }
    }).sort((a, b) => {
        // Sort upcoming: nearest first
        // Sort past: most recent first
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return filter === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) return;
        setCreating(true);

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    date,
                    endTime: endTime || null,
                    location,
                    dressCode,
                    imageUrl: imageUrl || null,
                    visibility,
                    category: category || null,
                    maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
                    requiresApproval
                }),
            });

            if (res.ok) {
                setShowModal(false);
                setTitle('');
                setDescription('');
                setDate('');
                setEndTime('');
                setLocation('');
                setDressCode('');
                setImageUrl('');
                setVisibility('PUBLIC');
                setCategory('');
                setMaxAttendees('');
                setRequiresApproval(false);
                fetchEvents(); // Refresh list
                showToast('¡Evento creado con éxito!', 'success');
            } else {
                showToast('Error al crear el evento', 'error');
            }
        } catch (error) {
            logger.error('Error creating event:', error);
            showToast('Error al crear el evento', 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>The Lobby</h1>
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ Crear Evento</button>
            </header>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => setFilter('upcoming')}
                    className={filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}
                >
                    Próximos
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={filter === 'past' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}
                >
                    Pasados
                </button>
            </div>



            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Cargando eventos...</p>
                </div>
            ) : (
                <div className={styles.eventsGrid}>
                    {filteredEvents.length === 0 ? (
                        <div style={{ gridColumn: '1/-1' }}>
                            <EmptyState
                                icon="📅"
                                title={`No hay eventos ${filter === 'upcoming' ? 'próximos' : 'pasados'}`}
                                description={filter === 'upcoming' ? '¡Crea uno nuevo para empezar!' : 'No tienes eventos en el historial.'}
                                action={filter === 'upcoming' ? {
                                    label: '+ Crear Evento',
                                    onClick: () => setShowModal(true)
                                } : undefined}
                            />
                        </div>
                    ) : (
                        filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))
                    )}
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay}>
                    <form onSubmit={handleCreate} className={`card ${styles.modalContent}`}>
                        <h2 className={styles.modalTitle}>Nuevo Evento</h2>
                        <div className={styles.form}>
                            <input
                                type="text"
                                placeholder="Título del Evento"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className={styles.input}
                            />
                            <textarea
                                placeholder="Descripción (opcional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={styles.input}
                                rows={3}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input
                                    type="datetime-local"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className={styles.input}
                                    placeholder="Inicio"
                                />
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className={styles.input}
                                    placeholder="Fin (opcional)"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Ubicación"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                                className={styles.input}
                            />
                            <input
                                type="text"
                                placeholder="Dress Code (ej. Cocktail, Casual)"
                                value={dressCode}
                                onChange={(e) => setDressCode(e.target.value)}
                                required
                                className={styles.input}
                            />
                            <input
                                type="url"
                                placeholder="URL de Imagen (opcional)"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className={styles.input}
                            />
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className={styles.input}
                            >
                                <option value="PUBLIC">🌍 Público</option>
                                <option value="PRIVATE">🔒 Privado</option>
                                <option value="FRIENDS_ONLY">👥 Solo Amigos</option>
                            </select>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={styles.input}
                            >
                                <option value="">Categoría (opcional)</option>
                                <option value="Party">🎉 Fiesta</option>
                                <option value="Fashion Show">👗 Desfile de Moda</option>
                                <option value="Meetup">☕ Encuentro</option>
                                <option value="Shopping">🛍️ Shopping</option>
                                <option value="Networking">🤝 Networking</option>
                                <option value="Other">✨ Otro</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Máximo de Asistentes (opcional)"
                                value={maxAttendees}
                                onChange={(e) => setMaxAttendees(e.target.value)}
                                className={styles.input}
                                min="1"
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={requiresApproval}
                                    onChange={(e) => setRequiresApproval(e.target.checked)}
                                />
                                <span>Requiere aprobación del host</span>
                            </label>
                            <div className={styles.buttonGroup}>
                                <button type="submit" className={`btn-primary ${styles.createButton}`} disabled={creating}>
                                    {creating ? 'Creando...' : 'Crear'}
                                </button>
                                <button type="button" className={`btn-secondary ${styles.cancelButton}`} onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
