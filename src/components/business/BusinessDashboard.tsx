"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from 'posthog-js';
import { motion } from 'framer-motion';
import { FaChartBar, FaUsers, FaStore, FaMagic, FaArrowRight, FaBullhorn, FaPlus } from 'react-icons/fa';

interface DashboardStore {
    name: string;
    address: string;
    campaigns?: {
        id: string;
        title: string;
        status: string;
        budget: number;
    }[];
}

export default function BusinessDashboard({ store }: { store: DashboardStore | null }) {
    const { data: session } = useSession();
    const router = useRouter();
    const t = useTranslations("Business");
    const tc = useTranslations("Common");

    if (!store) {
        return (
            <div style={{ padding: '80px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <div className="glass-premium" style={{ padding: '60px 40px', borderRadius: '40px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '24px' }}>🏪</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.03em' }}>{t("createProfile")}</h1>
                    <p style={{ color: 'var(--color-text-dim)', marginBottom: '40px', fontSize: '1.1rem', lineHeight: 1.6 }}>{t("registerStoreText")}</p>
                    <button
                        onClick={() => router.push('/business/create-store')}
                        className="btn-luxury"
                        style={{ width: '100%', padding: '20px', fontSize: '1.2rem', fontWeight: 900 }}
                    >
                        {t("registerStoreBtn")}
                    </button>
                </div>
            </div>
        );
    }

    const handleAction = (label: string, href: string) => {
        posthog.capture('business_action_clicked', { action: label });
        router.push(href);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 100px' }}>
            
            {/* Business Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        <FaStore /> {t("title")}
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'white', marginBottom: '4px' }}>
                        {store.name}
                    </h1>
                    <p style={{ color: 'var(--color-text-dim)', fontSize: '1.1rem' }}>{store.address}</p>
                </div>
                <button 
                    onClick={() => handleAction('new_campaign', '/business/campaigns/create')}
                    className="btn-luxury"
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 32px', 
                        background: 'var(--gradient-primary)', border: 'none', borderRadius: '20px'
                    }}
                >
                    <FaPlus /> {t("newCampaign")}
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
                
                {/* Main Insights - Large Bento Block */}
                <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }} className="mobile-full">
                    
                    {/* Reach Metric */}
                    <div className="glass-premium" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <h3 style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Alcance Global</h3>
                                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginTop: '4px' }}>128.4K</p>
                            </div>
                            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '12px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <FaUsers size={24} />
                            </div>
                        </div>
                        <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                            {[30, 45, 35, 60, 50, 80, 65, 95].map((h, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.6 }}
                                    style={{ flex: 1, background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px 4px 1px 1px' }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Conversion Metric */}
                    <div className="glass-premium" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <h3 style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tasa de Conversión</h3>
                                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginTop: '4px' }}>12.5%</p>
                            </div>
                            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '12px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <FaChartBar size={24} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, marginBottom: '6px', color: 'var(--color-text-dim)' }}>
                                    <span>VISTAS</span>
                                    <span style={{ color: 'white' }}>8.2K</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: '82%', height: '100%', background: '#3b82f6' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, marginBottom: '6px', color: 'var(--color-text-dim)' }}>
                                    <span>INTERACCIONES</span>
                                    <span style={{ color: 'white' }}>1.1K</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: '15%', height: '100%', background: '#10b981' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Campaigns Table-like list */}
                    <div className="glass-premium" style={{ gridColumn: 'span 2', padding: '32px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{t("yourCampaigns")}</h2>
                            <Link href="/business/campaigns" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', textDecoration: 'none' }}>Ver todas</Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {store.campaigns && store.campaigns.length > 0 ? (
                                store.campaigns.slice(0, 3).map((campaign) => (
                                    <div key={campaign.id} style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        padding: '20px 24px', background: 'rgba(255,255,255,0.02)', 
                                        borderRadius: '20px', border: '1px solid var(--glass-border)',
                                        transition: 'all 0.2s ease', cursor: 'pointer'
                                    }} onClick={() => router.push(`/business/campaigns/${campaign.id}/manage`)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--glass-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                <FaBullhorn color={campaign.status === 'ACTIVE' ? '#10b981' : '#666'} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>{campaign.title}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ 
                                                        fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '6px',
                                                        background: campaign.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                                        color: campaign.status === 'ACTIVE' ? '#10b981' : 'var(--color-text-dim)',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {campaign.status}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>Presupuesto: <span style={{ color: 'white' }}>${campaign.budget}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ color: 'var(--color-text-dim)', opacity: 0.3 }}>
                                            <FaArrowRight size={20} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
                                    <p style={{ color: 'var(--color-text-dim)' }}>{t("noCampaigns")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Section */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }} className="mobile-full">
                    
                    {/* Market Trends */}
                    <div className="glass-premium" style={{ 
                        padding: '32px', borderRadius: '32px', border: '1px solid var(--glass-border)',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)'
                    }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', color: 'var(--color-text-dim)' }}>
                            <FaMagic color="#10b981" /> Tendencias LatAm
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { tag: '#LinoMinimal', growth: '+45%', desc: 'Estética orgánica en CDMX' },
                                { tag: '#BogotaUrban', growth: '+28%', desc: 'Streetwear térmico' },
                                { tag: '#SaoPauloBright', growth: '+12%', desc: 'Colores vibrantes' },
                            ].map((trend, i) => (
                                <div key={i} style={{ cursor: 'pointer' }} className="group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>{trend.tag}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>{trend.growth}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>{trend.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Influencers Recommended */}
                    <div className="glass-premium" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', color: 'var(--color-text-dim)' }}>
                            Match de Influencers
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { name: '@mora_vanguard', reach: '52K', match: '98%', color: '#10b981' },
                                { name: '@estilo_latino', reach: '18K', match: '92%', color: '#3b82f6' },
                            ].map((inf, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ 
                                        width: '48px', height: '48px', borderRadius: '50%', 
                                        background: `linear-gradient(135deg, ${inf.color}, rgba(255,255,255,0.1))`, 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        fontWeight: 900, color: 'white', fontSize: '1.2rem',
                                        boxShadow: `0 4px 12px ${inf.color}33`
                                    }}>
                                        {inf.name[1].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{inf.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>{inf.reach} Alcance</div>
                                    </div>
                                    <div style={{ 
                                        fontSize: '0.65rem', fontWeight: 900, color: '#10b981', 
                                        background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '8px'
                                    }}>
                                        {inf.match} MATCH
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn-luxury" style={{ width: '100%', marginTop: '24px', padding: '12px', fontSize: '0.9rem' }}>
                            Ver todos los perfiles
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .mobile-full {
                    grid-column: span 12 !important;
                }
                @media (min-width: 1024px) {
                    .mobile-full {
                        grid-column: span 8 !important;
                    }
                    .mobile-full:last-child {
                        grid-column: span 4 !important;
                    }
                }
            `}</style>
        </div>
    );
}
