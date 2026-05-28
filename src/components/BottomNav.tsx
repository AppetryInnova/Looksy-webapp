'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import styles from './BottomNav.module.css';

export default function BottomNav() {
    const pathname = usePathname();
    const t = useTranslations('BottomNav');

    const navItems = [
        {
            path: '/',
            label: t('feed'),
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            )
        },
        {
            path: '/wardrobe',
            label: t('wardrobe'),
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.38 3.4a2 2 0 0 0-2 0l-2.45 1.22a2 2 0 0 1-1.86 0L11.62 3.4a2 2 0 0 0-2 0l-2.45 1.22a2 2 0 0 1-1.86 0L2.86 3.4a2 2 0 0 0-2 0V19a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V3.4a2 2 0 0 0-2 0z"></path>
                    <line x1="12" y1="10" x2="12" y2="21"></line>
                </svg>
            )
        },
        {
            path: '/events',
            label: t('lobby'),
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            )
        },
        {
            path: '/battles',
            label: t('battles'),
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path>
                    <path d="M13 19l6-6"></path>
                    <path d="M16 16l4 4"></path>
                    <path d="M19 21L21 19"></path>
                    <path d="M14.5 6.5L16 8"></path>
                </svg>
            )
        },
        {
            path: '/profile',
            label: t('profile'),
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            )
        },
    ];

    return (
        <nav className={styles.bottomNav}>
            {navItems.map((item, index) => {
                const isActive = pathname === item.path;

                // Scanner FAB in the middle
                if (index === 2) {
                    return (
                        <React.Fragment key="scanner-fab">
                            <div className={styles.fabContainer}>
                                <Link href="/scanner">
                                    <button className={styles.fab} aria-label="Scan Outfit">
                                        <span className={styles.fabIcon}>📷</span>
                                    </button>
                                </Link>
                            </div>

                            <Link href={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                                <span className={styles.navIcon}>
                                    {item.icon && React.cloneElement(item.icon, {
                                        stroke: isActive ? "var(--color-primary)" : "currentColor",
                                        strokeWidth: isActive ? 2.5 : 2
                                    })}
                                </span>
                                <span className={styles.navLabel}>{item.label}</span>
                                <span className={styles.activeIndicator} />
                            </Link>
                        </React.Fragment>
                    );
                }

                return (
                    <Link key={item.path} href={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <span className={styles.navIcon}>
                            {item.icon && React.cloneElement(item.icon, {
                                stroke: isActive ? "var(--color-primary)" : "currentColor",
                                strokeWidth: isActive ? 2.5 : 2
                            })}
                        </span>
                        <span className={styles.navLabel}>{item.label}</span>
                        <span className={styles.activeIndicator} />
                    </Link>
                );
            })}
        </nav>
    );
}
