'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGoogle, FaFacebook, FaUserSecret } from 'react-icons/fa';
import { useRouter } from '@/i18n/routing';
import styles from './welcome.module.css';

export default function WelcomePage() {
    const t = useTranslations('WelcomePage');
    const router = useRouter();
    const [view, setView] = useState<'login' | 'signup'>('login');

    const loginProviders = [
        {
            id: 'google',
            name: t('google'),
            icon: <FaGoogle />,
            style: styles.googleButton,
            action: () => signIn('google', { callbackUrl: '/' })
        },
        {
            id: 'facebook',
            name: t('facebook'),
            icon: <FaFacebook />,
            style: styles.facebookButton,
            action: () => signIn('facebook', { callbackUrl: '/' })
        },
        {
            id: 'guest',
            name: t('guest'),
            icon: <FaUserSecret />,
            style: styles.guestButton,
            action: () => router.push('/')
        }
    ];

    return (
        <div className={styles.welcomeContainer}>
            <Image
                src="/fashion_landing_premium_v2.png" // Using the new fashion background
                alt="Looksy Background"
                fill
                className={styles.backgroundImage}
                priority
            />
            <div className={styles.backgroundOverlay} />

            <div className={styles.content}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={styles.logoContainer}
                >
                    <div className={styles.mirrorLogo}>
                        <Image src="/icon-192x192.png" alt="Looksy Logo" width={120} height={120} className={styles.brandIcon} />
                    </div>
                    <h1 className={styles.logo}>LOOKSY</h1>
                    <p className={styles.subtitle}>{t('tagline')}</p>
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        className={styles.authWrapper}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className={styles.viewTitle}>
                            {view === 'login' ? t('login') : t('signup')}
                        </h2>

                        <div className={styles.authOptions}>
                            {loginProviders.map((provider, index) => (
                                <motion.button
                                    key={provider.id}
                                    className={`${styles.authButton} ${provider.style}`}
                                    onClick={provider.action}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{provider.icon}</span>
                                    <span>{provider.name}</span>
                                </motion.button>
                            ))}
                        </div>

                        <div className={styles.toggleView}>
                            <p>
                                {view === 'login' ? t('noAccount') : t('alreadyHaveAccount')}{' '}
                                <button
                                    onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                                    className={styles.toggleLink}
                                >
                                    {view === 'login' ? t('signup') : t('login')}
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <motion.div
                    className={styles.footer}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 1.2 }}
                >
                    <p>{t('terms')}</p>
                </motion.div>
            </div>
        </div>
    );
}
