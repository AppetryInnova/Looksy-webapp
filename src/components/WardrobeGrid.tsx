'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import ItemDetailModal from '@/components/ItemDetailModal';
import OptimizedImage from '@/components/OptimizedImage';
import logger from '@/lib/logger';

type Item = {
    id: string;
    imageUrl: string;
    category: string;
    color: string | null;
    brand: string | null;
};

export default function WardrobeGrid({ items, loading, error, onRefresh, filter, onEmptyState, isOwner = true }: { items: Item[]; loading: boolean; error: string | null; onRefresh: () => void; filter: string; onEmptyState?: () => void; isOwner?: boolean }) {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de borrar esta prenda?')) return;

        try {
            const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
            if (res.ok) {
                onRefresh();
            } else {
                alert('Error al borrar');
            }
        } catch (error) {
            logger.error(error);
            alert('Error al borrar');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="card glass-premium"
                        style={{
                            padding: '10px',
                            cursor: 'default',
                            animation: `pulse 1.5s infinite ease-in-out ${i * 0.1}s`,
                            opacity: 0.7
                        }}
                    >
                        <div style={{
                            aspectRatio: '3/4',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            marginBottom: '10px'
                        }} />
                        <div style={{
                            height: '1rem',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            marginBottom: '5px',
                            width: '70%'
                        }} />
                        <div style={{
                            height: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            width: '50%'
                        }} />
                        <style jsx>{`
                            @keyframes pulse {
                                0%, 100% { opacity: 0.4; }
                                50% { opacity: 0.8; }
                            }
                        `}</style>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={onRefresh} />;
    }

    if (items.length === 0) {
        return (
            <EmptyState
                icon="👕"
                title="Tu ropero está vacío"
                description="Comienza a agregar tus prendas favoritas para crear outfits increíbles"
                action={{
                    label: '+ Agregar Primera Prenda',
                    onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
            />
        );
    }

    if (items.length > 0 && filter !== 'ALL' && items.filter(item => item.category.toUpperCase() === filter).length === 0) {
        // Filter logic moved here slightly for better flow or keep as is? 
        // Actually let's just use the filteredItems check below, but we need filteredItems defined.
    }

    // Re-calculating filtered items here to be safe if moved
    const filteredItems = filter === 'ALL'
        ? items
        : items.filter(item => item.category.toUpperCase() === filter);

    if (items.length > 0 && filteredItems.length === 0) {
        return (
            <EmptyState
                icon="🔍"
                title="No hay prendas en esta categoría"
                description="Intenta con otra categoría o agrega nuevas prendas"
            />
        );
    }

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="card"
                        style={{ padding: '10px', position: 'relative', cursor: 'pointer' }}
                        onClick={() => setSelectedItem(item)}
                    >
                        <div style={{ aspectRatio: '3/4', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                            {item.imageUrl ? (
                                <OptimizedImage src={item.imageUrl} alt={item.category} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>No Image</div>
                            )}
                        </div>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{item.category}</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{item.brand} - {item.color}</p>
                    </div>
                ))}
            </div>

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onUpdate={onRefresh}
                    isOwner={isOwner}
                />
            )
            }
        </>
    );
}
