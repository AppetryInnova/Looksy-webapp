'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import logger from '@/lib/logger';
import { FaMagic, FaUpload, FaTshirt, FaPalette, FaTag, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';

export default function AddItemForm({ onItemAdded }: { onItemAdded: () => void }) {
    const { data: session } = useSession();
    const t = useTranslations('Wardrobe');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [category, setCategory] = useState('Top');
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [color, setColor] = useState('');
    const [brand, setBrand] = useState('');
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiConfidence, setAiConfidence] = useState<number | null>(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        
        // Auto-analyze when file is selected
        handleAutoAnalyze(file);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleAutoAnalyze = async (selectedFile: File) => {
        setAnalyzing(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch('/api/items/analyze', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                if (data.category) setCategory(data.category);
                if (data.color) setColor(data.color);
                if (data.brand && data.brand !== 'Generico') setBrand(data.brand);
                setAiConfidence(data.confidence);
            }
        } catch (e) {
            logger.error('Auto-analysis failed', e);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) return;
        setLoading(true);

        try {
            let imageUrl = imageUrlInput || 'https://placehold.co/300x400?text=No+Image';

            if (file) {
                // Compress image before upload
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };
                
                let compressedFile = file;
                try {
                    compressedFile = await imageCompression(file, options);
                } catch (error) {
                    logger.error('Compression failed, uploading original', error);
                }

                const formData = new FormData();
                formData.append('file', compressedFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    imageUrl = data.url;
                }
            }

            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl,
                    category,
                    color,
                    brand,
                    userId: session.user.id,
                }),
            });

            if (res.ok) {
                setFile(null);
                setImageUrlInput('');
                setColor('');
                setBrand('');
                setAiConfidence(null);
                onItemAdded();
            }
        } catch (error) {
            logger.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-premium" style={{ 
            padding: '32px', borderRadius: '32px', border: '1px solid var(--glass-border)',
            maxWidth: '600px', margin: '0 auto'
        }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaTshirt color="var(--color-primary)" /> {t('addItem')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Upload Area */}
                <div style={{ 
                    border: '2px dashed var(--glass-border)', 
                    borderRadius: '24px', 
                    padding: '40px 20px', 
                    textAlign: 'center',
                    position: 'relative',
                    background: previewUrl ? 'none' : 'rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}>
                    {previewUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                            <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }} />
                            <button 
                                type="button" 
                                onClick={() => setFile(null)}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <FaUpload size={40} color="var(--color-text-dim)" />
                            <span style={{ fontWeight: 700, color: 'var(--color-text-dim)' }}>Sube una foto de tu prenda</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>O pega el link más abajo</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                style={{ display: 'none' }}
                            />
                        </label>
                    )}

                    <AnimatePresence>
                        {analyzing && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ 
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 10
                                }}
                            >
                                <div className="spinner-ai"></div>
                                <span style={{ fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>ANALIZANDO CON IA...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!file && (
                    <input
                        type="text"
                        placeholder="O pega el link de la imagen aquí..."
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                    />
                )}

                {/* AI Suggestions Badge */}
                {aiConfidence && !analyzing && (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', 
                            padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800
                        }}
                    >
                        <FaMagic /> Sugerencias de IA aplicadas con éxito
                    </motion.div>
                )}

                {/* Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Categoría</label>
                        
                        <button
                            type="button"
                            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                            style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px', borderRadius: '16px', 
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', 
                                color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left', width: '100%',
                                fontWeight: 600, fontSize: '0.9rem'
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{
                                    category === 'Top' ? '👕' :
                                    category === 'Bottom' ? '👖' :
                                    category === 'Shoes' ? '👟' :
                                    category === 'Accessory' ? '👜' : '🧥'
                                }</span>
                                <span>{
                                    category === 'Top' ? 'Tops' :
                                    category === 'Bottom' ? 'Bottoms' :
                                    category === 'Shoes' ? 'Calzado' :
                                    category === 'Accessory' ? 'Accesorios' : 'Abrigos'
                                }</span>
                            </span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{categoryDropdownOpen ? '▲' : '▼'}</span>
                        </button>

                        {categoryDropdownOpen && (
                            <>
                                <div 
                                    onClick={() => setCategoryDropdownOpen(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'transparent' }} 
                                />
                                <div className="glass-premium" style={{ 
                                    position: 'absolute', top: '100%', left: 0, right: 0, 
                                    background: 'var(--glass-elevated)', border: '1px solid var(--glass-border)',
                                    borderRadius: '20px', padding: '8px', zIndex: 100, marginTop: '6px',
                                    display: 'flex', flexDirection: 'column', gap: '4px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}>
                                    {[
                                        { value: 'Top', label: 'Tops', icon: '👕' },
                                        { value: 'Bottom', label: 'Bottoms', icon: '👖' },
                                        { value: 'Shoes', label: 'Calzado', icon: '👟' },
                                        { value: 'Accessory', label: 'Accesorios', icon: '👜' },
                                        { value: 'Outerwear', label: 'Abrigos', icon: '🧥' }
                                    ].map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => {
                                                setCategory(cat.value);
                                                setCategoryDropdownOpen(false);
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 14px', borderRadius: '12px', border: 'none',
                                                background: category === cat.value ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                                color: category === cat.value ? 'var(--color-primary)' : 'var(--color-text-dim)',
                                                fontWeight: category === cat.value ? 800 : 600,
                                                fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left',
                                                transition: 'all 0.2s'
                                            }}
                                            className="dropdown-item-hover"
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                            {category === cat.value && <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Color</label>
                        <div style={{ position: 'relative' }}>
                            <FaPalette style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="text"
                                placeholder="Ejem. Negro, Azul..."
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                style={{ padding: '14px 14px 14px 40px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--color-text)', width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Marca</label>
                        <div style={{ position: 'relative' }}>
                            <FaTag style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="text"
                                placeholder="Ejem. Zara, Nike, Gucci..."
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                style={{ padding: '14px 14px 14px 40px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--color-text)', width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="btn-luxury" 
                    disabled={loading || analyzing}
                    style={{ 
                        marginTop: '12px', padding: '18px', fontSize: '1.1rem', fontWeight: 900,
                        background: 'var(--gradient-primary)', border: 'none'
                    }}
                >
                    {loading ? 'Guardando...' : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <FaCheckCircle /> Guardar en Ropero
                        </span>
                    )}
                </button>
            </div>

            <style jsx>{`
                .spinner-ai {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255,255,255,0.1);
                    border-top-color: var(--color-primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .dropdown-item-hover:hover {
                    background: rgba(255, 255, 255, 0.06) !important;
                    color: var(--color-text) !important;
                }
                :global([data-theme='light']) .dropdown-item-hover:hover {
                    background: rgba(0, 0, 0, 0.04) !important;
                }
            `}</style>
        </form>
    );
}
