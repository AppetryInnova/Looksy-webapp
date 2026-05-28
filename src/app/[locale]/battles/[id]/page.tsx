'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { showToast } from '@/components/Toast';
import logger from '@/lib/logger';

export default function BattleArenaPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Battles');
    
    // We expect params.id and params.locale
    const battleId = params?.id as string;
    
    const [battle, setBattle] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!battleId) return;
        const fetchBattle = async () => {
            try {
                const res = await fetch(`/api/battles/${battleId}`);
                if (!res.ok) throw new Error('Battle not found');
                const data = await res.json();
                setBattle(data);
                // Randomize entries for fair voting, or keep them sorted. Let's shuffle.
                const shuffled = [...(data.entries || [])].sort(() => Math.random() - 0.5);
                setEntries(shuffled);
            } catch (err) {
                logger.error('Error fetching battle arena', err);
                showToast("Error cargando la batalla", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchBattle();
    }, [battleId]);

    const handleVote = async (entryId: string, direction: 'left' | 'right') => {
        if (direction === 'right') {
            // Vote YES
            try {
                const res = await fetch(`/api/battles/${battleId}/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entryId })
                });
                if (res.ok) {
                    showToast("¡Voto registrado!", "success");
                } else {
                    const errorData = await res.json();
                    if (errorData.error === 'Already voted for this entry') {
                        showToast("Ya votaste por este outfit", "error");
                    } else if (errorData.error === 'Unauthorized') {
                        showToast("Inicia sesión para votar", "error");
                    }
                }
            } catch (error) {
                 logger.error(error);
            }
        }
        
        // Move to next card
        setCurrentIndex(prev => prev + 1);
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>;
    if (!battle) return <div style={{ textAlign: 'center', paddingTop: '100px' }}>Batalla no encontrada</div>;

    const isFinished = currentIndex >= entries.length;

    return (
        <main className="arena-page">
            <header className="header">
                <button onClick={() => router.back()} className="back-btn">← Volver</button>
                <div className="title-wrapper">
                    <span className="badge">ARENA ACTIVA</span>
                    <h1>{battle.title}</h1>
                </div>
            </header>

            <div className="card-container">
                <AnimatePresence>
                    {!isFinished ? (
                        <motion.div
                            key={entries[currentIndex].id}
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.05, opacity: 0, x: -200 }}
                            transition={{ duration: 0.3 }}
                            className="swipe-card"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) * velocity.x;
                                if (swipe < -10000) handleVote(entries[currentIndex].id, 'left');
                                else if (swipe > 10000) handleVote(entries[currentIndex].id, 'right');
                            }}
                        >
                            <img src={entries[currentIndex].scan.photoUrl} alt="Outfit" className="outfit-img" />
                            <div className="card-overlay">
                                <div className="user-info">
                                    <img src={entries[currentIndex].user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entries[currentIndex].user.username}`} alt="avatar" />
                                    <span>@{entries[currentIndex].user.username}</span>
                                </div>
                                <div className="harmony-score">✨ {entries[currentIndex].scan.harmonyScore} PTS</div>
                            </div>
                            
                            <div className="controls">
                                <button className="control-btn no" onClick={() => handleVote(entries[currentIndex].id, 'left')}>✕</button>
                                <button className="control-btn yes" onClick={() => handleVote(entries[currentIndex].id, 'right')}>🔥</button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="finished-state">
                            <span style={{ fontSize: '4rem' }}>🏆</span>
                            <h2>Has evaluado todos los outfits</h2>
                            <p>Vuelve más tarde para ver nuevos retadores.</p>
                            <button className="btn-primary" onClick={() => router.push(`/${params.locale || 'es'}/battles`)}>Explorar más batallas</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .arena-page {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #000;
                    color: white;
                    overflow: hidden;
                }
                .header {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    z-index: 10;
                }
                .back-btn {
                    position: absolute;
                    left: 24px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                }
                .title-wrapper {
                    text-align: center;
                }
                .badge {
                    background: var(--color-primary);
                    color: white;
                    font-size: 0.7rem;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-weight: bold;
                }
                h1 {
                    font-size: 1.5rem;
                    margin: 8px 0 0;
                }
                .card-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    position: relative;
                }
                .swipe-card {
                    width: 100%;
                    max-width: 400px;
                    height: 60vh;
                    min-height: 500px;
                    position: absolute;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    background: #111;
                    touch-action: none;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .outfit-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .card-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 40px 20px 100px;
                    background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    pointer-events: none;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .user-info img {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: 2px solid white;
                }
                .user-info span {
                    font-weight: bold;
                    font-size: 1.1rem;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .harmony-score {
                    background: rgba(16, 185, 129, 0.2);
                    border: 1px solid #10b981;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: bold;
                    color: #10b981;
                }
                .controls {
                    position: absolute;
                    bottom: 24px;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: center;
                    gap: 24px;
                }
                .control-btn {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    border: none;
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    transition: transform 0.2s;
                }
                .control-btn:active {
                    transform: scale(0.9);
                }
                .no {
                    background: #222;
                    color: #ff4b4b;
                    border: 2px solid #ff4b4b;
                }
                .yes {
                    background: #10b981;
                    color: white;
                }
                .finished-state {
                    text-align: center;
                    padding: 40px;
                }
            `}</style>
        </main>
    );
}
