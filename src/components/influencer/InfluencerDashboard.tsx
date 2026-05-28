'use client'

import { useState, useEffect } from 'react'
import SocialConnect from './SocialConnect'
import logger from '@/lib/logger'
import posthog from 'posthog-js'
import { motion } from 'framer-motion'
import { FaUserFriends, FaWallet, FaPercentage, FaArrowUp, FaCrown, FaRocket } from 'react-icons/fa'

export default function InfluencerDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/influencer/stats')
            if (!res.ok) throw new Error('Failed to fetch stats')
            const data = await res.json()
            setStats(data)
        } catch (e) {
            logger.error(e)
            setError(true)
        } finally {
            setLoading(false);
            if (stats) {
                posthog.capture('influencer_dashboard_viewed', { 
                    isInfluencer: stats.isInfluencer,
                    followers: stats.totalFollowers
                });
            }
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    if (loading) return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }}></div>
        </div>
    )

    if (error || !stats) return (
        <div className="glass-premium" style={{ textAlign: 'center', padding: '60px 40px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Oops! Algo salió mal</h3>
            <p style={{ color: 'var(--color-text-dim)', marginBottom: '32px' }}>No pudimos cargar tus métricas de influencer en este momento.</p>
            <button className="btn-luxury" onClick={fetchStats} style={{ padding: '12px 32px' }}>Reintentar</button>
        </div>
    )

    const isInfluencer = stats.isInfluencer;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            
            {/* Main Status Card */}
            <div className="glass-premium" style={{ 
                gridColumn: 'span 2', 
                padding: '32px', 
                borderRadius: '32px', 
                position: 'relative', 
                overflow: 'hidden',
                border: '1px solid var(--glass-border)',
                background: isInfluencer 
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))' 
                    : 'var(--glass-surface)'
            }}>
                {/* Background Glow */}
                <div style={{ 
                    position: 'absolute', top: '-100px', right: '-100px', 
                    width: '300px', height: '300px', 
                    background: isInfluencer ? 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)' : 'transparent',
                    zIndex: 0 
                }}></div>

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'start', justifyContent: 'space-between', gap: '24px', marginBottom: '40px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Perfil de Creador</h2>
                                <span style={{
                                    padding: '6px 14px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    background: isInfluencer ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                    color: isInfluencer ? '#10b981' : 'var(--color-text-dim)',
                                    border: isInfluencer ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--glass-border)'
                                }}>
                                    {isInfluencer ? 'Influencer Verificado' : 'Aspirante'}
                                </span>
                            </div>
                            <p style={{ color: 'var(--color-text-dim)', fontSize: '1.1rem', fontWeight: 500 }}>
                                {isInfluencer ? 'Tu impacto en la moda está creciendo.' : 'Sigue compartiendo looks para desbloquear campañas.'}
                            </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '8px' }}>
                                Valoración Est.
                            </p>
                            <div style={{
                                fontSize: '2.8rem',
                                fontWeight: '900',
                                background: 'linear-gradient(135deg, #10b981, #34d399)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block'
                            }}>
                                ${stats.valuation || 0}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>por publicación</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-dim)', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                                <FaUserFriends color="#3b82f6" /> ALCANCE TOTAL
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{(stats.totalFollowers || 0).toLocaleString()}</div>
                            <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontWeight: 800 }}>
                                <FaArrowUp /> {stats.growth}% <span style={{ color: 'var(--color-text-dim)', fontWeight: 500 }}>esta semana</span>
                            </div>
                        </div>
                        
                        <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-dim)', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                                <FaPercentage color="#f59e0b" /> ENGAGEMENT
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{stats.engagementRate}%</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '8px', fontWeight: 600 }}>
                                Nivel: {stats.engagementRate > 4 ? 'Elite' : 'Creciente'}
                            </div>
                        </div>

                        <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-dim)', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                                <FaWallet color="#a855f7" /> INGRESOS DISP.
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>${stats.walletBalance || 0}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '8px', fontWeight: 600 }}>
                                ${stats.pendingPayments} pendientes
                            </div>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Rendimiento Semanal
                            </p>
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>+12% vs semana anterior</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '80px', padding: '0 10px' }}>
                            {[45, 70, 60, 90, 80, 100, 85].map((h, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                                    style={{ 
                                        flex: 1, 
                                        background: i === 5 ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.06)',
                                        borderRadius: '6px 6px 2px 2px',
                                        boxShadow: i === 5 ? '0 4px 15px rgba(16,185,129,0.3)' : 'none'
                                    }} 
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.7rem', color: 'var(--color-text-dim)', fontWeight: 700 }}>
                            <span>LUN</span><span>MAR</span><span>MIE</span><span>JUE</span><span>VIE</span><span>SAB</span><span>DOM</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <SocialConnect onConnect={fetchStats} />
                
                {/* Ranking Card */}
                <div className="glass-premium" style={{ padding: '24px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaCrown color="#f59e0b" /> Tu Ranking
                    </h3>
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
                            #{stats.influencerScore || '---'}
                        </div>
                        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginTop: '8px', fontWeight: 600 }}>
                            en la categoría Fashionistas
                        </p>
                    </div>
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--color-text-dim)' }}>Siguiente Rank</span>
                            <span style={{ fontWeight: 800 }}>Top 50</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: '65%', height: '100%', background: 'var(--gradient-primary)' }}></div>
                        </div>
                    </div>
                </div>

                {/* Quick Action Card */}
                {!isInfluencer && (
                    <div className="glass-premium" style={{ 
                        padding: '24px', 
                        borderRadius: '32px', 
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaRocket color="#10b981" /> Despega hoy
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', lineHeight: 1.5, marginBottom: '20px' }}>
                            Para ser influencer oficial necesitas 5,000 style points y vincular al menos una red social.
                        </p>
                        <button className="btn-luxury" style={{ width: '100%', padding: '12px' }}>
                            Ver Requisitos
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
