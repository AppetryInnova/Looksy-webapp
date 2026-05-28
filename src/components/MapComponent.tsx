'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ── Fix: guard the invalidateSize call so it only fires if the map
//    container is still mounted. The error "_leaflet_pos of undefined"
//    happens when the setTimeout fires after the map has been destroyed.
function MapRecenter({ center }: { center: [number, number] }) {
    const map = useMap();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Check map is still alive before touching it
        if (!map || !map.getContainer()) return;

        map.setView(center, map.getZoom());

        // Invalidate size to fix blank/black tile issue, but cancel on unmount
        timerRef.current = setTimeout(() => {
            try {
                if (map.getContainer()) {
                    map.invalidateSize();
                }
            } catch {
                // Swallow — map was destroyed before timeout fired
            }
        }, 150);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [center, map]);

    return null;
}

// User location icon (blue)
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Store icon (green)
const storeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Popup styles injected once via a normal <style> tag (avoids styled-jsx dependency)
const POPUP_CSS = `
.custom-popup .leaflet-popup-content-wrapper {
    background: rgba(22, 22, 22, 0.9) !important;
    backdrop-filter: blur(12px) !important;
    color: white !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 16px !important;
    padding: 0 !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
}
.custom-popup .leaflet-popup-tip {
    background: rgba(22,22,22,0.9) !important;
}
.custom-popup .leaflet-popup-close-button {
    color: rgba(255,255,255,0.6) !important;
    top: 6px !important;
    right: 8px !important;
}
`;

interface Store {
    id: string;
    name: string;
    description?: string;
    lat: number;
    lng: number;
    type: string;
    rating: number;
    address: string;
}

interface MapComponentProps {
    stores: Store[];
    center: [number, number];
}

export default function MapComponent({ stores, center }: MapComponentProps) {
    return (
        <div style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            {/* Inline styles for Leaflet popups — avoids styled-jsx */}
            <style dangerouslySetInnerHTML={{ __html: POPUP_CSS }} />

            <MapContainer
                center={center}
                zoom={14}
                style={{ height: '100%', width: '100%', background: '#111' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapRecenter center={center} />

                {/* User location marker */}
                <Marker position={center} icon={userIcon}>
                    <Popup className="custom-popup">
                        <div style={{ color: 'white', fontWeight: 'bold', padding: '4px 8px' }}>
                            Tú estás aquí
                        </div>
                    </Popup>
                </Marker>

                {stores.map(store => (
                    <Marker
                        key={store.id}
                        position={[store.lat, store.lng]}
                        icon={storeIcon}
                    >
                        <Popup className="custom-popup">
                            <div style={{ padding: '8px', minWidth: '140px' }}>
                                <h4 style={{ fontWeight: 'bold', color: '#10b981', fontSize: '0.875rem', marginBottom: '4px' }}>
                                    {store.name}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.625rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold', border: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase' }}>
                                        {store.type}
                                    </span>
                                    <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold' }}>★ {store.rating}</span>
                                </div>
                                <p style={{ fontSize: '0.6875rem', color: '#9ca3af', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontStyle: 'italic' }}>
                                    {store.address}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legend overlay */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.625rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.5)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 'bold' }}>Tu ubicación</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 'bold' }}>Tiendas Looksy</span>
                </div>
            </div>
        </div>
    );
}
