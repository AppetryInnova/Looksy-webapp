import { useState } from 'react';
import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';

interface StarterWardrobeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StarterWardrobeModal({ isOpen, onClose, onSuccess }: StarterWardrobeModalProps) {
    const { data: session } = useSession();
    const [step, setStep] = useState(1);
    const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
    const [age, setAge] = useState<string>('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!gender || !age) return;
        setLoading(true);

        try {
            const res = await fetch('/api/wardrobe/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gender,
                    age,
                    userId: (session?.user as any)?.id || session?.user?.email
                })
            });

            const data = await res.json();
            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Error: ' + (data.error || 'Hubo un problema generando tu armario.'));
            }
        } catch (error) {
            logger.error(error);
            alert('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            background: 'rgba(0,0,0,0.5)'
        }}>
            <div className="card" style={{
                width: '90%',
                maxWidth: '400px',
                padding: '32px',
                background: 'var(--color-surface)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                textAlign: 'center'
            }}>
                {loading ? (
                    <div style={{ padding: '40px 0' }}>
                        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p>Diseñando tu armario...</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>
                                {step === 1 ? '¡Bienvenido a Looksy!' : 'Casi listo...'}
                            </h2>
                            <p style={{ opacity: 0.7 }}>
                                {step === 1
                                    ? 'Tu armario está vacío. Déjanos sugerirte prendas básicas según tu estilo para comenzar.'
                                    : 'Personaliza tu experiencia.'}
                            </p>
                        </div>

                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={() => { setGender('FEMALE'); setStep(2); }}
                                    className="btn-secondary"
                                    style={{ padding: '16px', justifyContent: 'center' }}
                                >
                                    Femenino
                                </button>
                                <button
                                    onClick={() => { setGender('MALE'); setStep(2); }}
                                    className="btn-secondary"
                                    style={{ padding: '16px', justifyContent: 'center' }}
                                >
                                    Masculino
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Tu Edad</label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="Ej: 25"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--color-text)'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={!age}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '14px' }}
                                >
                                    ✨ Generar Armario Mágico
                                </button>
                                <button
                                    onClick={() => setStep(1)}
                                    style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem' }}
                                >
                                    Atrás
                                </button>
                            </div>
                        )}

                        <button onClick={onClose} style={{
                            position: 'absolute', top: '16px', right: '16px', opacity: 0.5
                        }}>✕</button>
                    </>
                )}
            </div>
        </div>
    );
}
