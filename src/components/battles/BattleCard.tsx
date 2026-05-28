'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

interface BattleCardProps {
    battle: Battle;
}

export default function BattleCard({ battle }: BattleCardProps) {
    const t = useTranslations('Battles');
    const pathname = usePathname();
    // Assuming locale is the first segment, e.g. /es/battles -> /es
    const locale = pathname.split('/')[1] || 'es';

    const getDaysLeft = () => {
        const end = new Date(battle.endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return Math.max(0, days);
    };

    const daysLeft = getDaysLeft();

    return (
        <div className="battle-card">
            <div className="image-container">
                <img src={battle.imageUrl} alt={battle.title} className="cover-image" />
                <div className="badge-theme">{battle.theme}</div>
            </div>

            <div className="content">
                <h3 className="title">{battle.title}</h3>
                <p className="description">{battle.description}</p>

                <div className="stats">
                    <div className="stat">
                        <span className="icon">⏳</span>
                        <span>{daysLeft}d</span>
                    </div>
                    <div className="stat">
                        <span className="icon">⚔️</span>
                        <span>{battle._count?.entries || 0}</span>
                    </div>
                </div>

                <Link href={`/${locale}/battles/${battle.id}`} className="cta-button">
                    {t('joinTheBattle')}
                </Link>
            </div>

            <style jsx>{`
                .battle-card {
                    background: rgba(var(--color-surface-rgb), 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    transition: transform 0.3s ease;
                }

                .battle-card:hover {
                    transform: translateY(-4px);
                }

                .image-container {
                    position: relative;
                    height: 180px;
                }

                .cover-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .badge-theme {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    color: var(--color-primary);
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    border: 1px solid var(--color-primary);
                }

                .content {
                    padding: 20px;
                }

                .title {
                    margin: 0 0 8px;
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .description {
                    font-size: 0.9rem;
                    color: var(--color-text-dim);
                    margin: 0 0 16px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .stat {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .cta-button {
                    display: block;
                    width: 100%;
                    padding: 12px;
                    background: var(--gradient-primary);
                    color: white;
                    text-align: center;
                    border-radius: 16px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: opacity 0.2s;
                    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.4);
                }

                .cta-button:hover {
                    opacity: 0.9;
                }
            `}</style>
        </div>
    );
}
