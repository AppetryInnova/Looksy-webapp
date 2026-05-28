'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const languages = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' }
];

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const switchLanguage = (newLocale: string) => {
        if (newLocale === locale) {
            setIsOpen(false);
            return;
        }

        // Get the current path without the locale prefix
        const segments = pathname.split('/').filter(Boolean);
        const pathWithoutLocale = segments.length > 0 && ['es', 'en', 'pt'].includes(segments[0])
            ? '/' + segments.slice(1).join('/')
            : pathname;

        // Navigate to the new locale
        router.push(`/${newLocale}${pathWithoutLocale || ''}`);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Change language"
                style={{
                    height: '48px',
                    padding: '0 16px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all var(--transition-base)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--color-text)'
                }}
            >
                <span style={{ fontSize: '1.25rem' }}>{currentLanguage.flag}</span>
                <span>{currentLanguage.code.toUpperCase()}</span>
                <span style={{
                    fontSize: '0.75rem',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform var(--transition-fast)'
                }}>
                    ▼
                </span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '60px',
                    right: 0,
                    background: 'var(--color-surface-elevated)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    minWidth: '160px',
                    zIndex: 9999,
                    animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => switchLanguage(lang.code)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                background: locale === lang.code ? 'var(--color-surface)' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'background var(--transition-fast)',
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text)',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                                if (locale !== lang.code) {
                                    e.currentTarget.style.background = 'var(--color-surface)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (locale !== lang.code) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{lang.flag}</span>
                            <span style={{ flex: 1 }}>{lang.label}</span>
                            {locale === lang.code && (
                                <span style={{ color: 'var(--color-primary-light)', fontSize: '1rem' }}>✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
