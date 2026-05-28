import React, { useState, useEffect } from 'react';

type Item = {
    id: string;
    imageUrl: string;
    category: string;
};

export default function OutfitGeneratorModal({ isOpen, onClose, items }: { isOpen: boolean; onClose: () => void; items: Item[] }) {
    const [outfit, setOutfit] = useState<{ top?: Item, bottom?: Item, shoes?: Item } | null>(null);
    const [generating, setGenerating] = useState(false);

    const generateOutfit = () => {
        setGenerating(true);
        setOutfit(null);

        // Fast shuffle effect
        setTimeout(() => {
            const tops = items.filter(i => i.category === 'TOP');
            const bottoms = items.filter(i => i.category === 'BOTTOM');
            const shoes = items.filter(i => i.category === 'SHOES');

            // Randomized selection (Shuffler)
            // Future improvement: Use tags/colors for smart matching
            const randomTop = tops.length ? tops[Math.floor(Math.random() * tops.length)] : undefined;
            const randomBottom = bottoms.length ? bottoms[Math.floor(Math.random() * bottoms.length)] : undefined;
            const randomShoes = shoes.length ? shoes[Math.floor(Math.random() * shoes.length)] : undefined;

            setOutfit({ top: randomTop, bottom: randomBottom, shoes: randomShoes });
            setGenerating(false);
        }, 600);
    };

    useEffect(() => {
        if (isOpen) {
            generateOutfit();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
        }}>
            <div className="glass-premium animate-fade-in-up" style={{
                padding: '32px', width: '90%', maxWidth: '400px',
                textAlign: 'center', position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--color-text)', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                    ✕
                </button>

                <h2 className="text-luxury" style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
                    Outfit Shuffler 🎲
                </h2>
                <p style={{ color: 'var(--color-text-dim)', marginBottom: '32px' }}>Mix and match from your wardrobe.</p>

                {generating ? (
                    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="spinner" style={{ width: '48px', height: '48px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', marginBottom: '16px' }}></div>
                        <p style={{ color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '0.05em', fontSize: '0.9rem', animation: 'pulse 1.5s infinite' }}>SHUFFLING...</p>
                    </div>
                ) : (outfit && (outfit.top || outfit.bottom || outfit.shoes) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                        {/* Layout the outfit visually */}
                        {outfit.top && (
                            <img src={outfit.top.imageUrl} alt="Top" style={{ width: '120px', height: '120px', objectFit: 'contain', background: '#333', borderRadius: '16px' }} />
                        )}
                        {outfit.bottom && (
                            <img src={outfit.bottom.imageUrl} alt="Bottom" style={{ width: '120px', height: '140px', objectFit: 'contain', background: '#333', borderRadius: '16px' }} />
                        )}
                        {outfit.shoes && (
                            <img src={outfit.shoes.imageUrl} alt="Shoes" style={{ width: '100px', height: '80px', objectFit: 'contain', background: '#333', borderRadius: '16px' }} />
                        )}

                        <button
                            onClick={generateOutfit}
                            className="btn-luxury"
                            style={{ marginTop: '24px', width: '100%' }}
                        >
                            🎲 Try Another
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: '20px' }}>
                        <p>Not enough items to generate an outfit! Add some tops, bottoms, and shoes first.</p>
                        <button onClick={onClose} className="btn-primary mt-4">Go Add Items</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
