'use client';

import { useState, useEffect } from 'react';
import AddItemForm from '@/components/AddItemForm';
import WardrobeGrid from '@/components/WardrobeGrid';
import WardrobeStats from '@/components/WardrobeStats';
import OutfitGeneratorModal from '@/components/OutfitGeneratorModal';
import StarterWardrobeModal from '@/components/wardrobe/StarterWardrobeModal';
import { useTranslations } from 'next-intl';
import styles from './wardrobe.module.css';
import { logger } from '@/lib/logger';

type Item = {
    id: string;
    imageUrl: string;
    category: string;
    color: string | null;
    brand: string | null;
};

export default function WardrobePage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [showAddForm, setShowAddForm] = useState(false);
    const [showStarterModal, setShowStarterModal] = useState(false);
    const [showOutfitGenerator, setShowOutfitGenerator] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const t = useTranslations('WardrobePage');

    const [paymentStatus, setPaymentStatus] = useState<{
        success: boolean;
        message: string;
        loading: boolean;
    } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const successParam = params.get('success');
            
            if (successParam === 'mercadopago_mock') {
                const purchaseType = params.get('purchaseType') || 'tokens';
                const plan = params.get('plan') || '';
                const userId = params.get('userId');

                if (userId) {
                    setPaymentStatus({
                        success: true,
                        message: 'Procesando pago simulado de Mercado Pago...',
                        loading: true
                    });

                    // Trigger the webhook simulation call
                    fetch('/api/webhook/mercadopago', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-mock-payment': 'true'
                        },
                        body: JSON.stringify({
                            type: 'payment',
                            data: { id: `mock_${Date.now()}` },
                            mockMetadata: {
                                userId,
                                purchaseType,
                                plan,
                                amount: purchaseType === 'tokens' ? 50 : 0
                            }
                        })
                    })
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to verify mock payment');
                        return res.json();
                    })
                    .then(data => {
                        setPaymentStatus({
                            success: true,
                            message: purchaseType === 'tokens' 
                                ? '¡Simulación exitosa! Se han acreditado 50 Tokens.'
                                : `¡Simulación exitosa! Tu plan ${plan} se ha activado.`,
                            loading: false
                        });
                        // Clean up URL query parameters
                        const cleanUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    })
                    .catch(err => {
                        logger.error('Error verifying simulated payment:', err);
                        setPaymentStatus({
                            success: false,
                            message: 'Error al simular la acreditación del pago.',
                            loading: false
                        });
                    });
                }
            } else if (successParam === 'mercadopago_purchased' || successParam === 'tokens_purchased') {
                setPaymentStatus({
                    success: true,
                    message: '¡Pago recibido con éxito! Tu saldo se actualizará en breve.',
                    loading: false
                });
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        }
    }, []);

    const fetchItems = () => {
        setLoading(true);
        setError(null);
        fetch('/api/items')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch items');
                return res.json();
            })
            .then((data) => {
                setItems(data);
                setLoading(false);
            })
            .catch((err) => {
                logger.error('Error fetching wardrobe items:', err);
                setError('No se pudieron cargar las prendas');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchItems();
    }, [refreshTrigger]);

    const handleItemAdded = () => {
        setRefreshTrigger((prev) => prev + 1);
        setShowAddForm(false);
    };

    const handleStarterSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
        setShowStarterModal(false);
    };

    const categories = [
        { id: 'ALL', label: 'Todos', icon: '🧥' },
        { id: 'TOP', label: 'Tops', icon: '👕' },
        { id: 'BOTTOM', label: 'Bottoms', icon: '👖' },
        { id: 'SHOES', label: 'Calzado', icon: '👟' },
        { id: 'ACCESSORY', label: 'Accesorios', icon: '👜' },
        { id: 'OUTERWEAR', label: 'Abrigos', icon: '🧥' }
    ];

    return (
        <main className={styles.container}>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes mp-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}} />
            {paymentStatus && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    width: '90%',
                    maxWidth: '400px',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    background: paymentStatus.success 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {paymentStatus.loading ? (
                            <span style={{
                                width: '18px',
                                height: '18px',
                                border: '2px solid white',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                display: 'inline-block',
                                animation: 'mp-spin 1s linear infinite'
                            }} />
                        ) : (
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                {paymentStatus.success ? '✓' : '✗'}
                            </span>
                        )}
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'center' }}>
                            {paymentStatus.message}
                        </span>
                    </div>
                    {!paymentStatus.loading && (
                        <button 
                            onClick={() => setPaymentStatus(null)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                marginTop: '4px'
                            }}
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            )}
            <header className={styles.header}>
                <h1 className={styles.title}>
                    Mi Ropero Digital
                </h1>
                <p className={styles.subtitle}>Gestiona, analiza y crea con tu estilo.</p>
            </header>

            {!loading && <WardrobeStats items={items} />}

            {/* Controls Bar */}
            <div className={styles.controlsBar}>
                {/* Filter Tabs (Desktop) */}
                <div className={`${styles.filterScroll} no-scrollbar`}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={filter === cat.id ? styles.filterButtonActive : styles.filterButton}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Mobile Dropdown Filter */}
                <div className={styles.mobileDropdownContainer}>
                    <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)} 
                        className={styles.dropdownButton}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{categories.find(c => c.id === filter)?.icon}</span>
                            <span style={{ fontWeight: 800 }}>{categories.find(c => c.id === filter)?.label}</span>
                        </span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{dropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    
                    {dropdownOpen && (
                        <>
                            <div 
                                onClick={() => setDropdownOpen(false)}
                                style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'transparent' }} 
                            />
                            <div className={`glass-premium ${styles.dropdownMenu}`}>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setFilter(cat.id);
                                            setDropdownOpen(false);
                                        }}
                                        className={`${styles.dropdownItem} ${filter === cat.id ? styles.dropdownItemActive : ''}`}
                                    >
                                        <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                        {filter === cat.id && <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.actionsGroup}>
                    <button
                        onClick={() => setShowOutfitGenerator(true)}
                        className={styles.magicButton}
                    >
                        ✨ <span>Magic Outfit</span>
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => setShowStarterModal(true)}
                        title="Auto-fill Wardrobe"
                        style={{ padding: '10px', width: '42px', height: '42px' }}
                    >
                        🪄
                    </button>
                    <button
                        className="btn-luxury"
                        onClick={() => setShowAddForm(!showAddForm)}
                        style={{ height: '42px' }}
                    >
                        {showAddForm ? 'Cancelar' : '+ Agregar'}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className={`card ${styles.addFormContainer}`} style={{ marginBottom: '32px' }}>
                    <AddItemForm onItemAdded={handleItemAdded} />
                </div>
            )}

            <WardrobeGrid
                items={items}
                loading={loading}
                error={error}
                onRefresh={fetchItems}
                filter={filter}
                onEmptyState={() => setShowStarterModal(true)}
            />

            <StarterWardrobeModal
                isOpen={showStarterModal}
                onClose={() => setShowStarterModal(false)}
                onSuccess={handleStarterSuccess}
            />

            <OutfitGeneratorModal
                isOpen={showOutfitGenerator}
                onClose={() => setShowOutfitGenerator(false)}
                items={items}
            />
        </main>
    );
}
