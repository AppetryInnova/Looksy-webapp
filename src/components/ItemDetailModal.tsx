'use client';

import { useState } from 'react';
import logger from '@/lib/logger';
import VirtualTryOnModal from './VirtualTryOnModal';

type ItemDetailModalProps = {
    item: {
        id: string;
        imageUrl: string;
        category: string;
        color: string | null;
        brand: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
};

export default function ItemDetailModal({ item, isOpen, onClose, onUpdate }: ItemDetailModalProps) {
    const [category, setCategory] = useState(item.category);
    const [color, setColor] = useState(item.color || '');
    const [brand, setBrand] = useState(item.brand || '');
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showVTO, setShowVTO] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, color, brand })
            });

            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                alert('Error al actualizar la prenda');
            }
        } catch (error) {
            logger.error('Error updating item:', error);
            alert('Error al actualizar la prenda');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        try {
            const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                const data = await res.json();
                alert('Error al eliminar: ' + (data.error || 'Desconocido'));
            }
        } catch (error: any) {
            logger.error('Error deleting item:', error);
            alert('Error al eliminar');
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
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '24px',
                    animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Detalles de la Prenda
                </h2>

                {/* Image Preview */}
                <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden' }}>
                    <img
                        src={item.imageUrl}
                        alt={category}
                        style={{ width: '100%', maxHeight: '40vh', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    
                    <button 
                        className="btn-luxury" 
                        onClick={() => setShowVTO(true)} 
                        style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.95rem' }}
                    >
                        Probarme esto (VTO) 🪞
                    </button>
                </div>

                {/* Edit Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                            Categoría
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--foreground)',
                                fontSize: '1rem'
                            }}
                        >
                            <option value="TOP">Blusa / Top</option>
                            <option value="BOTTOM">Pantalón / Falda</option>
                            <option value="SHOES">Zapatos</option>
                            <option value="ACCESSORY">Accesorio</option>
                            <option value="OUTERWEAR">Abrigo</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                            Color
                        </label>
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder="Ej: Negro, Azul, Rojo"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--foreground)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                            Marca
                        </label>
                        <input
                            type="text"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="Ej: Zara, H&M, Nike"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--foreground)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleSave}
                        className="btn-luxury"
                        disabled={saving}
                        style={{ flex: 1 }}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={saving}
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </button>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={handleDelete}
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: confirmDelete ? '#ef4444' : 'transparent',
                            color: confirmDelete ? 'white' : '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        {confirmDelete ? '¿Estás seguro? Haz clic de nuevo' : 'Eliminar Prenda'}
                    </button>
                </div>
            </div>

            {showVTO ? (
                <VirtualTryOnModal 
                    isOpen={showVTO} 
                    onClose={() => {
                        setShowVTO(false);
                        onClose(); // Close the detail modal too
                    }} 
                    initialItem={item}
                />
            ) : null}
        </div>
    );
}
