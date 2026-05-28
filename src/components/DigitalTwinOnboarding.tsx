'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

export default function DigitalTwinOnboarding({ onComplete }: { onComplete?: () => void }) {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

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
            // Upload to Supabase Storage (using existing upload route)
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url } = await uploadRes.json();

            // Update user profile with baseModelUrl
            const updateRes = await fetch('/api/profile/twin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseModelUrl: url })
            });

            if (!updateRes.ok) throw new Error('Profile update failed');

            showToast('Clon Digital guardado con éxito 🪞', 'success');
            await update(); // refresh session
            setFile(null);
            
            if (onComplete) onComplete();
        } catch (error) {
            showToast('Error al guardar tu Clon Digital', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-premium" style={{ padding: '32px 24px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px', color: 'var(--foreground)' }}>
                Tu Clon Digital <span style={{ color: 'var(--primary)' }}>VTO</span>
            </h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', marginBottom: '32px', lineHeight: 1.5 }}>
                Sube una foto tuya de cuerpo completo, preferiblemente con ropa ajustada y buena iluminación. 
                <br/><br/>
                La usaremos como tu <strong>Modelo Base</strong> para que puedas probarte ropa virtualmente (Virtual Try-On).
            </p>

            <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '3/4',
                margin: '0 auto 24px',
                borderRadius: '16px',
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
                        <span style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📸</span>
                        <span style={{ fontWeight: 600 }}>Toca para subir foto</span>
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
                    style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                >
                    {uploading ? 'Procesando tu Avatar...' : 'Guardar Clon Digital ✨'}
                </button>
            )}
        </div>
    );
}
