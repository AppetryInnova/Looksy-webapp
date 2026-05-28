'use client';

import { useState, useRef } from 'react';

interface CreatePostModalProps {
    onClose: () => void;
    onPostCreated: (post: Record<string, unknown>) => void;
    currentUser?: { username?: string | null; avatarUrl?: string | null };
}

export default function CreatePostModal({ onClose, onPostCreated, currentUser }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) return;
        setSubmitting(true);

        try {
            let imageUrl: string | null = null;

            // Upload image if present
            if (imageFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url ?? uploadData.imageUrl ?? null;
                }
                setUploading(false);
            }

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.trim(), imageUrl }),
            });

            if (res.ok) {
                const newPost = await res.json();
                onPostCreated(newPost);
                onClose();
            }
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    const canPost = (content.trim().length > 0 || imageFile) && !submitting;
    const initials = currentUser?.username?.slice(0, 2).toUpperCase() ?? '??';

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 999
                }}
            />

            {/* Modal */}
            <div className="glass-premium" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                borderRadius: '24px 24px 0 0',
                zIndex: 1000,
                maxWidth: '640px',
                margin: '0 auto',
                padding: '1.5rem',
                animation: 'slideUpModal 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
                {/* Handle */}
                <div style={{
                    width: 36, height: 4, borderRadius: 2,
                    background: 'rgba(255,255,255,0.2)',
                    margin: '0 auto 1.25rem',
                }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 className="text-luxury" style={{ fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>Nuevo post</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
                            width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text-dim)'
                        }}
                    >×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* User + textarea */}
                    <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1rem' }}>
                        {currentUser?.avatarUrl ? (
                            <img
                                src={currentUser.avatarUrl}
                                alt=""
                                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.85rem', fontWeight: 700, color: 'white'
                            }}>
                                {initials}
                            </div>
                        )}
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="¿Qué estás usando hoy? Comparte tu look..."
                            maxLength={500}
                            rows={3}
                            autoFocus
                            style={{
                                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                color: 'var(--color-text)', fontSize: '1rem', resize: 'none',
                                lineHeight: 1.5, fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    {/* Image preview */}
                    {imagePreview && (
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 16 }}
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                style={{
                                    position: 'absolute', top: 8, right: 8,
                                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                                    width: 28, height: 28, cursor: 'pointer', color: 'white', fontSize: '0.9rem'
                                }}
                            >×</button>
                        </div>
                    )}

                    {/* Char count */}
                    {content.length > 0 && (
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '0.75rem' }}>
                            {content.length}/500
                        </div>
                    )}

                    {/* Actions row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                        {/* Photo button */}
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            style={{
                                background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)',
                                borderRadius: 12, padding: '0.5rem 0.875rem', cursor: 'pointer',
                                color: '#a855f7', fontSize: '0.85rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}
                        >
                            📷 Foto
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!canPost}
                            className={canPost ? "btn-luxury" : ""}
                            style={{
                                marginLeft: 'auto',
                                background: !canPost ? 'var(--glass-surface)' : undefined,
                                border: !canPost ? '1px solid var(--glass-border)' : undefined,
                                borderRadius: 12, padding: '0.6rem 1.5rem',
                                color: 'white', fontWeight: 700, fontSize: '0.9rem',
                                cursor: canPost ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                opacity: canPost ? 1 : 0.5
                            }}
                        >
                            {uploading ? 'Subiendo...' : submitting ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes slideUpModal {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
}
