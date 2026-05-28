'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import BottomSheetModal from '@/components/BottomSheetModal';
import ShareStyleCard from '@/components/ShareStyleCard';
import { useTranslations } from 'next-intl';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    result: {
        harmonyScore: number;
        style?: string;
        occasion?: string;
        colors?: string[];
        feedback?: string;
        demographics?: { archetype?: string };
    };
}

export default function ShareModal({ isOpen, onClose, imageSrc, result }: ShareModalProps) {
    const t = useTranslations('Common');
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPalette, setShowPalette] = useState(true);
    const [showFeedback, setShowFeedback] = useState(true);

    const handleShare = async () => {
        if (!cardRef.current) return;

        setIsGenerating(true);
        try {
            // Render the hidden card to Canvas
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // High resolution for sharing
                useCORS: true, // Allow cross-origin images (important for external Next/Images)
                backgroundColor: null,
            });

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Canvas to Blob failed');

                const file = new File([blob], 'looksy-style-card.png', { type: 'image/png' });

                // Check native Web Share API support with files
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Mi Estilo en Looksy AI 🌟',
                        text: `¡Mira el análisis de mi outfit! Puntuación: ${result.harmonyScore} PTS. \n\nDescubre tu estilo en Looksy App 💎`,
                        files: [file]
                    });
                } else {
                    // Fallback to direct download for Desktop/Unsupported browsers
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `looksy-style-${result.harmonyScore}pts.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    alert("¡Imagen descargada exitosamente!");
                }

                setIsGenerating(false);
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('Error generating share card:', error);
            setIsGenerating(false);
            alert("Error al intentar generar la imagen compartible. Reinténtalo.");
        }
    };

    return (
        <BottomSheetModal isOpen={isOpen} onClose={onClose}>
            <div className="glass-premium" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '24px 24px 0 0', borderBottom: 'none' }}>
                <h2 className="text-luxury" style={{ fontSize: '1.75rem', margin: 0, textAlign: 'center' }}>Compartir Análisis ✨</h2>
                <p style={{ color: 'var(--color-text-dim)', margin: 0, fontSize: '0.95rem', textAlign: 'center' }}>
                    Muestra tu estilo al mundo. Personaliza lo que quieres compartir en tu tarjeta.
                </p>

                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '16px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 600 }}>
                        <span>Mostrar Paleta de Colores & Ocasión</span>
                        <input
                            type="checkbox"
                            checked={showPalette}
                            style={{ width: '22px', height: '22px', accentColor: 'var(--primary)' }}
                        />
                    </label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 600 }}>
                        <span>Incluir Feedback de la IA</span>
                        <input
                            type="checkbox"
                            checked={showFeedback}
                            onChange={(e) => setShowFeedback(e.target.checked)}
                            style={{ width: '22px', height: '22px', accentColor: 'var(--primary)' }}
                        />
                    </label>
                </div>

                {/* Hidden container for Html2Canvas generation. It must be in the DOM but hidden off-screen to avoid taking up actual space. */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    <ShareStyleCard
                        forwardedRef={cardRef}
                        imageSrc={imageSrc}
                        result={result}
                        showFeedback={showFeedback}
                        showPalette={showPalette}
                    />
                </div>

                {/* Visual Preview for User (Scaled down mini-version of how it will roughly look) */}
                <div style={{
                    width: '100%', height: '260px', background: 'rgba(0,0,0,0.4)', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--glass-border)', overflow: 'hidden', position: 'relative',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {imageSrc && <img src={imageSrc} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, filter: 'blur(8px)' }} />}
                    <div style={{ position: 'absolute', textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{result.harmonyScore} PTS</div>
                        <div className="text-luxury" style={{ fontSize: '18px', marginTop: '4px' }}>{result.style}</div>
                        <p style={{ fontSize: '12px', marginTop: '12px', color: 'rgba(255,255,255,0.7)' }}>Vista previa ilustrativa.<br />La imagen final será de alta calidad.</p>
                    </div>
                </div>

                <button
                    onClick={handleShare}
                    disabled={isGenerating}
                    className="btn-luxury animate-fade-in-up"
                    style={{
                        width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '16px',
                        opacity: isGenerating ? 0.7 : 1
                    }}
                >
                    {isGenerating ? '🎨 Renderizando Tarjeta...' : '📤 Compartir Resultado'}
                </button>
            </div>
        </BottomSheetModal>
    );
}
