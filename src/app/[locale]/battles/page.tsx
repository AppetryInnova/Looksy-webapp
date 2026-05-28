'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import BattleCard from '@/components/battles/BattleCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { logger } from '@/lib/logger';

interface Battle {
    id: string;
    title: string;
    description: string;
    theme: string;
    imageUrl: string;
    startDate: string;
    endDate: string;
    _count?: {
        entries: number;
    };
}

export default function BattlesPage() {
    const t = useTranslations('Battles');
    const [battles, setBattles] = useState<Battle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBattles = async () => {
            try {
                const res = await fetch('/api/battles');
                if (res.ok) {
                    const data = await res.json();
                    setBattles(data);
                }
            } catch (error) {
                logger.error('Error loading battles', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBattles();
    }, []);

    return (
        <main className="battles-page">
            <header className="header">
                <h1>{t('title')} 🏆</h1>
                <p className="subtitle">{t('submitLook')}</p>
            </header>

            {loading ? (
                <div className="loading-container">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="grid">
                    {battles.map((battle) => (
                        <BattleCard key={battle.id} battle={battle} />
                    ))}
                </div>
            )}

            <style jsx>{`
                .battles-page {
                    min-height: 100vh;
                    padding: 24px 20px 100px;
                    background: radial-gradient(circle at top right, rgba(var(--color-primary-rgb), 0.15), transparent 40%);
                }

                .header {
                    margin-bottom: 32px;
                }

                h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin: 0 0 8px;
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .subtitle {
                    color: var(--color-text-dim);
                    font-size: 1.1rem;
                }

                .loading-container {
                    display: flex;
                    justify-content: center;
                    padding: 60px 0;
                }

                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
            `}</style>
        </main>
    );
}
