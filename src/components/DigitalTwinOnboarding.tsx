'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaintBrush, FaUpload, FaCheck, FaExchangeAlt } from 'react-icons/fa';

const BACKGROUNDS = [
    { name: 'Gris', label: 'Gris Estudio 🌫️', value: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' },
    { name: 'Rosa', label: 'Rosa Suave 🌸', value: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)' },
    { name: 'Menta', label: 'Menta Fresca 🌿', value: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)' },
    { name: 'Carbón', label: 'Carbón Premium 🖤', value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
    { name: 'Estudio', label: 'Estudio Fotográfico 📸', value: 'radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%)' },
];

interface DigitalTwinOnboardingProps {
    initialBaseModelUrl?: string | null;
    initialTwinBackground?: string | null;
    onComplete?: () => void;
}

export default function DigitalTwinOnboarding({ 
    initialBaseModelUrl, 
    initialTwinBackground, 
    onComplete 
}: DigitalTwinOnboardingProps) {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    
    const [currentTwinUrl, setCurrentTwinUrl] = useState<string | null>(null);
    const [selectedBgName, setSelectedBgName] = useState<string>('Gris');
    const [showUploadForm, setShowUploadForm] = useState<boolean>(true);

    // Sync from props
    useEffect(() => {
        if (initialBaseModelUrl) {
            setCurrentTwinUrl(initialBaseModelUrl);
            setShowUploadForm(false);
        } else {
            setCurrentTwinUrl(null);
            setShowUploadForm(true);
        }
        if (initialTwinBackground) {
            setSelectedBgName(initialTwinBackground);
        }
    }, [initialBaseModelUrl, initialTwinBackground]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSave = async () => {
        if (!file || !session?.user?.id) return;
        setUploading(true);

        try {
            // 1. Upload to Supabase Storage
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url } = await uploadRes.json();

            // 2. Update user profile and process background removal
            const updateRes = await fetch('/api/profile/twin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    baseModelUrl: url,
                    twinBackground: selectedBgName
                })
            });

            if (!updateRes.ok) throw new Error('Profile update failed');
            const data = await updateRes.json();

            showToast('¡Clon Digital guardado con éxito! 🪞', 'success');
            await update(); // refresh session
            
            setCurrentTwinUrl(data.processedUrl);
            setShowUploadForm(false);
            setFile(null);
            setPreview(null);
            
            if (onComplete) onComplete();
        } catch (error) {
            showToast('Error al guardar tu Clon Digital', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleBgChange = async (bgName: string) => {
        setSelectedBgName(bgName);
        
        // If they already have an avatar, save background preference in DB immediately
        if (currentTwinUrl) {
            try {
                const updateRes = await fetch('/api/profile/twin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ twinBackground: bgName })
                });
                
                if (updateRes.ok) {
                    showToast('Fondo actualizado con éxito 🎨', 'success');
                    if (onComplete) onComplete();
                }
            } catch (err) {
                console.error('Failed to save background preference:', err);
            }
        }
    };

    const activeBg = BACKGROUNDS.find(b => b.name === selectedBgName) || BACKGROUNDS[0];

    return (
        <div className="glass-premium" style={{ padding: '32px 24px', borderRadius: '28px', textAlign: 'center', maxWidth: '420px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>
                Tu Clon Digital <span style={{ color: 'var(--primary)' }}>VTO</span>
            </h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.4 }}>
                {showUploadForm 
                    ? 'Sube una foto de cuerpo completo con buena iluminación para probador virtual.' 
                    : 'Personaliza tu avatar digital con el fondo de tu preferencia.'}
            </p>

            <AnimatePresence mode="wait">
                {showUploadForm ? (
                    <motion.div 
                        key="upload-form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <div style={{
                            position: 'relative',
                            width: '260px',
                            height: '340px',
                            margin: '0 auto 24px',
                            borderRadius: '24px',
                            border: '2px dashed rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease'
                        }}>
                            {preview ? (
                                <img src={preview} alt="Digital Twin Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ padding: '20px', color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '3rem', marginBottom: '12px' }}>📸</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Subir foto de cuerpo</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            />
                        </div>

                        {file && (
                            <button 
                                className="btn-luxury animate-fade-in-up" 
                                onClick={handleSave} 
                                disabled={uploading}
                                style={{ width: '100%', padding: '16px', fontSize: '1rem', borderRadius: '16px' }}
                            >
                                {uploading ? 'Procesando tu Avatar...' : 'Guardar y Quitar Fondo ✨'}
                            </button>
                        )}
                        
                        {currentTwinUrl && (
                            <button 
                                className="btn-secondary" 
                                onClick={() => setShowUploadForm(false)}
                                style={{ width: '100%', padding: '14px', marginTop: '12px', borderRadius: '16px', fontSize: '0.9rem' }}
                            >
                                Volver al Avatar
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="avatar-display"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        {/* Avatar Showcase with chosen background */}
                        <div style={{
                            position: 'relative',
                            width: '260px',
                            height: '340px',
                            margin: '0 auto 20px',
                            borderRadius: '28px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: activeBg.value,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            transition: 'background 0.3s ease'
                        }}>
                            {currentTwinUrl && (
                                <img 
                                    src={currentTwinUrl} 
                                    alt="Tu Clon Digital" 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'contain',
                                        padding: '16px' // nice margins for transparent avatars
                                    }} 
                                />
                            )}
                        </div>

                        {/* Background Customizer Preset Row */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-dim)', fontWeight: 600, marginBottom: '12px' }}>
                                <FaPaintBrush size={12} /> ELEGIR FONDO:
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                {BACKGROUNDS.map((bg) => {
                                    const isSelected = selectedBgName === bg.name;
                                    return (
                                        <button
                                            key={bg.name}
                                            onClick={() => handleBgChange(bg.name)}
                                            title={bg.label}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: bg.value,
                                                border: isSelected ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.2)',
                                                boxShadow: isSelected ? '0 0 8px var(--primary)' : 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                transition: 'all 0.2s',
                                                transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowUploadForm(true)}
                                style={{ flex: 1, padding: '14px', borderRadius: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <FaExchangeAlt size={12} /> Cambiar Foto
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
