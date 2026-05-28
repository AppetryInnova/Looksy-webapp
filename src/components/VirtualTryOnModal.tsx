'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMagic, FaCheckCircle, FaArrowRight, FaUndo } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import styles from './VirtualTryOnModal.module.css';
import GetTokensModal from './GetTokensModal';

type Item = { id: string; imageUrl: string; category: string; color?: string | null; brand?: string | null; };

interface VirtualTryOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialItem?: Item | null;
}

export default function VirtualTryOnModal({ isOpen, onClose, initialItem }: VirtualTryOnModalProps) {
    const { data: session } = useSession();
    const [generating, setGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [aiReport, setAiReport] = useState<any>(null);
    const [isFreeMode, setIsFreeMode] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [showGetTokensModal, setShowGetTokensModal] = useState(false);

    const [baseModelUrl, setBaseModelUrl] = useState<string | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    
    const [wardrobe, setWardrobe] = useState<Item[]>([]);
    const [selectedLook, setSelectedLook] = useState<Record<string, Item>>({});

    useEffect(() => {
        if (isOpen && session?.user?.id) {
            setGenerating(false);
            setResultImage(null);
            setAiReport(null);
            setIsFreeMode(false);
            setLoadingProfile(true);
            
            if (initialItem) {
                setSelectedLook({ [initialItem.category]: initialItem });
            } else {
                setSelectedLook({});
            }

            Promise.all([
                fetch('/api/profile').then(res => res.json()),
                fetch('/api/items').then(res => res.json())
            ])
            .then(([profileData, itemsData]) => {
                setBaseModelUrl(profileData.baseModelUrl || null);
                setWardrobe(Array.isArray(itemsData) ? itemsData : []);
                setLoadingProfile(false);
            })
            .catch(() => setLoadingProfile(false));
        }
    }, [isOpen, session, initialItem]);

    if (!isOpen) return null;

    const handleTryOn = async () => {
        if (!baseModelUrl) return;
        const lookItems = Object.values(selectedLook);
        if (lookItems.length === 0) {
            showToast('Selecciona al menos una prenda', 'error');
            return;
        }

        setGenerating(true);
        setAiReport(null);
        setJobId(null);
        
        try {
            const res = await fetch('/api/vto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseModelUrl,
                    itemImageUrls: lookItems.map(i => i.imageUrl),
                    category: lookItems[0].category.toLowerCase()
                })
            });

            const data = await res.json();
            
            if (!res.ok) {
                setGenerating(false);
                if (res.status === 403) {
                    setShowGetTokensModal(true);
                    return;
                }
                throw new Error(data.error || 'Error generating VTO image');
            }

            if (data.jobId) {
                setJobId(data.jobId);
                showToast(data.message || 'Procesando en segundo plano...', 'success');
            }
        } catch (e: any) {
            setGenerating(false);
            showToast(e.message || 'Error al generar la prueba virtual', 'error');
        }
    };

    useEffect(() => {
        if (!jobId) return;

        const channel = supabase
            .channel(`vto-job-${jobId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'VTOJob',
                    filter: `id=eq.${jobId}`,
                },
                (payload) => {
                    const job = payload.new as any;
                    if (job.status === 'COMPLETED') {
                        setGenerating(false);
                        setResultImage(job.generatedUrl);
                        if (job.aiReport) {
                            try {
                                setAiReport(JSON.parse(job.aiReport));
                            } catch (e) {}
                        }
                        showToast('¡Prueba virtual completada!', 'success');
                        setJobId(null);
                    } else if (job.status === 'FAILED') {
                        setGenerating(false);
                        showToast(job.error || 'Error en la generación', 'error');
                        setJobId(null);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [jobId]);

    const toggleItem = (item: Item) => {
        setSelectedLook(prev => {
            const next = { ...prev };
            if (next[item.category]?.id === item.id) {
                delete next[item.category];
            } else {
                next[item.category] = item;
            }
            return next;
        });
    };

    const selectedArray = Object.values(selectedLook);
    const showResults = !!(resultImage || aiReport);

    return (
        <>
        <div className={styles.overlay} onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`glass-premium ${styles.modalContainer} ${showResults ? styles.modalContainerResults : styles.modalContainerNoResults}`} 
                onClick={e => e.stopPropagation()}
            >
                
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.headerTitle}>
                            <FaMagic style={{ color: 'var(--primary)' }} /> AI Virtual Mirror
                        </h2>
                        <p className={styles.headerSubtitle}>Experiencia de probador inteligente de nueva generación</p>
                    </div>
                    <button onClick={onClose} className={styles.closeButton}>✕</button>
                </div>

                <div className={styles.contentWrapper}>
                    
                    {/* Left Column: Visual Area */}
                    <div className={styles.leftColumn}>
                        {loadingProfile ? (
                            <div className="spinner-ai"></div>
                        ) : !baseModelUrl ? (
                            <div style={{ textAlign: 'center', maxWidth: '300px' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🧍</div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>Sin Clon Digital</h3>
                                <p style={{ color: 'var(--color-text-dim)', marginBottom: '32px', fontSize: '0.9rem' }}>Primero debes subir tu foto base en el perfil.</p>
                                <button className="btn-luxury" onClick={onClose}>Ir al Perfil</button>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {!showResults ? (
                                    <motion.div key="setup" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} style={{ width: '100%', textAlign: 'center' }}>
                                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '40px' }}>
                                            <div style={{ 
                                                width: '280px', height: '380px', borderRadius: '40px', overflow: 'hidden', 
                                                border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                                background: 'rgba(0,0,0,0.4)'
                                            }}>
                                                <img src={baseModelUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            {selectedArray.map((item, idx) => (
                                                <motion.div 
                                                    key={item.id}
                                                    initial={{ x: 50, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    style={{ 
                                                        position: 'absolute', right: -60, top: 40 + (idx * 90), 
                                                        width: '90px', height: '90px', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)',
                                                        borderRadius: '24px', padding: '12px', border: '1px solid var(--primary)',
                                                        boxShadow: '0 15px 30px rgba(0,0,0,0.4)'
                                                    }}
                                                >
                                                    <img src={item.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                            <button className="btn-luxury" onClick={handleTryOn} disabled={generating || selectedArray.length === 0} style={{ width: '340px', padding: '22px', borderRadius: '22px' }}>
                                                {generating ? 'IA Generando Imagen...' : <span><FaMagic /> Generar con Nano Banana</span>}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ position: 'relative', width: '380px', height: '520px', borderRadius: '40px', overflow: 'hidden', border: '4px solid var(--primary)', boxShadow: '0 0 100px rgba(16,185,129,0.3)' }}>
                                            <img src={resultImage || baseModelUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {generating && (
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div className="spinner-ai"></div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Right Column: Report & Selection (SCROLLABLE) */}
                    <div className={`${styles.rightColumn} ${showResults ? styles.rightColumnResults : styles.rightColumnNoResults}`}>
                        {!showResults ? (
                            <div style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '24px' }}>MI ROPERO</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '16px' }}>
                                    {wardrobe.map(item => {
                                        const isSelected = selectedLook[item.category]?.id === item.id;
                                        return (
                                            <div key={item.id} onClick={() => toggleItem(item)} style={{
                                                aspectRatio: '1', borderRadius: '24px', overflow: 'hidden',
                                                background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                                                border: `2px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                                                position: 'relative', transition: 'all 0.2s',
                                                opacity: !isSelected && selectedLook[item.category] ? 0.3 : 1
                                            }}>
                                                <img src={item.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.6rem', padding: '6px', textAlign: 'center' }}>{item.category}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : aiReport && (
                            <div style={{ padding: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                        <FaCheckCircle size={30} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }}>Match: <span style={{ color: '#10b981' }}>{aiReport.matchScore}%</span></h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>Análisis de Estilo Looksy</p>
                                    </div>
                                </div>

                                <div className="glass-premium" style={{ padding: '32px', borderRadius: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px' }}>
                                    <div style={{ marginBottom: '28px' }}>
                                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '14px', fontWeight: 900 }}>Reporte de Calce</h4>
                                        <p style={{ fontSize: '1.15rem', lineHeight: 1.8, color: 'white', fontWeight: 500 }}>{aiReport.fitAnalysis}</p>
                                    </div>
                                    <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '14px', fontWeight: 900 }}>Veredicto Looksy</h4>
                                        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>{aiReport.styleVerdict}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '40px' }}>
                                    {aiReport.suggestions.map((tip: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1rem', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <FaArrowRight size={14} color="var(--primary)" /> {tip}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button className="btn-secondary" style={{ flex: 1, height: '64px', borderRadius: '20px' }} onClick={() => { setResultImage(null); setAiReport(null); }}>
                                        <FaUndo style={{ marginRight: '10px' }} /> Probar Otro
                                    </button>
                                    <button className="btn-luxury" style={{ flex: 1.5, height: '64px', borderRadius: '20px' }} onClick={onClose}>Guardar Outfit</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
        <GetTokensModal isOpen={showGetTokensModal} onClose={() => setShowGetTokensModal(false)} />

            <style jsx>{`
                .spinner-ai {
                    width: 70px; height: 70px;
                    border: 6px solid rgba(255,255,255,0.05);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}
