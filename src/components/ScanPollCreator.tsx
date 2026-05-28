'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';

interface ScanPollCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onPollCreated: () => void;
    scanId: string;
    scanImageUrl: string;
}

interface WardrobeItem {
    id: string;
    imageUrl: string;
    category: string;
}

interface PollOptionData {
    text: string;
    imageUrl: string;
}

export default function ScanPollCreator({ isOpen, onClose, onPollCreated, scanId, scanImageUrl }: ScanPollCreatorProps) {
    const { data: session } = useSession();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<PollOptionData[]>([
        { text: '', imageUrl: '' },
        { text: '', imageUrl: '' }
    ]);
    const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
    const [showWardrobeModal, setShowWardrobeModal] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen && session?.user?.id) {
            // Fetch user's wardrobe items
            fetch('/api/items')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setWardrobeItems(data.filter((item: WardrobeItem) => item.imageUrl));
                    }
                })
                .catch((err: unknown) => logger.error('Error fetching wardrobe items for poll:', err));
        }
    }, [isOpen, session]);

    if (!isOpen) return null;

    const handleOptionTextChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleSelectWardrobeItem = (index: number, item: WardrobeItem) => {
        const newOptions = [...options];
        newOptions[index].imageUrl = item.imageUrl;
        if (!newOptions[index].text) {
            newOptions[index].text = item.category;
        }
        setOptions(newOptions);
        setShowWardrobeModal(null);
    };

    const handleImageUpload = async (index: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                const newOptions = [...options];
                newOptions[index].imageUrl = data.url;
                setOptions(newOptions);
            }
        } catch (error) {
            logger.error('Upload failed:', error);
            alert('Error al subir la imagen');
        }
    };

    const addOption = () => {
        if (options.length < 4) {
            setOptions([...options, { text: '', imageUrl: '' }]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async () => {
        if (!question.trim()) {
            alert('Por favor escribe una pregunta.');
            return;
        }

        if (options.some(o => !o.text.trim() || !o.imageUrl)) {
            alert('Todas las opciones deben tener texto e imagen.');
            return;
        }

        if (!session?.user?.id) {
            alert('Debes iniciar sesión.');
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    options,
                    userId: session.user.id,
                    scanId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                })
            });

            if (res.ok) {
                onPollCreated();
                onClose();
                setQuestion('');
                setOptions([{ text: '', imageUrl: '' }, { text: '', imageUrl: '' }]);
            } else {
                alert('Error al crear la encuesta');
            }
        } catch (error) {
            logger.error(error);
            alert('Error al crear la encuesta');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            overflowY: 'auto',
            padding: '20px'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '600px',
                padding: '24px',
                background: 'var(--color-surface)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <h2 style={{ marginBottom: '16px', color: 'var(--color-text)' }}>Pedir Consejo de Estilo</h2>

                {/* Outfit Context */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85em', color: 'var(--color-text-dim)' }}>Tu Outfit</label>
                    <img
                        src={scanImageUrl}
                        alt="Outfit"
                        style={{
                            width: '100%',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            border: '2px solid var(--color-primary)'
                        }}
                    />
                </div>

                {/* Question */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--color-text-dim)' }}>
                        ¿Qué necesitas decidir?
                    </label>
                    <input
                        type="text"
                        placeholder="ej. ¿Qué zapatos combinan mejor?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Options */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9em', color: 'var(--color-text-dim)' }}>
                        Opciones (con imágenes)
                    </label>
                    {options.map((opt, idx) => (
                        <div key={idx} style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder={`Opción ${idx + 1}`}
                                    value={opt.text}
                                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white'
                                    }}
                                />
                                {options.length > 2 && (
                                    <button onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.2em' }}>✕</button>
                                )}
                            </div>

                            {/* Image Preview or Upload */}
                            {opt.imageUrl ? (
                                <div style={{ position: 'relative' }}>
                                    <img src={opt.imageUrl} alt={`Option ${idx + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <button
                                        onClick={() => {
                                            const newOptions = [...options];
                                            newOptions[idx].imageUrl = '';
                                            setOptions(newOptions);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: 'rgba(0,0,0,0.7)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >✕</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setShowWardrobeModal(idx)}
                                        className="btn-secondary"
                                        style={{ flex: 1, fontSize: '0.85em', padding: '8px' }}
                                    >
                                        📦 Desde Ropero
                                    </button>
                                    <label style={{ flex: 1 }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(idx, file);
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="btn-secondary" style={{ fontSize: '0.85em', padding: '8px', textAlign: 'center', cursor: 'pointer' }}>
                                            📸 Subir Foto
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    ))}
                    {options.length < 4 && (
                        <button onClick={addOption} style={{
                            fontSize: '0.85em',
                            color: 'var(--color-primary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '4px'
                        }}>
                            + Añadir opción
                        </button>
                    )}
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                    <button onClick={handleSubmit} disabled={creating} className="btn-primary" style={{ flex: 1 }}>
                        {creating ? 'Creando...' : 'Publicar Encuesta'}
                    </button>
                </div>
            </div>

            {/* Wardrobe Selection Modal */}
            {showWardrobeModal !== null && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001
                }} onClick={() => setShowWardrobeModal(null)}>
                    <div className="card" style={{
                        width: '90%',
                        maxWidth: '500px',
                        padding: '20px',
                        maxHeight: '70vh',
                        overflowY: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '16px' }}>Selecciona del Ropero</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {wardrobeItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSelectWardrobeItem(showWardrobeModal, item)}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '2px solid transparent',
                                        transition: 'border 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.border = '2px solid var(--color-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.border = '2px solid transparent'}
                                >
                                    <img src={item.imageUrl} alt={item.category} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowWardrobeModal(null)} className="btn-secondary" style={{ width: '100%', marginTop: '16px' }}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
