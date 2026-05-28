'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { showToast } from '@/components/Toast';

type StoreItem = {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
    store: {
        name: string;
        address: string;
    };
};

export default function OutfitSuggester() {
    const [suggestions, setSuggestions] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/outfits/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setMessage(data.message || '');
            }
        } catch (error) {
            logger.error('Error fetching suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-neon-purple font-mono text-sm animate-pulse">Analyzing wardrobe data...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-4 pb-24">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-pink-500">
                        Completa tu Look
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {message}
                    </p>
                </div>
                <button
                    onClick={fetchSuggestions}
                    disabled={loading}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neon-purple transition-all active:scale-95 disabled:opacity-50"
                    title="Refrescar sugerencias"
                >
                    🔄
                </button>
            </div>

            {suggestions.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {suggestions.map((item) => (
                        <div
                            key={item.id}
                            className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-neon-purple/50 transition-all duration-300 shadow-lg hover:shadow-neon-purple/20"
                        >
                            <div className="aspect-[3/4] relative overflow-hidden">
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                <div className="absolute top-2 right-2">
                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neon-purple text-white shadow-lg">
                                        NEW
                                    </span>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="text-xs text-gray-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                        {item.store.name}
                                    </p>
                                    <h4 className="text-sm font-bold text-white leading-tight mb-1 truncate">
                                        {item.name}
                                    </h4>
                                    <div className="flex justify-between items-center">
                                        <p className="text-neon-purple font-bold">
                                            ${item.price.toFixed(2)}
                                        </p>
                                        <button
                                            onClick={() => showToast(`Añadido ${item.name} a tu lista de deseos (Simulado)`, 'success')}
                                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-neon-purple hover:text-white transition-colors cursor-pointer z-10"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 rounded-3xl border border-dashed border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="text-5xl mb-4 animate-bounce">✨</div>
                    <h3 className="text-xl font-bold text-white mb-2">Armario Sincronizado</h3>
                    <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                        Tu armario está en perfecta armonía con las tendencias actuales. ¡Vuelve pronto por más!
                    </p>
                    <button
                        onClick={fetchSuggestions}
                        className="px-6 py-3 bg-neon-purple/10 text-neon-purple rounded-full text-sm font-bold border border-neon-purple/20 hover:bg-neon-purple/30 transition-all hover:scale-105 active:scale-95"
                    >
                        Buscar nuevas tendencias
                    </button>
                </div>
            )}
        </div>
    );
}
