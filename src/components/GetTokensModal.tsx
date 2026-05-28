'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FaBolt, FaCreditCard, FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import logger from '@/lib/logger';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function GetTokensModal({ isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(false);

    const handlePurchase = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/checkout/tokens', { method: 'POST' });
            if (!res.ok) throw new Error('Error al crear la sesión de pago');
            
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (e) {
            logger.error('Error in handlePurchase:', e);
            alert('Hubo un problema al iniciar el pago.');
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    />
                    
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="glass-premium"
                        style={{
                            position: 'relative',
                            width: '100%', maxWidth: '420px',
                            padding: '32px', borderRadius: '32px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <button 
                            onClick={onClose}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}
                        >
                            <FaTimes size={20} />
                        </button>

                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px auto',
                            boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
                        }}>
                            <FaBolt size={40} color="white" />
                        </div>

                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
                            Oops! Te quedaste sin Energía
                        </h2>
                        <p style={{ color: 'var(--color-text-dim)', marginBottom: '24px', fontSize: '1rem', lineHeight: '1.5' }}>
                            Has agotado tus 5 Gravity Tokens gratuitos diarios para el Espejo Virtual. Vuelve mañana para recargar automáticamente, o compra un pack ahora.
                        </p>

                        <div style={{ 
                            background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px',
                            border: '1px solid var(--glass-border)', marginBottom: '24px'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>50 Tokens</h3>
                            <p style={{ color: '#10b981', fontWeight: 700, fontSize: '1.2rem', margin: '8px 0' }}>$1.99 USD</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0', textAlign: 'left', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
                                <li style={{ marginBottom: '8px' }}>✓ 50 usos del Espejo Virtual</li>
                                <li style={{ marginBottom: '8px' }}>✓ No expiran nunca</li>
                                <li>✓ Apoyas a Looksy Gravity 💖</li>
                            </ul>
                        </div>

                        <button 
                            onClick={handlePurchase}
                            disabled={loading}
                            className="btn-luxury"
                            style={{ 
                                width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                                background: 'white', color: 'black', fontWeight: 900, fontSize: '1.1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                            }}
                        >
                            {loading ? 'Redirigiendo...' : (
                                <>
                                    <FaCreditCard /> Comprar Tokens
                                </>
                            )}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
