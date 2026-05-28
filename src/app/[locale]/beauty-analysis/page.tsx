'use client';

import React, { useState, useEffect } from 'react';
import { analyzeImage } from '@/lib/gemini';
import { useLocale } from 'next-intl';
import { logger } from '@/lib/logger';

const BeautyAnalysis = () => {
    const [step, setStep] = useState(1);
    const [image, setImage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [beautyMode, setBeautyMode] = useState<'MAKEUP' | 'HAIRSTYLE'>('MAKEUP');
    const locale = useLocale();

    useEffect(() => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => setUserProfile(data))
            .catch(err => logger.error('Error fetching profile:', err));
    }, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setStep(2);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const runAnalysis = async () => {
        if (!file) return;

        // --- PAYWALL CHECK ---
        const isElite = userProfile?.subscription?.plan === 'ELITE';
        const todayStr = new Date().toDateString();
        const lastScanDate = localStorage.getItem('looksy_last_beauty_scan_date');
        const scanCount = parseInt(localStorage.getItem('looksy_beauty_scan_count') || '0');

        if (!isElite) {
            if (lastScanDate === todayStr && scanCount >= 1) {
                // Limit Reached
                if (confirm("¡Has alcanzado tu límite diario de 1 Análisis de Belleza!\n\nPásate a Looksy Elite para análisis ilimitados y desbloquear todas las funciones.")) {
                    window.location.href = '/subscription';
                }
                return;
            }
        }
        // ---------------------

        setStep(3);
        setAnalyzing(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            // If we have a stored facial profile, we add it to the request for Gemini
            if (userProfile?.facialProfile) {
                formData.append('facialProfile', JSON.stringify(userProfile.facialProfile)); // Stringify if it's an object
            }

            // We specifically ask for HAIRSTYLE/MAKEUP blend or specialized beauty
            // For now, let's use a specialized mode if we had one, but we'll use 'MAKEUP' 
            // and the server will use the facialProfile context.
            const result = await analyzeImage(formData, beautyMode, locale);
            setResults(result);
            setStep(4);

            // Persist scan to database
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
                if (uploadRes.ok) {
                    const { url: photoUrl } = await uploadRes.json();
                    await fetch('/api/scans', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            photoUrl,
                            aiFeedback: `[${beautyMode}] Face: ${result.faceShape}, Color: ${result.colorPalette}. ${result.suggestions.join('. ')}`,
                            harmonyScore: result.harmonyScore
                        })
                    });
                }
            } catch (dbError) {
                logger.error('Error saving beauty scan to db:', dbError);
            }

            // Update Usage Limits
            localStorage.setItem('looksy_last_beauty_scan_date', todayStr);
            if (lastScanDate === todayStr) {
                localStorage.setItem('looksy_beauty_scan_count', (scanCount + 1).toString());
            } else {
                localStorage.setItem('looksy_beauty_scan_count', '1');
            }

        } catch (error) {
            logger.error('Error running beauty analysis:', error);
            alert("Error al analizar la imagen. Por favor intenta de nuevo.");
            setStep(2);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div style={{ padding: '16px', width: '100%', maxWidth: '800px', margin: '0 auto', color: 'var(--color-text)', paddingBottom: '100px', boxSizing: 'border-box' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.05em' }}>✨ Análisis de Belleza IA</h1>

            <div className="glass-premium" style={{ borderRadius: '32px', padding: 'clamp(20px, 5vw, 40px)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                {step === 1 && (
                    <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                        <div style={{
                            width: '140px',
                            height: '140px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 32px auto',
                            fontSize: '4rem',
                            border: '2px solid rgba(16, 185, 129, 0.2)',
                            boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)'
                        }}>
                            📸
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px' }}>Descubre tu potencial Visual</h2>
                        <p style={{ color: 'var(--color-text-dim)', marginBottom: '40px', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 40px' }}>
                            Nuestra IA avanzada analizará tu estructura facial y colorimetría para darte consejos de imagen profesional.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }}>
                            <button
                                onClick={() => setBeautyMode('MAKEUP')}
                                style={{
                                    padding: '12px 24px', borderRadius: '16px',
                                    border: beautyMode === 'MAKEUP' ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                    background: beautyMode === 'MAKEUP' ? 'var(--color-primary)' : 'var(--color-surface)',
                                    boxShadow: beautyMode === 'MAKEUP' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
                                    color: beautyMode === 'MAKEUP' ? 'white' : 'var(--color-text)',
                                    fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
                                }}
                            >
                                💄 Maquillaje
                            </button>
                            <button
                                onClick={() => setBeautyMode('HAIRSTYLE')}
                                style={{
                                    padding: '12px 24px', borderRadius: '16px',
                                    border: beautyMode === 'HAIRSTYLE' ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                    background: beautyMode === 'HAIRSTYLE' ? 'var(--color-primary)' : 'var(--color-surface)',
                                    boxShadow: beautyMode === 'HAIRSTYLE' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
                                    color: beautyMode === 'HAIRSTYLE' ? 'white' : 'var(--color-text)',
                                    fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
                                }}
                            >
                                💇‍♀️ Peinado
                            </button>
                        </div>

                        <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block', padding: '16px 40px', fontSize: '1.1rem', borderRadius: '20px' }}>
                            Subir Foto Facial
                            <input type="file" accept="image/*" hidden onChange={handleUpload} />
                        </label>

                        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', fontSize: '0.85rem' }}>💡 Iluminación Natural</div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', fontSize: '0.85rem' }}>📷 Sin Maquillaje Fuerte</div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', fontSize: '0.85rem' }}>🎯 Rostro Centrado</div>
                        </div>
                    </div>
                )}

                {step === 2 && image && (
                    <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                        <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto 32px' }}>
                            <img src={image} alt="Preview" style={{
                                width: '300px',
                                height: '300px',
                                objectFit: 'cover',
                                borderRadius: '24px',
                                border: '4px solid rgba(16, 185, 129, 0.3)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                            }} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px' }}>¿Todo listo para el escaneo?</h2>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={runAnalysis}>Iniciar Análisis</button>
                            <button className="btn-secondary" style={{ padding: '14px 32px' }} onClick={() => { setImage(null); setStep(1); }}>Cambiar Foto</button>
                        </div>
                    </div>
                )}

                {step === 3 && image && (
                    <div style={{ padding: '20px 0', animation: 'fadeIn 1s ease-in-out' }}>
                        <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto' }}>
                            <img src={image} alt="Scanning" style={{
                                width: '280px',
                                height: '280px',
                                objectFit: 'cover',
                                borderRadius: '24px',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                opacity: 0.6
                            }} />
                            <div className="scanning-line" style={{
                                width: '100%',
                                height: '3px',
                                background: '#10b981',
                                boxShadow: '0 0 20px #10b981',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 10,
                                animation: 'scanMove 2s infinite ease-in-out'
                            }}></div>
                        </div>
                        <div style={{ marginTop: '32px' }}>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>Procesando Rasgos Biométricos...</h2>
                            <p style={{ opacity: 0.7, marginTop: '8px', fontSize: '1.1rem' }}>Mapeando estructura facial y subtonos de piel.</p>
                        </div>
                        <style jsx>{`
                            @keyframes scanMove {
                                0% { top: 0; }
                                50% { top: 280px; }
                                100% { top: 0; }
                            }
                        `}</style>
                    </div>
                )}

                {step === 4 && results && (
                    <div style={{ animation: 'fadeInUp 0.8s ease-out', textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'start' }}>
                            <img src={image!} alt="Analysed" style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '20px',
                                border: '2px solid #10b981'
                            }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>Tu Perfil</h2>
                                    <div style={{
                                        background: '#10b981',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontWeight: 900,
                                        fontSize: '0.9rem'
                                    }}>
                                        {results.harmonyScore} PTS
                                    </div>
                                </div>
                                <p style={{ margin: 0, opacity: 0.7 }}>Análisis completado con éxito basado en tu fisionomía.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Estructura Facial</span>
                                <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>📐 {results.faceShape}</span>
                            </div>
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Colorimetría</span>
                                <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>🎨 {results.colorPalette}</span>
                            </div>
                        </div>

                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#10b981' }}>Análisis de Rasgos Clave</h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {results.keyFeatures.map((f: string) => (
                                    <span key={f} style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600' }}>
                                        #{f}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>Recomendaciones de Imagen</h3>
                            <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {results.suggestions.map((s: string, i: number) => (
                                    <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '0.95rem', opacity: 0.9 }}>
                                        <span style={{ color: '#10b981' }}>✦</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '40px', padding: '18px' }}
                            onClick={() => { setStep(1); setImage(null); }}
                        >
                            Realizar Nuevo Análisis
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BeautyAnalysis;
