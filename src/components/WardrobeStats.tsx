import React from 'react';

type Item = {
    id: string;
    imageUrl: string;
    category: string;
    color: string | null;
    brand: string | null;
};

export default function WardrobeStats({ items }: { items: Item[] }) {
    const totalItems = items.length;

    // Calculate Top Category
    const categories = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate Top Color
    const colors = items.reduce((acc, item) => {
        if (item.color) {
            acc[item.color] = (acc[item.color] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    const topColor = Object.entries(colors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Mock Sustainability Score (0-100) based on items count (less is more sustainable? or balanced?)
    // Let's say optimal is 30-50 items.
    let sustainabilityScore = 85;
    if (totalItems > 100) sustainabilityScore = 60;
    if (totalItems < 10) sustainabilityScore = 95;

    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
            gap: '12px', 
            marginBottom: '24px' 
        }}>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Total Prendas</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text)' }}>{totalItems}</div>
            </div>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Top Categoría</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-primary)' }}>{topCategory}</div>
            </div>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Color Favorito</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a855f7' }}>{topColor}</div>
            </div>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Sostenibilidad</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>{sustainabilityScore}/100</div>
            </div>
        </div>
    );
}
