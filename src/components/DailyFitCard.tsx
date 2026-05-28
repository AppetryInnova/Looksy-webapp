'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedImage from '@/components/OptimizedImage';
import { useRouter } from '@/i18n/routing';
import posthog from 'posthog-js';

interface DailyFitData {
    weather: { temperature: number; condition: string };
    recommendation: {
        message: string;
        items: Array<{ id: string; category: string; imageUrl: string; color: string; style: string }>;
        generalSuggestions: string[];
        confidence: number;
    };
}

export default function DailyFitCard() {
    const router = useRouter();
    const [data, setData] = useState<DailyFitData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        fetch('/api/daily-fit', { signal: controller.signal })
            .then(res => {
                // 401 = not logged in → silently hide
                if (res.status === 401) { setLoading(false); return null; }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(parsed => {
                if (parsed) {
                    setData(parsed);
                    posthog.capture('daily_fit_viewed', { 
                        temp: parsed.weather.temperature,
                        condition: parsed.weather.condition
                    });
                }
                setLoading(false);

            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                setError(true);
                setLoading(false);
            });

        return () => controller.abort();
    }, []);

    // While loading, show a beautiful atmospheric placeholder
    // so the first snap item is NOT blank
    const bgStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f2027 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        paddingBottom: '110px',
    };

    if (loading) {
        return (
            <div style={bgStyle}>
                <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ textAlign: 'center' }}
                >
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✨</div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
                        Preparando tu look del día...
                    </h2>
                    <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>
                        Tu estilista IA está analizando el clima
                    </p>
                    <div style={{ marginTop: '30px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.div
                                key={i}
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay }}
                                style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    // On error or unauthenticated → return null so the snap item is skipped
    if (error || !data) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{
                    ...bgStyle,
                    overflowY: 'auto',
                    justifyContent: 'flex-start',
                    gap: '20px',
                }}
            >
                {/* Weather Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', paddingTop: '20px' }}
                >
                    <div style={{ fontSize: '1rem', letterSpacing: '0.1em', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Look del Día
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 800 }}>
                        {data.weather.temperature}°C
                    </h1>
                    <p style={{ opacity: 0.75, fontSize: '1rem', margin: '4px 0 0' }}>
                        {data.weather.condition}
                    </p>
                </motion.div>

                {/* AI Message Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '28px',
                        padding: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', flexShrink: 0
                        }}>✨</div>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>AI Stylist</span>
                        <span style={{
                            marginLeft: 'auto', padding: '3px 10px', borderRadius: '20px',
                            background: 'rgba(16,185,129,0.15)', color: '#10b981',
                            fontSize: '0.75rem', fontWeight: 700
                        }}>
                            {data.recommendation.confidence}% match
                        </span>
                    </div>

                    <p style={{ fontSize: '1rem', lineHeight: 1.6, opacity: 0.9, fontStyle: 'italic', margin: 0 }}>
                        "{data.recommendation.message}"
                    </p>

                    {/* Wardrobe items */}
                    {data.recommendation.items.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                            {data.recommendation.items.map(item => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ scale: 1.05 }}
                                    style={{
                                        width: '90px', height: '90px', borderRadius: '14px',
                                        overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)',
                                        flexShrink: 0
                                    }}
                                >
                                    <OptimizedImage
                                        src={item.imageUrl}
                                        alt={item.category}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '14px', borderRadius: '14px' }}>
                            <p style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>Tips para hoy:</p>
                            <ul style={{ margin: 0, opacity: 0.8, paddingLeft: '18px', fontSize: '0.875rem', lineHeight: 1.7 }}>
                                {data.recommendation.generalSuggestions?.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                            <button
                                onClick={() => {
                                    posthog.capture('daily_fit_wardrobe_redirect');
                                    router.push('/wardrobe');
                                }}

                                style={{
                                    marginTop: '14px', width: '100%', padding: '11px',
                                    borderRadius: '12px', background: 'white', color: '#0f172a',
                                    border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                + Agregar prendas al armario
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* CTA Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        posthog.capture('daily_fit_adopted', { 
                            score: data.recommendation.confidence,
                            itemsCount: data.recommendation.items.length
                        });
                    }}
                    style={{

                        width: '100%',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        padding: '17px',
                        borderRadius: '20px',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        cursor: 'pointer',
                        boxShadow: '0 12px 28px rgba(16, 185, 129, 0.35)',
                        letterSpacing: '0.03em'
                    }}
                >
                    🔥 Adoptar este look
                </motion.button>
            </motion.div>
        </AnimatePresence>
    );
}
