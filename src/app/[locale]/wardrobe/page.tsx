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
    const t = useTranslations('WardrobePage');

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
            <header className={styles.header}>
                <h1 className={styles.title}>
                    Mi Ropero Digital
                </h1>
                <p className={styles.subtitle}>Gestiona, analiza y crea con tu estilo.</p>
            </header>

            {!loading && <WardrobeStats items={items} />}

            {/* Controls Bar */}
            <div className={styles.controlsBar}>
                {/* Filter Tabs */}
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
