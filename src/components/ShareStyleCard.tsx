'use client';

import React from 'react';
import Image from 'next/image';

interface ShareStyleCardProps {
    imageSrc: string;
    result: {
        harmonyScore: number;
        style?: string;
        occasion?: string;
        colors?: string[];
        feedback?: string;
        demographics?: { archetype?: string };
    };
    showFeedback: boolean;
    showPalette: boolean;
    forwardedRef?: React.Ref<HTMLDivElement>;
}

export default function ShareStyleCard({
    imageSrc,
    result,
    showFeedback,
    showPalette,
    forwardedRef
}: ShareStyleCardProps) {
    const isElite = result.harmonyScore >= 80;

    return (
        <div
            ref={forwardedRef}
            style={{
                width: '1080px', // Fixed high-res width for Instagram Stories/WhatsApp
                minHeight: '1350px', // 4:5 aspect ratio
                background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)',
                position: 'relative',
                padding: '60px',
                fontFamily: '"Playfair Display", "Geist", sans-serif',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}
        >
            {/* Background Decorators */}
            <div style={{
                position: 'absolute', top: '-10%', right: '-10%', width: '600px', height: '600px',
                background: isElite ? 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                filter: 'blur(60px)', borderRadius: '50%', zIndex: 0
            }} />
            <div style={{
                position: 'absolute', bottom: '-5%', left: '-5%', width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
                filter: 'blur(60px)', borderRadius: '50%', zIndex: 0
            }} />

            {/* Header / Branding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '50px', height: '50px', background: 'white', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', color: '#000'
                    }}>
                        L
                    </div>
                    <span style={{ color: 'white', fontSize: '32px', fontWeight: '700', letterSpacing: '1px' }}>LOOKSY AI</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '24px', letterSpacing: '4px' }}>
                    STYLE ANALYSIS
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, gap: '50px', zIndex: 1 }}>

                {/* Left: Image Container */}
                <div style={{
                    flex: '1', position: 'relative', borderRadius: '32px', overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '2px solid rgba(255,255,255,0.1)'
                }}>
                    {imageSrc && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={imageSrc}
                            alt="Analyzed Outfit"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            crossOrigin="anonymous" // Crucial for html2canvas
                        />
                    )}

                    {/* Harmony Score Badge over Image */}
                    <div style={{
                        position: 'absolute', bottom: '30px', right: '30px',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)',
                        borderRadius: '50%', width: '140px', height: '140px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: `4px solid ${isElite ? '#10b981' : '#8b5cf6'}`,
                        boxShadow: `0 0 30px ${isElite ? 'rgba(16,185,129,0.4)' : 'rgba(139,92,246,0.4)'}`
                    }}>
                        <span style={{ color: 'white', fontSize: '48px', fontWeight: '900', lineHeight: '1' }}>
                            {result.harmonyScore}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', fontWeight: '600', letterSpacing: '2px' }}>
                            PTS
                        </span>
                    </div>
                </div>

                {/* Right: Data Container */}
                <div style={{
                    flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '30px',
                    justifyContent: 'center'
                }}>

                    {/* Title & Archetype */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
                        padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ color: isElite ? '#10b981' : '#a78bfa', fontSize: '18px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '15px' }}>
                            {result.demographics?.archetype || 'STYLE PROFILE'}
                        </div>
                        <h1 style={{ color: 'white', fontSize: '42px', margin: 0, lineHeight: '1.1', fontWeight: '800' }}>
                            {result.style || 'Signature Look'}
                        </h1>
                    </div>

                    {/* Occasion & Palette */}
                    {showPalette && (
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{
                                flex: 1, background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', marginBottom: '15px' }}>OCASIÓN</div>
                                <div style={{ color: 'white', fontSize: '22px', fontWeight: '600' }}>📍 {result.occasion || 'Versátil'}</div>
                            </div>

                            <div style={{
                                flex: 1, background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', marginBottom: '15px' }}>PALETTE</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {result.colors?.slice(0, 4).map((c, i) => (
                                        <div key={i} style={{ width: '30px', height: '30px', borderRadius: '50%', background: c, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} />
                                    ))}
                                    {(!result.colors || result.colors.length === 0) && <span style={{ color: 'white', fontSize: '20px' }}>✨</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    {showFeedback && result.feedback && (
                        <div style={{
                            background: 'rgba(255,255,255,0.05)', padding: '35px', borderRadius: '24px',
                            borderLeft: `4px solid ${isElite ? '#10b981' : '#8b5cf6'}`,
                            color: 'rgba(255,255,255,0.9)', fontSize: '20px', lineHeight: '1.6', fontStyle: 'italic'
                        }}>
                            "{result.feedback}"
                        </div>
                    )}

                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'rgba(255,255,255,0.4)', fontSize: '18px', zIndex: 1 }}>
                looksy.app/scan
            </div>

        </div>
    );
}
