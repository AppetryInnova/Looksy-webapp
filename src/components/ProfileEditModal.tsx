'use client';

import { useState } from 'react';
import logger from '@/lib/logger';

type ProfileEditModalProps = {
    user: {
        username: string | null;
        avatarUrl: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
};

export default function ProfileEditModal({ user, isOpen, onClose, onUpdate }: ProfileEditModalProps) {
    const [username, setUsername] = useState(user.username || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, avatarUrl })
            });

            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                alert('Error al actualizar el perfil');
            }
        } catch (error) {
            logger.error('Error updating profile:', error);
            alert('Error al actualizar el perfil');
        } finally {
type ProfileEditModalProps = {
    user: {
        username: string | null;
        avatarUrl: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
};

export default function ProfileEditModal({ user, isOpen, onClose, onUpdate }: ProfileEditModalProps) {
    const [username, setUsername] = useState(user.username || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, avatarUrl })
            });

            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                alert('Error al actualizar el perfil');
            }
        } catch (error) {
            logger.error('Error updating profile:', error);
            alert('Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                className="glass-premium"
                style={{
                    width: '90%',
                    maxWidth: '500px',
                    padding: '24px',
                    animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-luxury" style={{ marginBottom: '24px', fontSize: '1.75rem', textAlign: 'center' }}>
                    Editar Perfil
                </h2>

                {/* Avatar Preview */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: avatarUrl
                            ? `url(${avatarUrl}) center/cover`
                            : 'var(--bg-gradient-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: 'var(--shadow-premium)'
                    }}>
                        {!avatarUrl && (username?.charAt(0)?.toUpperCase() || 'U')}
                    </div>
                </div>

                {/* Edit Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                        }}>
                            Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Tu nombre de usuario"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--glass-surface)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                        }}>
                            URL del Avatar
                        </label>
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://ejemplo.com/avatar.jpg"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--glass-surface)',
                                fontSize: '1rem'
                            }}
                        />
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-dim)',
                            marginTop: '4px'
                        }}>
                            Pega la URL de una imagen para tu avatar
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        style={{ flex: 1, padding: '14px' }}
                    >
                        Cancelar
                    </button>
                    <button
                        className="btn-luxury"
                        onClick={handleSave}
                        disabled={saving || !username.trim()}
                        style={{ flex: 1, padding: '14px' }}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
