'use client';

import React, { useState } from 'react';
import { usePathname } from '@/i18n/routing';
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import BottomNav from "@/components/BottomNav";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isWelcomePage = pathname === '/welcome' || pathname.includes('/welcome');

    if (isWelcomePage) {
        return (
            <div className="main-content" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <main style={{ flex: 1 }}>
                    {children}
                </main>
            </div>
        );
    }

    // pathname from usePathname (next-intl routing) strips the locale prefix already
    const isHomePage = pathname === '/';

    return (
        <div className="flex-container" style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            {/* Mobile Backdrop Overlay */}
            {isMenuOpen && (
                <div 
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1150,
                        transition: 'opacity 0.3s ease'
                    }}
                />
            )}

            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            
            <div className={`main-content-with-sidebar ${!isHomePage ? 'has-bottom-nav' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {!isHomePage && <TopHeader onMenuToggle={() => setIsMenuOpen(true)} />}
                <main style={{ flex: 1, position: 'relative' }}>
                    {children}
                </main>
            </div>
            
            <div style={{
                position: isHomePage ? 'absolute' : 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                pointerEvents: 'none',
                background: isHomePage ? 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' : 'transparent'
            }}>
                <div style={{ pointerEvents: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <BottomNav />
                </div>
            </div>
        </div>
    );
}
