'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle Dark Mode"
            style={{
                background: 'var(--color-surface)',
                border: 'var(--glass-border)',
                backdropFilter: 'blur(10px)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: 'var(--shadow-glow)',
                position: 'relative',
                overflow: 'hidden'
            }}
            className="theme-toggle"
        >
            <div style={{
                fontSize: '1.5rem',
                transform: theme === 'dark' ? 'rotate(360deg)' : 'rotate(0deg)',
                transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {theme === 'dark' ? '🌙' : '☀️'}
            </div>

            <style jsx>{`
                .theme-toggle:hover {
                    transform: scale(1.1);
                    background: var(--color-surface-hover);
                }
                .theme-toggle:active {
                    transform: scale(0.95);
                }
            `}</style>
        </button>
    );
}
