'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Analytics {
    stores: number;
    totalCampaigns: number;
    totalApplications: number;
    approvedApplications: number;
    completedApplications: number;
    pendingApplications: number;
    estimatedReach: number;
    totalBudget: number;
    budgetUsed: number;
    budgetRemaining: number;
    conversionRate: number;
    campaignBreakdown: {
        id: string;
        title: string;
        status: string;
        budget: number | null;
        applications: number;
        approved: number;
        estimatedReach: number;
    }[];
}

function StatCard({ icon, label, value, sub, color = '#a855f7' }: {
    icon: string; label: string; value: string | number; sub?: string; color?: string;
}) {
    return (
        <div style={{
            background: 'var(--glass-bg)', border: 'var(--glass-border)',
            borderRadius: 20, padding: '1.25rem',
            backdropFilter: 'blur(12px)',
        }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                {label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
    );
}

function ProgressBar({ value, max, color = '#a855f7' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
                height: '100%', width: `${pct}%`, background: color,
                borderRadius: 999, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: `0 0 8px ${color}88`
            }} />
        </div>
    );
}

export default function BusinessAnalyticsPage() {
    const { data: session } = useSession();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch('/api/business/analytics')
            .then(r => r.json())
            .then(d => { setAnalytics(d); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    }, []);

    if (loading) return (
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>📊 Analytics</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />)}
            </div>
        </main>
    );

    if (error || !analytics) return (
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <p>No se pudieron cargar las métricas. Asegúrate de tener una tienda creada.</p>
        </main>
    );

    const hasData = analytics.stores > 0;

    return (
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 5rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>📊 Analytics de Negocio</h1>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                    Rendimiento de todas tus campañas e influencers
                </p>
            </div>

            {!hasData ? (
                <div style={{
                    background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: 20,
                    padding: '3rem', textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Sin tienda registrada</h2>
                    <p style={{ color: 'var(--color-text-dim)', marginBottom: '1.5rem' }}>
                        Crea tu primera tienda para ver métricas de campañas
                    </p>
                    <a href="./create-store" style={{
                        display: 'inline-block', padding: '0.75rem 1.5rem', borderRadius: 14,
                        background: 'var(--gradient-primary)', color: 'white', fontWeight: 700, textDecoration: 'none'
                    }}>
                        Crear Tienda
                    </a>
                </div>
            ) : (
                <>
                    {/* KPI Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
                        <StatCard icon="🏪" label="Tiendas" value={analytics.stores} />
                        <StatCard icon="📢" label="Campañas" value={analytics.totalCampaigns} />
                        <StatCard icon="👋" label="Aplicaciones" value={analytics.totalApplications} sub={`${analytics.pendingApplications} pendientes`} color="#3b82f6" />
                        <StatCard icon="✅" label="Aprobadas" value={analytics.approvedApplications} sub={`${analytics.conversionRate}% conversión`} color="#10b981" />
                        <StatCard icon="👁️" label="Alcance Est." value={analytics.estimatedReach.toLocaleString()} sub="seguidores totales" color="#f59e0b" />
                        <StatCard icon="💰" label="Presupuesto Usado" value={`$${analytics.budgetUsed.toFixed(0)}`} sub={`/$${analytics.totalBudget.toFixed(0)} total`} color="#ec4899" />
                    </div>

                    {/* Budget Progress */}
                    {analytics.totalBudget > 0 && (
                        <div style={{
                            background: 'var(--glass-bg)', border: 'var(--glass-border)',
                            borderRadius: 20, padding: '1.25rem', marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontWeight: 700 }}>Uso de Presupuesto</span>
                                <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                                    ${analytics.budgetUsed.toFixed(0)} / ${analytics.totalBudget.toFixed(0)}
                                </span>
                            </div>
                            <ProgressBar value={analytics.budgetUsed} max={analytics.totalBudget} color="#ec4899" />
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                                ${analytics.budgetRemaining.toFixed(0)} disponible
                            </div>
                        </div>
                    )}

                    {/* Campaign Breakdown */}
                    {analytics.campaignBreakdown.length > 0 && (
                        <div style={{
                            background: 'var(--glass-bg)', border: 'var(--glass-border)',
                            borderRadius: 20, padding: '1.25rem'
                        }}>
                            <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1rem' }}>
                                Desglose por Campaña
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {analytics.campaignBreakdown.map(campaign => (
                                    <div key={campaign.id} style={{
                                        padding: '0.875rem 1rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 14,
                                        border: '1px solid rgba(255,255,255,0.06)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{campaign.title}</div>
                                                <span style={{
                                                    display: 'inline-block', marginTop: '0.2rem',
                                                    padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
                                                    background: campaign.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                                                    color: campaign.status === 'ACTIVE' ? '#10b981' : 'var(--color-text-dim)'
                                                }}>
                                                    {campaign.status}
                                                </span>
                                            </div>
                                            {campaign.budget && (
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Budg.</div>
                                                    <div style={{ fontWeight: 700 }}>${campaign.budget}</div>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--color-text-dim)' }}>Aplicaciones</div>
                                                <div style={{ fontWeight: 700 }}>{campaign.applications}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--color-text-dim)' }}>Aprobadas</div>
                                                <div style={{ fontWeight: 700, color: '#10b981' }}>{campaign.approved}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--color-text-dim)' }}>Alcance</div>
                                                <div style={{ fontWeight: 700, color: '#f59e0b' }}>{campaign.estimatedReach.toLocaleString()}</div>
                                            </div>
                                        </div>
                                        {campaign.applications > 0 && (
                                            <div style={{ marginTop: '0.625rem' }}>
                                                <ProgressBar
                                                    value={campaign.approved}
                                                    max={campaign.applications}
                                                    color="#10b981"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
