'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import OptimizedImage from '@/components/OptimizedImage';
import styles from './marketplace.module.css';
import { logger } from '@/lib/logger';

type Product = {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl: string;
    inStock: boolean;
    store: {
        name: string;
        rating: number;
    };
    _count: {
        wishlist: number;
    };
    affiliateUrl?: string; // Simulated field
};

const MarketplacePage = () => {
    const { data: session } = useSession();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [aiMode, setAiMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
    // Debounce for price range to avoid too many fetches
    const [debouncedPriceRange, setDebouncedPriceRange] = useState<[number, number]>([0, 500]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedPriceRange(priceRange);
        }, 500);
        return () => clearTimeout(timer);
    }, [priceRange]);

    const categories = [
        { id: 'all', label: 'Todo', icon: '🛍️' },
        { id: 'Vestidos', label: 'Vestidos', icon: '👗' },
        { id: 'Sacos', label: 'Sacos', icon: '🧥' },
        { id: 'Pantalones', label: 'Pantalones', icon: '👖' },
        { id: 'Sweaters', label: 'Sweaters', icon: '🧶' },
        { id: 'Zapatos', label: 'Zapatos', icon: '👠' }
    ];

    useEffect(() => {
        fetchProducts();
        if (session) {
            fetchWishlist();
        }
    }, [activeCategory, debouncedPriceRange, searchQuery, session, aiMode]); // Trigger on debounced changes

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                category: activeCategory,
                minPrice: debouncedPriceRange[0].toString(),
                maxPrice: debouncedPriceRange[1].toString(),
                search: searchQuery,
                ai_mode: aiMode.toString()
            });
            const res = await fetch(`/api/marketplace/products?${params}`);
            const data = await res.json();
            setProducts(data.products || []);
        } catch (error) {
            logger.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWishlist = async () => {
        try {
            const res = await fetch('/api/marketplace/wishlist');
            if (res.ok) {
                const data = await res.json();
                const wishlistIds = new Set<string>(data.map((item: { storeItemId: string }) => item.storeItemId));
                setWishlist(wishlistIds);
            }
        } catch (error) {
            logger.error('Error fetching wishlist:', error);
        }
    };

    const toggleWishlist = async (productId: string) => {
        if (!session) {
            alert('Inicia sesión para guardar favoritos');
            return;
        }

        const isInWishlist = wishlist.has(productId);

        try {
            const res = await fetch('/api/marketplace/wishlist', {
                method: isInWishlist ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeItemId: productId })
            });

            if (res.ok) {
                const newWishlist = new Set(wishlist);
                if (isInWishlist) {
                    newWishlist.delete(productId);
                } else {
                    newWishlist.add(productId);
                }
                setWishlist(newWishlist);
            }
        } catch (error) {
            logger.error('Error toggling wishlist:', error);
        }
    };

    const handleAffiliateClick = (product: Product) => {
        // Simulation of affiliate tracking
        // Track affiliate click for product

        // Construct a real-world search query URL
        // If it's a known brand (simulated by store name), we could direct to their specific search

        let url = '';
        const encodedName = encodeURIComponent(product.name);

        if (product.store.name.toLowerCase().includes('zara')) {
            url = `https://www.google.com/search?q=Zara+${encodedName}&tbm=shop`;
        } else if (product.store.name.toLowerCase().includes('amazon')) {
            url = `https://www.amazon.com/s?k=${encodedName}&tag=looksy-20`; // Fake tag
        } else {
            // General Google Shopping Search
            url = `https://www.google.com/search?q=${encodedName}+buy+online&tbm=shop`;
        }

        // Open in new tab
        const win = window.open(url, '_blank');
        if (win) {
            win.focus();
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>🛍️ Marketplace</h1>
                <p className={styles.subtitle}>Encuentra las mejores ofertas curadas para tu estilo.</p>

                {/* Search Bar */}
                <div style={{ position: 'relative', maxWidth: '500px', margin: '20px auto 0' }}>
                    <input
                        type="text"
                        placeholder="Buscar prendas, marcas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 20px 12px 48px',
                            borderRadius: '24px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>🔍</span>
                </div>
            </header>

            {/* AI Recommendation Banner */}
            <div className={styles.aiBanner}>
                <div className={styles.aiIcon}>✨</div>
                <div className={styles.aiContent}>
                    <h2 className={styles.aiTitle}>Selección Inteligente</h2>
                    <p className={styles.aiText}>Prendas que maximizan tu puntuación de estilo y colorimetría.</p>
                </div>
                <button 
                    className={aiMode ? "btn-secondary" : "btn-primary"} 
                    style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                    onClick={() => {
                        setAiMode(!aiMode);
                        // Reset other filters momentarily
                        if (!aiMode) {
                            setActiveCategory('all');
                            setSearchQuery('');
                        }
                    }}
                >
                    {aiMode ? 'Desactivar Filtro' : 'Ver Mi Selección'}
                </button>
            </div>

            {/* Filters Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {/* Categories */}
                <div className={styles.categoriesScroller}>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`${styles.categoryButton} ${activeCategory === cat.id ? styles.active : ''}`}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Price Filter (Simple) */}
                <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
                    <span>Precio:</span>
                    <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        style={{ width: '70px', padding: '6px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                    <span>-</span>
                    <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        style={{ width: '70px', padding: '6px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                </div>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className={styles.loading}>
                    <div className="spinner"></div>
                    <p>Buscando las mejores ofertas...</p>
                </div>
            ) : (
                <div className={styles.productGrid}>
                    {products.map((product) => (
                        <div key={product.id} className={styles.productCard}>
                            <div className={styles.productImage}>
                                <OptimizedImage src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%' }} />

                                {/* Affiliate / Store Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(4px)',
                                    padding: '4px 8px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span>🏪</span> {product.store.name}
                                </div>

                                <div className={styles.badges}>
                                    <div className={styles.wishlistBadge}>
                                        ❤️ {product._count.wishlist}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.productInfo}>
                                <div className={styles.productHeader}>
                                    <div>
                                        <h3 className={styles.productName}>{product.name}</h3>
                                        {/* <p className={styles.storeName}>Tienda: {product.store.name}</p> MOVED TO BADGE */}
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{product.category}</p>
                                    </div>
                                    <div className={styles.priceSection}>
                                        <span className={styles.price}>${product.price.toFixed(2)}</span>
                                        <div className={styles.rating}>⭐ {product.store.rating}</div>
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button
                                        onClick={() => handleAffiliateClick(product)}
                                        className="btn-primary"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Orange for Buy
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <span>Comprar</span>
                                        <span style={{ fontSize: '0.8em', opacity: 0.8 }}>↗</span>
                                    </button>
                                    <button
                                        className={`${styles.wishlistButton} ${wishlist.has(product.id) ? styles.wishlisted : ''}`}
                                        onClick={() => toggleWishlist(product.id)}
                                    >
                                        {wishlist.has(product.id) ? '❤️' : '🤍'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {products.length === 0 && !loading && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🛍️</div>
                    <h3>No encontramos productos</h3>
                    <p>Intenta ajustar tu búsqueda o el rango de precios.</p>
                </div>
            )}
        </div>
    );
};

export default MarketplacePage;
