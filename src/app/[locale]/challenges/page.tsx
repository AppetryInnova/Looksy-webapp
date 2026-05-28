'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ChallengeDetailModal from '@/components/ChallengeDetailModal';
import { logger } from '@/lib/logger';
import styles from './challenges.module.css';

type Challenge = {
    id: string | number;
    title: string;
    description: string;
    participants: string;
    timeLeft: string;
    xp: number;
    badgeName: string;
    image: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: 'Trending' | 'ForYou' | 'Hard' | 'New';
    rules: string[];
    gradient: string;
};

const FALLBACK_CHALLENGES: Challenge[] = [
    {
        id: 1,
        title: 'Y2K Revival',
        description: 'Trae de vuelta la estética de los 2000s. Piensa en pantalones cargo, crop tops brillantes y muchas mariposas. ¡El mejor look retro gana!',
        participants: '2.8K',
        timeLeft: '2d 14h',
        xp: 500,
        badgeName: 'Y2K Queen',
        image: 'https://images.unsplash.com/photo-1616790903348-18e0018d451a?w=800&q=80',
        difficulty: 'Easy',
        category: 'Trending',
        gradient: 'bg-gradient-pink',
        rules: ['Usa al menos 2 elementos Y2K', 'Foto cuerpo completo', 'Iluminación natural']
    },
    {
        id: 2,
        title: 'Eco-Chic',
        description: 'Demuestra que la moda sostenible es el futuro. Crea un outfit usando solo prendas thrifted, vintage o de marcas éticas.',
        participants: '1.5K',
        timeLeft: '5d 02h',
        xp: 800,
        badgeName: 'Eco Warrior',
        image: 'https://images.unsplash.com/photo-1542060748-10c28b62716f?w=800&q=80',
        difficulty: 'Medium',
        category: 'New',
        gradient: 'bg-gradient-emerald',
        rules: ['Outfit 100% sostenible', 'Menciona las marcas', 'Estilo minimalista']
    },
    {
        id: 3,
        title: 'Glow Up Night',
        description: 'Look de noche impactante. Maquillaje bold, vestido statement o traje sastre. ¡Queremos ver tu mejor versión nocturna!',
        participants: '3.4K',
        timeLeft: '12h 30m',
        xp: 1200,
        badgeName: 'Night Star',
        image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=800&q=80',
        difficulty: 'Hard',
        category: 'Trending',
        gradient: 'bg-gradient-purple',
        rules: ['Maquillaje elaborado', 'Dress code: Cocktail/Gala', 'Foto con flash permitida']
    }
];

export default function ChallengesPage() {
    const { data: session } = useSession();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/challenges')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const enhancedData = data.map((c, i) => ({
                        ...c,
                        image: c.image || 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&q=80', // Fallback
                        gradient: i % 2 === 0 ? 'bg-gradient-purple' : 'bg-gradient-emerald',
                        participants: 'New', // Default for new gen
                        timeLeft: '7d', // Default
                        rules: typeof c.rules === 'string' ? JSON.parse(c.rules) : c.rules
                    }));
                    setChallenges(enhancedData);
                } else {
                    setChallenges(FALLBACK_CHALLENGES);
                }
                setLoading(false);
            })
            .catch(err => {
                logger.error("Failed to fetch challenges, using fallback", err);
                setChallenges(FALLBACK_CHALLENGES);
                setLoading(false);
            });
    }, []);

    const filteredChallenges = filter === 'ALL'
        ? challenges
        : challenges.filter(c => c.category && (
            c.category.toUpperCase() === filter ||
            (filter === 'TRENDING' && c.category === 'Trending') ||
            (filter === 'NEW' && c.category === 'New')
        ));

    const heroChallenge = challenges.length > 0 ? challenges[0] : null;

    if (loading) {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <div className="spinner" style={{ width: '48px', height: '48px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', marginBottom: '16px', display: 'inline-block' }}></div>
                <p style={{ opacity: 0.6, fontWeight: 600 }}>Cargando Challenges...</p>
            </div>
        );
    }

    return (
        <main className={styles.container}>

            {/* Header Area */}
            <header className={styles.headerArea}>
                <div>
                    <h1 className={styles.title}>Challenges 🏆</h1>
                    <p className={styles.subtitle}>Compite, inspira y gana recompensas exclusivas.</p>
                </div>
                <div className={styles.pointsBadge}>
                    <span>✨</span> Tus Puntos: {session?.user?.name ? '1,500' : '0'}
                </div>
            </header>

            {/* Hero Section */}
            {heroChallenge && (
                <section
                    className={styles.heroCard}
                    onClick={() => setSelectedChallenge(heroChallenge)}
                >
                    <div className={styles.heroImage} style={{ backgroundImage: `url(${heroChallenge.image})` }}></div>
                    <div className={styles.heroOverlay}></div>

                    <div className={styles.heroContent}>
                        <div className={styles.badgeRow}>
                            <span className={`${styles.heroBadge} ${styles.badgeViral}`}>VIRAL 🔥</span>
                            <span className={`${styles.heroBadge} ${styles.badgeTime}`}>TERMINA PRONTO</span>
                        </div>
                        <h2 className={styles.heroTitle}>{heroChallenge.title}</h2>
                        <p className={styles.heroDesc}>{heroChallenge.description}</p>
                        <button className="btn-luxury" style={{ padding: '14px 32px' }}>
                            Unirse al Reto
                        </button>
                    </div>

                    <div className={styles.heroTimeLabel}>
                        <div className={styles.timeBig}>{heroChallenge.timeLeft}</div>
                        <div className={styles.timeSub}>TIEMPO RESTANTE</div>
                    </div>
                </section>
            )}

            {/* Filter Bar */}
            <nav className={styles.controlsBar}>
                <div className={styles.filterScroll}>
                    {[
                        { id: 'ALL', label: 'Todos', icon: '💎' },
                        { id: 'TRENDING', label: 'Tendencias', icon: '🔥' },
                        { id: 'NEW', label: 'Nuevos', icon: '✨' },
                        { id: 'FORYOU', label: 'Para Ti', icon: '👤' },
                        { id: 'HARD', label: 'Difícil', icon: '⚡' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={filter === f.id ? styles.filterButtonActive : styles.filterButton}
                        >
                            <span>{f.icon}</span> {f.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Grid */}
            <div className={styles.challengeGrid}>
                {filteredChallenges.length > 0 ? (
                    filteredChallenges.map(challenge => (
                        <div
                            key={challenge.id}
                            className={styles.challengeCard}
                            onClick={() => setSelectedChallenge(challenge)}
                        >
                            <div className={styles.cardImageArea}>
                                <img src={challenge.image} alt={challenge.title} className={styles.cardImage} />
                                <div className={styles.xpBadge}>+{challenge.xp} XP</div>
                            </div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardTopRow}>
                                    <h3 className={styles.cardTitle}>{challenge.title}</h3>
                                    <span className={`${styles.difficultyTag} ${challenge.difficulty === 'Hard' ? styles.diffHard : challenge.difficulty === 'Medium' ? styles.diffMedium : styles.diffEasy}`}>
                                        {challenge.difficulty}
                                    </span>
                                </div>
                                <p className={styles.cardDesc}>{challenge.description}</p>

                                <div className={styles.cardStats}>
                                    <div className={styles.statItem}>
                                        <span>👥</span> {challenge.participants}
                                    </div>
                                    <div className={styles.statItem}>
                                        <span>⏰</span> {challenge.timeLeft}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 text-gray-500">
                        No se encontraron retos en esta categoría.
                    </div>
                )}
            </div>

            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={!!selectedChallenge}
                onClose={() => setSelectedChallenge(null)}
            />

        </main>
    );
}
