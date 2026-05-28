'use client';

import { useState, useEffect, useRef } from 'react';

interface CheckoutModalProps {
    plan: 'ELITE' | 'PRO';
    price: string;
    onClose: () => void;
    onSuccess: (plan: string) => void;
}

type Step = 'form' | 'processing' | 'success';

export default function CheckoutModal({ plan, price, onClose, onSuccess }: CheckoutModalProps) {
    const [step, setStep] = useState<Step>('form');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [confettiPieces, setConfettiPieces] = useState<{ id: number; x: number; color: string; delay: number }[]>([]);

    const isValid = cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length === 3 && name.trim().length > 2;

    const formatCard = (v: string) => {
        const digits = v.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    };

    const formatExpiry = (v: string) => {
        const digits = v.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return digits;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setStep('processing');

        // Call checkout API
        const res = await fetch('/api/subscription/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan, paymentMethod: 'card' }),
        });

        if (res.ok) {
            // Generate confetti particles
            const pieces = Array.from({ length: 24 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)],
                delay: Math.random() * 0.6,
            }));
            setConfettiPieces(pieces);
            setStep('success');
        } else {
            setStep('form');
            alert('Error al procesar el pago. Intenta de nuevo.');
        }
    };

    const planDetails = {
        ELITE: { icon: '⭐', color: '#10b981', features: ['Scans ilimitados', 'Análisis beauty premium', 'Badge exclusivo', 'Acceso anticipado'] },
        PRO: { icon: '🚀', color: '#a855f7', features: ['Todo de ELITE', 'Soporte prioritario', 'Analytics avanzados'] },
    };
    const details = planDetails[plan];

    return (
        <>
            <div
                onClick={step !== 'processing' ? onClose : undefined}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 999
                }}
            />

            {/* Modal */}
            <div className="glass-premium" style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '95%', maxWidth: 420,
                zIndex: 1000,
                padding: '1.75rem',
                overflow: 'hidden',
                animation: 'fadeScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                {/* Background gradient */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 120,
                    background: `radial-gradient(ellipse at 50% 0%, ${details.color}30, transparent 70%)`,
                    pointerEvents: 'none',
                }} />

                {/* Confetti */}
                {step === 'success' && confettiPieces.map(p => (
                    <div key={p.id} style={{
                        position: 'absolute', left: `${p.x}%`, top: -10,
                        width: 8, height: 8, borderRadius: 2,
                        background: p.color,
                        animation: `confettiFall 1.5s ${p.delay}s ease-in forwards`,
                        zIndex: 10,
                    }} />
                ))}

                {step === 'form' && (
                    <>
                        {/* Header */}
                        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '1.5rem' }}>
                            <button onClick={onClose} style={{
                                position: 'absolute', right: 0, top: 0,
                                background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
                                width: 30, height: 30, cursor: 'pointer', color: 'var(--color-text-dim)'
                            }}>×</button>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{details.icon}</div>
                            <h2 className="text-luxury" style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Plan {plan}</h2>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: details.color }}>{price}
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', fontWeight: 400 }}>/mes</span>
                            </div>
                        </div>

                        {/* Features */}
                        <div style={{
                            background: `${details.color}10`, borderRadius: 14,
                            padding: '0.875rem', marginBottom: '1.25rem',
                            border: `1px solid ${details.color}30`
                        }}>
                            {details.features.map(f => (
                                <div key={f} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                                    <span style={{ color: details.color }}>✓</span> {f}
                                </div>
                            ))}
                        </div>

                        {/* Payment form */}
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '0.875rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                                    Nombre en la tarjeta
                                </label>
                                <input
                                    value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Juan García"
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem', borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '0.875rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                                    Número de tarjeta
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        value={cardNumber}
                                        onChange={e => setCardNumber(formatCard(e.target.value))}
                                        placeholder="4242 4242 4242 4242"
                                        maxLength={19}
                                        style={{
                                            width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: 12,
                                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                                            boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '0.05em'
                                        }}
                                    />
                                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>💳</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                                        Vencimiento
                                    </label>
                                    <input
                                        value={expiry}
                                        onChange={e => setExpiry(formatExpiry(e.target.value))}
                                        placeholder="MM/AA"
                                        maxLength={5}
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: 12,
                                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                                            boxSizing: 'border-box', fontFamily: 'monospace'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                                        CVV
                                    </label>
                                    <input
                                        value={cvv}
                                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        placeholder="•••"
                                        maxLength={3}
                                        type="password"
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: 12,
                                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                                            boxSizing: 'border-box', fontFamily: 'monospace'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Demo hint */}
                            <div style={{
                                background: 'rgba(168,85,247,0.08)', borderRadius: 10, padding: '0.5rem 0.75rem',
                                fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '1rem',
                                border: '1px solid rgba(168,85,247,0.2)'
                            }}>
                                💡 Demo: usa <strong>4242 4242 4242 4242</strong>, cualquier fecha y CVV válidos
                            </div>

                            <button
                                type="submit"
                                disabled={!isValid}
                                className={isValid ? "btn-luxury" : ""}
                                style={{
                                    width: '100%', padding: '0.875rem',
                                    background: !isValid ? 'var(--glass-surface)' : undefined,
                                    border: !isValid ? '1px solid var(--glass-border)' : undefined,
                                    opacity: isValid ? 1 : 0.5, cursor: isValid ? 'pointer' : 'not-allowed',
                                    borderRadius: '14px'
                                }}
                            >
                                Pagar {price}/mes →
                            </button>

                            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.75rem' }}>
                                🔒 Pago seguro · Cancela cuando quieras
                            </div>
                        </form>
                    </>
                )}

                {step === 'processing' && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: '1rem' }}>⚡</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Procesando pago...</div>
                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Un momento</div>
                    </div>
                )}

                {step === 'success' && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 5 }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounceIn 0.6s ease' }}>🎉</div>
                        <h2 style={{ fontWeight: 900, fontSize: '1.4rem', marginBottom: '0.5rem' }}>¡Bienvenido a {plan}!</h2>
                        <p style={{ color: 'var(--color-text-dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Tu suscripción está activa. Disfruta de todos los beneficios premium.
                        </p>
                        <button
                            onClick={() => onSuccess(plan)}
                            className="btn-luxury animate-fade-in-up"
                            style={{ width: '100%', padding: '0.875rem', borderRadius: 14 }}
                        >
                            ¡Empezar a usar {plan}! →
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeScaleIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes bounceIn {
                    from { transform: scale(0); opacity: 0; }
                    80% { transform: scale(1.15); }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes confettiFall {
                    to { transform: translateY(500px) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </>
    );
}
