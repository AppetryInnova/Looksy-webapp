'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

type Challenge = {
    id: string | number;
    title: string;
    description: string;
    participants: string;
    timeLeft: string; 
    xp: number;
    badgeName: string;
    image: string; 
    difficulty: 'Easy' | 'Medium' | 'Hard';
    rules: string[];
};

export default function ChallengeDetailModal({ challenge, isOpen, onClose }: { challenge: Challenge | null; isOpen: boolean; onClose: () => void }) {
    const router = useRouter();
    const locale = useLocale();

    if (!isOpen || !challenge) return null;

    const handleAccept = () => {
        onClose();
        router.push(`/${locale}/scanner?mode=challenge&challengeId=${challenge.id}`);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            padding: '16px'
        }} onClick={onClose}>
            <div className="glass-premium animate-fade-in-up" style={{
                width: '100%', maxWidth: '540px', padding: 0, overflow: 'hidden', position: 'relative',
                maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: '28px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '20px', right: '20px', zIndex: 10,
                        background: 'rgba(255,255,255,0.1)', width: '36px', height: '36px', borderRadius: '50%',
                        color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    ✕
                </button>

                {/* Hero Image Section */}
                <div style={{ height: '260px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ 
                        position: 'absolute', inset: 0, 
                        backgroundImage: `url(${challenge.image})`,
                        backgroundPosition: 'center', backgroundSize: 'cover',
                        transition: 'transform 0.5s ease'
                    }}></div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}></div>
                    
                    <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
                        <div style={{
                            background: challenge.difficulty === 'Hard' ? '#ef4444' : challenge.difficulty === 'Medium' ? '#f59e0b' : '#10b981',
                            padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', color: 'white', display: 'inline-block', marginBottom: '10px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {challenge.difficulty}
                        </div>
                        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'white', lineHeight: 1.1, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                            {challenge.title}
                        </h2>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Stats Boxes */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1, padding: '16px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Tiempo</div>
                            <div style={{ fontWeight: '900', color: '#ef4444', fontSize: '1.2rem' }}>{challenge.timeLeft}</div>
                        </div>
                        <div style={{ flex: 1, padding: '16px 8px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Recompensa</div>
                            <div style={{ fontWeight: '900', color: '#a855f7', fontSize: '1.2rem' }}>+{challenge.xp} XP</div>
                        </div>
                        <div style={{ flex: 1, padding: '16px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Participantes</div>
                            <div style={{ fontWeight: '900', fontSize: '1.2rem' }}>{challenge.participants}</div>
                        </div>
                    </div>

                    {/* Description */}
                    <section>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
                            Sobre este Reto
                        </h3>
                        <p style={{ color: 'var(--color-text)', fontSize: '1.05rem', lineHeight: '1.6', opacity: 0.9 }}>
                            {challenge.description}
                        </p>
                    </section>

                    {/* Rules */}
                    <section style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--glass-border)' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-dim)', marginBottom: '16px' }}>
                            Reglas de Participación
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {challenge.rules.map((rule, i) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>
                                        {i + 1}
                                    </div>
                                    <span style={{ fontSize: '0.95rem', color: 'var(--color-text)', opacity: 0.85 }}>{rule}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA Section */}
                    <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                        <button 
                            onClick={handleAccept} 
                            className="btn-luxury" 
                            style={{ 
                                width: '100%', padding: '20px', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 900,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                boxShadow: '0 10px 25px rgba(16,185,129,0.3)'
                            }}
                        >
                            <span>📸</span> Aceptar Reto
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '16px', fontStyle: 'italic' }}>
                            ¡Muestra tu estilo y sube en el ranking global!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
