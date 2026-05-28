'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import logger from '@/lib/logger';
import BottomSheetModal from './BottomSheetModal';
import OptimizedImage from './OptimizedImage';

type SearchResult = {
    users: { id: string; username: string; avatarUrl: string | null; level: string }[];
    items: { id: string; category: string; brand: string | null; color: string | null; imageUrl: string }[];
};

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult>({ users: [], items: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                performSearch();
            } else {
                setResults({ users: [], items: [] });
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            logger.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BottomSheetModal isOpen={isOpen} onClose={onClose} title="Buscar">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Usuarios, marcas, prendas..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                    style={{
                        flex: 1, padding: '12px', borderRadius: '12px',
                        border: '1px solid var(--glass-border)', background: 'var(--color-background)',
                        color: 'var(--color-text)', fontSize: '1rem',
                        outline: 'none'
                    }}
                />
            </div>

            {loading && <p style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>Buscando...</p>}

            {!loading && (results.users.length > 0 || results.items.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {results.users.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuarios</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {results.users.map(user => (
                                    <Link href={`/${user.id}`} key={user.id} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                                                {user.avatarUrl ? <OptimizedImage src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '600', margin: 0 }}>@{user.username}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', margin: 0 }}>{user.level}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {results.items.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Prendas</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                                {results.items.map(item => (
                                    <div key={item.id} style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>
                                        <div style={{ aspectRatio: '3/4', background: '#eee' }}>
                                            {item.imageUrl && <OptimizedImage src={item.imageUrl} alt={item.category} style={{ width: '100%', height: '100%' }} />}
                                        </div>
                                        <div style={{ padding: '10px' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>{item.category}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', margin: 0 }}>{item.brand}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!loading && query.length >= 2 && results.users.length === 0 && results.items.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-dim)', marginTop: '20px' }}>No se encontraron resultados</p>
            )}
        </BottomSheetModal>
    );
}
