'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import CheckoutModal from '@/components/CheckoutModal';
import styles from './subscription.module.css';

export default function SubscriptionPage() {
    const [currentPlan, setCurrentPlan] = useState('FREE');
    const [loading, setLoading] = useState(false);
    const [monetizationPhase, setMonetizationPhase] = useState<'FREE' | 'SOFT' | 'FULL'>('FREE');
    const [isEarlyAdopter, setIsEarlyAdopter] = useState(false);
    const [checkoutPlan, setCheckoutPlan] = useState<{ id: string; price: string } | null>(null);
    const router = useRouter();
    const t = useTranslations('SubscriptionPage');

    useEffect(() => {
        fetch('/api/subscription')
            .then(res => res.json())
            .then(data => {
                if (data.plan) setCurrentPlan(data.plan);
                if (data.monetizationPhase) setMonetizationPhase(data.monetizationPhase);
                if (data.isEarlyAdopter !== undefined) setIsEarlyAdopter(data.isEarlyAdopter);
            });
    }, []);

    const handleSubscribe = async (plan: string, price: string) => {
        if (monetizationPhase === 'FREE' && plan === 'ELITE') return;
        if (currentPlan === plan) return;
        // Open checkout modal instead of direct POST
        setCheckoutPlan({ id: plan, price });
    };

    const handleCheckoutSuccess = (plan: string) => {
        setCurrentPlan(plan);
        setCheckoutPlan(null);
        router.refresh();
    };

    const plansArr = [
        {
            id: 'FREE',
            name: t('plans.free.name'),
            price: t('plans.free.price'),
            features: monetizationPhase === 'FREE'
                ? [t('plans.free.features.unlimitedScans'), t('plans.free.features.unlimitedBeauty'), t('plans.free.features.community'), t('plans.free.features.allFree')]
                : [t('plans.free.features.limitedScans'), t('plans.free.features.limitedBeauty'), t('plans.free.features.basicCommunity')],
            color: 'var(--color-text-dim)'
        },
        {
            id: 'ELITE',
            name: t('plans.elite.name'),
            price: isEarlyAdopter ? t('plans.elite.pricePromo') : t('plans.elite.price'),
            originalPrice: isEarlyAdopter ? t('plans.elite.price') : undefined,
            features: [t('plans.elite.features.unlimitedScans'), t('plans.elite.features.unlimitedBeauty'), t('plans.elite.features.celebrity'), t('plans.elite.features.badge'), t('plans.elite.features.earlyAccess')],
            color: '#10b981',
            popular: true
        }
    ];

    return (
        <main className={styles.container}>
            {/* Early Access Banner for FREE phase */}
            {monetizationPhase === 'FREE' && (
                <div className="card glass-premium" style={{
                    marginBottom: '2rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
                    borderColor: '#10b981'
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {t('earlyAccessTitle')}
                    </h2>
                    <p style={{ color: 'var(--color-text-dim)', marginBottom: '1rem' }} dangerouslySetInnerHTML={{ __html: t.raw('earlyAccessDesc') }}>
                    </p>
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(16, 185, 129, 0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                    }}>
                        {t('earlyAdopterPromo')}
                    </div>
                </div>
            )}

            {/* Early Adopter Badge for users who joined early */}
            {isEarlyAdopter && monetizationPhase !== 'FREE' && (
                <div className="card glass-premium" style={{
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, rgba(168, 139, 250, 0.2), rgba(124, 58, 237, 0.2))',
                    borderColor: '#a78bfa'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                        <span style={{ fontSize: '2rem' }}>🌟</span>
                        <div>
                            <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{t('earlyAdopterTitle')}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-dim)' }}>
                                {t('earlyAdopterDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <h1 className={styles.title}>
                    {monetizationPhase === 'FREE' ? t('titlePreview') : t('title')}
                </h1>
                <p className={styles.subtitle}>
                    {monetizationPhase === 'FREE'
                        ? t('subtitlePreview')
                        : t('subtitle')}
                </p>
            </div>

            <div className={styles.grid}>
                {plansArr.map((plan) => (
                    <div key={plan.id} className={`${styles.card} ${currentPlan === plan.id ? 'active-plan' : ''}`} style={{
                        border: currentPlan === plan.id ? `2px solid ${plan.color}` : 'var(--glass-border)',
                        transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                        zIndex: plan.popular ? 10 : 1
                    }}>
                        {plan.popular && (
                            <div className={styles.popularBadge}>
                                {isEarlyAdopter ? t('badges.discount') : t('badges.popular')}
                            </div>
                        )}

                        <h3 className={styles.planName}>{plan.name}</h3>
                        <div className={styles.planPrice} style={{ color: plan.color }}>
                            {plan.price}
                            {plan.originalPrice && (
                                <span style={{
                                    fontSize: '1rem',
                                    textDecoration: 'line-through',
                                    color: 'var(--color-text-dim)',
                                    marginLeft: '0.5rem'
                                }}>
                                    {plan.originalPrice}
                                </span>
                            )}
                        </div>

                        <ul className={styles.featuresList}>
                            {plan.features.map((feature, i) => (
                                <li key={i} className={styles.featureItem}>
                                    <span style={{ color: plan.color }}>✓</span> {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(plan.id, plan.price)}
                            disabled={loading || currentPlan === plan.id || (monetizationPhase === 'FREE' && plan.id === 'ELITE')}
                            className={styles.subscribeButton}
                            style={{
                                background: currentPlan === plan.id ? 'rgba(255,255,255,0.1)' : (plan.id === 'FREE' ? 'rgba(255,255,255,0.1)' : 'var(--gradient-primary)'),
                                color: 'white',
                                cursor: loading || currentPlan === plan.id || (monetizationPhase === 'FREE' && plan.id === 'ELITE') ? 'default' : 'pointer',
                                opacity: loading || (monetizationPhase === 'FREE' && plan.id === 'ELITE') ? 0.7 : 1
                            }}
                        >
                            {currentPlan === plan.id
                                ? t('actions.current')
                                : loading
                                    ? t('actions.processing')
                                    : monetizationPhase === 'FREE' && plan.id === 'ELITE'
                                        ? t('actions.available')
                                        : t('actions.subscribe')}
                        </button>
                    </div>
                ))}
            </div>

            {/* Checkout Modal */}
            {checkoutPlan && (
                <CheckoutModal
                    plan={checkoutPlan.id as 'ELITE' | 'PRO'}
                    price={checkoutPlan.price}
                    onClose={() => setCheckoutPlan(null)}
                    onSuccess={handleCheckoutSuccess}
                />
            )}
        </main>
    );
}
