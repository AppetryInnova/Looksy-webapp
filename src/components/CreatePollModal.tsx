'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';
import BottomSheetModal from './BottomSheetModal';

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPollCreated: () => void;
}

export default function CreatePollModal({ isOpen, onClose, onPollCreated }: CreatePollModalProps) {
    const { data: session } = useSession();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [creating, setCreating] = useState(false);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 4) {
            setOptions([...options, '']);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = async () => {
        if (!question.trim() || options.some(o => !o.trim())) {
            alert('Por favor completa la pregunta y todas las opciones.');
            return;
        }

        if (!session?.user?.id) {
            alert('Debes iniciar sesión para crear una encuesta.');
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    options: options.map(text => ({ text })),
                    userId: session.user.id,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                })
            });

            if (res.ok) {
                onPollCreated();
                onClose();
                setQuestion('');
                setOptions(['', '']);
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
        <BottomSheetModal isOpen={isOpen} onClose={onClose} title="Crear Encuesta de Estilo">
            <div className="glass-premium" style={{ padding: '24px', borderRadius: '24px 24px 0 0', borderBottom: 'none' }}>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--color-text-dim)', fontWeight: '600' }}>Tu Pregunta</label>
                    <input
                        type="text"
                        placeholder="ej. ¿Qué zapatos combinan mejor?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--foreground)',
                            outline: 'none',
                            fontSize: '1rem',
                            transition: 'all 0.3s'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--color-text-dim)', fontWeight: '600' }}>Opciones</label>
                    {options.map((opt, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder={`Opción ${idx + 1}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--foreground)',
                                    outline: 'none',
                                    transition: 'all 0.3s'
                                }}
                            />
                            {options.length > 2 && (
                                <button onClick={() => removeOption(idx)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '10px', color: 'var(--color-alert, red)', cursor: 'pointer', padding: '0 16px', fontWeight: 'bold' }}>✕</button>
                            )}
                        </div>
                    ))}
                    {options.length < 4 && (
                        <button onClick={addOption} style={{
                            fontSize: '0.9em',
                            color: 'var(--color-primary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '8px',
                            fontWeight: '600'
                        }}>
                            + Añadir opción
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                    <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '12px' }}>Cancelar</button>
                    <button onClick={handleSubmit} disabled={creating} className="btn-luxury animate-fade-in-up" style={{ flex: 1, padding: '14px', borderRadius: '12px' }}>
                        {creating ? 'Creando...' : 'Publicar Encuesta'}
                    </button>
                </div>
            </div>
        </BottomSheetModal>
    );
}
