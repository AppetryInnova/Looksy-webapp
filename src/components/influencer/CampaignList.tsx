"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { FaDollarSign, FaUserFriends, FaCheck, FaInfoCircle, FaRocket, FaStore, FaChartLine } from "react-icons/fa";
import { useTranslations } from "next-intl";
import logger from '@/lib/logger';
import posthog from 'posthog-js';
import { motion } from 'framer-motion';

import { Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/Toast';

export default function CampaignList() {
    const { data: session } = useSession();
    const t = useTranslations("Influencer");
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await fetch('/api/campaigns');
                if (res.ok) {
                    const data = await res.json();
                    setCampaigns(data);
                    posthog.capture('campaign_list_viewed', { count: data.length });
                }

            } catch (err) {
                logger.error('Error fetching campaigns', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    async function handleApply(campaignId: string) {
        setApplyingId(campaignId);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/apply`, {
                method: 'POST'
            });
            if (res.ok) {
                showToast("¡Postulación enviada exitosamente!", "success");
                posthog.capture('campaign_applied', { campaignId });
            } else {
                const data = await res.json();
                showToast(data.error || "Ocurrió un error", "error");
            }
        } catch (e) {
            logger.error(e);
        } finally {
            setApplyingId(null);
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="glass-premium" style={{ height: '400px', borderRadius: '32px', border: '1px solid var(--glass-border)', opacity: 0.5 }}></div>
                ))}
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="glass-premium" style={{ textAlign: 'center', padding: '60px 40px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌑</div>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '1.1rem' }}>No hay campañas activas en este momento.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {campaigns.map((campaign, index) => (
                <motion.div 
                    key={campaign.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-premium" 
                    style={{ 
                        display: 'flex', flexDirection: 'column', padding: '0', 
                        overflow: 'hidden', borderRadius: '32px', border: '1px solid var(--glass-border)',
                        transition: 'transform 0.3s ease', cursor: 'pointer',
                        background: 'var(--glass-surface)'
                    }}
                    whileHover={{ y: -8, boxShadow: 'var(--shadow-premium)' }}
                >
                    
                    {/* Header Image Area */}
                    <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                        {campaign.imageUrl ? (
                            <Image src={campaign.imageUrl} alt={campaign.title} fill style={{ objectFit: 'cover' }} className="hover-zoom" />
                        ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <span style={{ fontSize: '3.5rem' }}>✨</span>
                            </div>
                        )}
                        
                        {/* Brand Badge */}
                        <div style={{ 
                            position: 'absolute', top: '20px', left: '20px', 
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', 
                            padding: '6px 14px', borderRadius: '14px', fontSize: '0.75rem', 
                            fontWeight: '900', color: 'white', display: 'flex', alignItems: 'center', gap: '8px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <FaStore color="#10b981" /> {campaign.store.name}
                        </div>

                        {/* Reward Badge */}
                        <div style={{ 
                            position: 'absolute', bottom: '20px', right: '20px', 
                            background: 'var(--gradient-primary)',
                            padding: '8px 16px', borderRadius: '16px', fontSize: '0.9rem', 
                            fontWeight: '900', color: 'white', boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                        }}>
                            ${campaign.reward}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{campaign.title}</h3>
                        <p style={{ 
                            fontSize: '0.95rem', color: 'var(--color-text-dim)', marginBottom: '24px', 
                            flex: 1, display: '-webkit-box', WebkitLineClamp: 3, 
                            WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6
                        }}>
                            {campaign.description}
                        </p>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Aspirantes</div>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{campaign._count?.applications || 0}</div>
                            </div>
                            <div style={{ width: '1px', background: 'var(--glass-border)' }}></div>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Match Requerido</div>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#10b981' }}>85%+</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>
                            <FaChartLine color="#3b82f6" />
                            <span>Ver requisitos de audiencia</span>
                        </div>

                        <button
                            onClick={() => handleApply(campaign.id)}
                            disabled={applyingId === campaign.id}
                            className="btn-luxury"
                            style={{ 
                                width: '100%', padding: '16px', borderRadius: '20px', 
                                fontSize: '1.1rem', fontWeight: 900, display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', gap: '12px',
                                background: applyingId === campaign.id ? 'rgba(255,255,255,0.1)' : 'var(--gradient-primary)'
                            }}
                        >
                            {applyingId === campaign.id ? (
                                <div className="spinner-small"></div>
                            ) : (
                                <><FaRocket /> Aplicar Ahora</>
                            )}
                        </button>
                    </div>
                </motion.div>
            ))}
            
            <style jsx>{`
                .hover-zoom {
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-premium:hover .hover-zoom {
                    transform: scale(1.1);
                }
                .spinner-small {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
