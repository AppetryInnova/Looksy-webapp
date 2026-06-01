'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import EventCard from '@/components/EventCard';
import EmptyState from '@/components/EmptyState';
import { logger } from '@/lib/logger';
import { showToast } from '@/components/Toast';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './events.module.css';

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

export default function EventsPage() {
    const { data: session } = useSession();
    const t = useTranslations('EventsPage');
    const locale = useLocale();
    
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Wizard step state
    const [currentStep, setCurrentStep] = useState(1);

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
            })
            .catch((err) => {
                logger.error('Error fetching events:', err);
                setLoading(false);
            });
    };

    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (filter === 'upcoming') {
            return eventDate >= now;
        } else {
            return eventDate < now;
        }
    }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return filter === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

    const resetForm = () => {
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
        setCurrentStep(1);
    };

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
                resetForm();
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

    // Step navigation validations
    const isStepValid = () => {
        if (currentStep === 1) return title.trim() !== '';
        if (currentStep === 2) return date.trim() !== '' && location.trim() !== '';
        if (currentStep === 3) return dressCode.trim() !== '';
        return true;
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isStepValid()) {
            setCurrentStep(prev => Math.min(prev + 1, 5));
        } else {
            showToast('Por favor completa todos los campos requeridos.', 'error');
        }
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const steps = [
        { number: 1, label: 'Detalles' },
        { number: 2, label: 'Fecha' },
        { number: 3, label: 'Estilo' },
        { number: 4, label: 'Ajustes' },
        { number: 5, label: 'Confirmar' }
    ];

    // Mock event data to pass to EventCard for preview
    const previewEventData: Event = {
        id: 'preview',
        title: title || 'Título del Evento',
        description: description || 'Esta es una vista previa de la descripción de tu evento de moda.',
        date: date || new Date().toISOString(),
        location: location || 'Ubicación seleccionada',
        dressCode: dressCode || 'Código de vestimenta',
        imageUrl: imageUrl || undefined,
        visibility: visibility,
        category: category || undefined,
        _count: { attendees: 1 },
        userRSVP: 'GOING'
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>The Lobby</h1>
                <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Crear Evento</button>
            </header>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <button
                    onClick={() => setFilter('upcoming')}
                    className={filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '10px 20px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                    Próximos
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={filter === 'past' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '10px 20px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                    Pasados
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', width: '100%' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10b981', borderRadius: '50%' }} className="animate-spin" />
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
                                    onClick: () => { resetForm(); setShowModal(true); }
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

            {/* Wizard Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className={styles.modalOverlay}>
                        <motion.div 
                            className={styles.modalContent}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className={styles.modalTitle}>Crear Evento</h2>
                                <button 
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', cursor: 'pointer' }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Step Indicator */}
                            <div className={styles.stepIndicator}>
                                {steps.map((s, idx) => (
                                    <React.Fragment key={s.number}>
                                        <div 
                                            className={`${styles.stepDot} ${
                                                currentStep === s.number 
                                                    ? styles.stepDotActive 
                                                    : currentStep > s.number 
                                                        ? styles.stepDotCompleted 
                                                        : ''
                                            }`}
                                        >
                                            {currentStep > s.number ? '✓' : s.number}
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div 
                                                className={`${styles.stepLine} ${
                                                    currentStep > s.number ? styles.stepLineActive : ''
                                                }`} 
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Guided Step Forms */}
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <AnimatePresence mode="wait">
                                    {currentStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            className={styles.formSection}
                                            initial={{ x: 15, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -15, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Título del Evento *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Desfile Otoño-Invierno 2026"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    required
                                                    className={styles.input}
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Categoría</label>
                                                <select
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    className={styles.select}
                                                >
                                                    <option value="">Selecciona una categoría (opcional)</option>
                                                    <option value="Party">🎉 Fiesta</option>
                                                    <option value="Fashion Show">👗 Desfile de Moda</option>
                                                    <option value="Meetup">☕ Encuentro</option>
                                                    <option value="Shopping">🛍️ Shopping</option>
                                                    <option value="Networking">🤝 Networking</option>
                                                    <option value="Other">✨ Otro</option>
                                                </select>
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Descripción</label>
                                                <textarea
                                                    placeholder="Detalles sobre el evento..."
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className={styles.textarea}
                                                    rows={4}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            className={styles.formSection}
                                            initial={{ x: 15, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -15, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Fecha y Hora de Inicio *</label>
                                                <input
                                                    type="datetime-local"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    required
                                                    className={styles.input}
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Fecha y Hora de Fin</label>
                                                <input
                                                    type="datetime-local"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    className={styles.input}
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Ubicación *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Dirección, club o link de videollamada"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    required
                                                    className={styles.input}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            className={styles.formSection}
                                            initial={{ x: 15, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -15, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Dress Code *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Black Tie, Casual Elegante"
                                                    value={dressCode}
                                                    onChange={(e) => setDressCode(e.target.value)}
                                                    required
                                                    className={styles.input}
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>URL de Imagen de Portada</label>
                                                <input
                                                    type="url"
                                                    placeholder="https://ejemplo.com/portada.jpg"
                                                    value={imageUrl}
                                                    onChange={(e) => setImageUrl(e.target.value)}
                                                    className={styles.input}
                                                />
                                            </div>

                                            {imageUrl && (
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.label}>Vista Previa de Imagen</label>
                                                    <div 
                                                        className={styles.previewBanner}
                                                        style={{ backgroundImage: `url(${imageUrl})` }}
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {currentStep === 4 && (
                                        <motion.div
                                            key="step4"
                                            className={styles.formSection}
                                            initial={{ x: 15, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -15, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Privacidad del Evento</label>
                                                <select
                                                    value={visibility}
                                                    onChange={(e) => setVisibility(e.target.value)}
                                                    className={styles.select}
                                                >
                                                    <option value="PUBLIC">🌍 Público (Cualquiera en Looksy)</option>
                                                    <option value="PRIVATE">🔒 Privado (Solo invitados)</option>
                                                    <option value="FRIENDS_ONLY">👥 Solo Amigos (Tus seguidores mutuos)</option>
                                                </select>
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Capacidad Máxima</label>
                                                <input
                                                    type="number"
                                                    placeholder="Ilimitado si se deja vacío"
                                                    value={maxAttendees}
                                                    onChange={(e) => setMaxAttendees(e.target.value)}
                                                    className={styles.input}
                                                    min="1"
                                                />
                                            </div>

                                            <div className={styles.inputGroup} style={{ marginTop: '8px' }}>
                                                <label className={styles.checkboxLabel}>
                                                    <input
                                                        type="checkbox"
                                                        checked={requiresApproval}
                                                        onChange={(e) => setRequiresApproval(e.target.checked)}
                                                    />
                                                    <span>Requiere aprobación del host para asistir</span>
                                                </label>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 5 && (
                                        <motion.div
                                            key="step5"
                                            className={styles.formSection}
                                            initial={{ x: 15, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -15, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <label className={styles.label}>Vista Previa de la Cartelera</label>
                                            <div style={{ pointerEvents: 'none', border: '1px dashed rgba(16, 185, 129, 0.3)', borderRadius: '24px', padding: '4px', overflow: 'hidden' }}>
                                                <EventCard event={previewEventData} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Wizard Navigation Buttons */}
                                <div className={styles.buttonGroup}>
                                    {currentStep > 1 && (
                                        <button 
                                            type="button" 
                                            className={`btn-secondary ${styles.navBtn}`} 
                                            onClick={handleBack}
                                        >
                                            Atrás
                                        </button>
                                    )}
                                    
                                    {currentStep < 5 ? (
                                        <button 
                                            type="button" 
                                            className={`btn-primary ${styles.navBtn}`} 
                                            onClick={handleNext}
                                        >
                                            Siguiente
                                        </button>
                                    ) : (
                                        <button 
                                            type="submit" 
                                            className={`btn-primary ${styles.navBtn}`} 
                                            disabled={creating}
                                        >
                                            {creating ? 'Creando Evento...' : 'Crear Evento ✨'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
