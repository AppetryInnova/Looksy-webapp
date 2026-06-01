'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Navigation2 } from 'lucide-react';
import logger from '@/lib/logger';

// Dynamic import for Leaflet map to avoid SSR window is not defined
const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-white/5 animate-pulse rounded-2xl flex items-center justify-center border border-white/10">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <span className="text-xs text-emerald-500/50 font-mono tracking-widest uppercase">Loading Map Layer</span>
        </div>
    </div>
});

type Store = {
    id: string;
    name: string;
    address: string;
    type: string;
    items: Record<string, unknown>[];
    lat: number;
    lng: number;
    rating: number;
    distance?: number;
    description?: string;
    openingHours?: string;
    imageUrl?: string;
};

const CATEGORIES = ['All', 'Boutique', 'Vintage', 'Luxury', 'Sports', 'Mall'];

export default function ShopMap() {
    const [locationQuery, setLocationQuery] = useState('');
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);

    // UI State
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [searchRadius, setSearchRadius] = useState(10); // Default 10km
    const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];

    const fetchIPLocation = async () => {
        try {
            logger.info("Attempting IP-based geolocation fallback...");
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
                const data = await res.json();
                if (data.latitude && data.longitude) {
                    logger.info(`IP Geolocation successful: Lat=${data.latitude}, Lng=${data.longitude}`);
                    updateLocation(data.latitude, data.longitude);
                    return;
                }
            }
        } catch (ipErr) {
            logger.error("IP geolocation fallback failed:", ipErr);
        }
        // Final fallback
        updateLocation(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
    };

    useEffect(() => {
        setLoading(true);
        // Try Geolocation on mount
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    updateLocation(latitude, longitude);
                },
                (error) => {
                    logger.warn("Geolocation denied or error, falling back to IP:", error);
                    fetchIPLocation();
                },
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 } // Changed highAccuracy to false for better mobile response and increased timeout
            );
        } else {
            logger.warn("Geolocation not supported by browser, falling back to IP");
            fetchIPLocation();
        }
    }, []);

    const updateLocation = (lat: number, lng: number) => {
        const coords: [number, number] = [lat, lng];
        setUserLocation(coords);
        fetchStores(lat, lng);
    };

    const fetchStores = async (lat: number, lng: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/stores?lat=${lat}&lng=${lng}`);
            if (res.ok) {
                const data = await res.json();
                setStores(data);
            }
        } catch (error) {
            logger.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualLocationSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!locationQuery.trim()) return;

        setIsSearchingLocation(true);
        try {
            // Free Geocoding with OpenStreetMap Nominatim
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                updateLocation(lat, lon);
                setSearchRadius(10); // Reset radius
            } else {
                alert('No encontramos esa ubicación.');
            }
        } catch (error) {
            logger.error('Error geocoding:', error);
            alert('Error al buscar la ubicación.');
        } finally {
            setIsSearchingLocation(false);
        }
    };

    const filteredStores = useMemo(() => {
        return stores.filter(s => {
            const matchesCategory = activeCategory === 'All' || s.type === activeCategory;
            const matchesRadius = (s.distance || 0) <= searchRadius;
            return matchesCategory && matchesRadius;
        });
    }, [stores, activeCategory, searchRadius]);

    if (loading && !stores.length) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                    <p className="text-emerald-500 font-mono text-sm tracking-widest uppercase animate-pulse">Scanning...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Radar
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '8px', color: 'white' }}>
                    Tiendas <span style={{ color: '#10b981' }}>Cercanas</span>
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Explora hotspots de moda a tu alrededor.</p>
            </div>

            {/* Manual Location Search - Moved OUTSIDE map for safety */}
            <form onSubmit={handleManualLocationSearch} style={{ marginBottom: '20px', position: 'relative', zIndex: 10 }}>
                <input
                    type="text"
                    placeholder="📍 Buscar ciudad (ej: Palermo, Buenos Aires)"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '14px 16px',
                        paddingRight: '40px',
                        borderRadius: '16px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#10b981',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    {isSearchingLocation ? (
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    )}
                </button>
            </form>

            {/* Map Container */}
            <div style={{
                height: '350px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '24px',
                position: 'relative',
                zIndex: 1
            }}>
                <div id="map-top-container" style={{ width: '100%', height: '100%' }}>
                    <MapComponent stores={filteredStores} center={userLocation || DEFAULT_CENTER} />
                </div>
            </div>

            {/* Controls Panel */}
            <div style={{
                background: '#1a1a1a',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                {/* Search Radius */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af' }}>Radio de búsqueda</span>
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>{searchRadius} km</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                        style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#374151', outline: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>
                        <span>1 KM</span>
                        <span>50 KM</span>
                    </div>
                </div>

                {/* Categories */}
                <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '12px' }}>Categorías</span>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    flex: '0 0 auto',
                                    padding: '8px 16px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    border: activeCategory === cat ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                    background: activeCategory === cat ? '#10b981' : 'rgba(255,255,255,0.05)',
                                    color: activeCategory === cat ? 'black' : '#9ca3af',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Resultados</h3>
                <span style={{ fontSize: '0.8rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>{filteredStores.length} spots</span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredStores.length > 0 ? (
                    filteredStores.map((store) => (
                        <div key={store.id} style={{ background: '#1a1a1a', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {/* Image */}
                            <div style={{ position: 'relative', height: '180px' }}>
                                <img
                                    src={store.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800'}
                                    alt={store.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800'; }}
                                />
                                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '8px', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                                    ⭐ {store.rating}
                                </div>
                                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '20px 16px 12px' }}>
                                    <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 4px' }}>{store.name}</h3>
                                    <div style={{ color: '#d1d5db', fontSize: '0.85rem' }}>{store.type} • {store.distance} km</div>
                                </div>
                            </div>
                            {/* Content */}
                            <div style={{ padding: '16px' }}>
                                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {store.address} - {store.description || 'Tienda de moda destacada.'}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button
                                        onClick={() => {
                                            const mapElement = document.getElementById('map-top-container');
                                            if (mapElement) mapElement.scrollIntoView({ behavior: 'smooth' });
                                            setUserLocation([store.lat, store.lng]);
                                        }}
                                        style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                                    >
                                        Ver en Mapa
                                    </button>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '12px', background: '#10b981', border: 'none', color: 'black', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'none' }}
                                    >
                                        Ir Ahora
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                        No hay tiendas cercanas. Intenta ampliar el radio.
                        <br /><br />
                        <button onClick={() => setSearchRadius(50)} style={{ color: '#10b981', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
                            Ampliar a 50km
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
