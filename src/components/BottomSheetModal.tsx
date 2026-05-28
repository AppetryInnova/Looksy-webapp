'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    fullHeight?: boolean;
}

export default function BottomSheetModal({ isOpen, onClose, children, title, fullHeight = false }: BottomSheetModalProps) {

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998
                        }}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0.5 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: fullHeight ? '90vh' : 'auto',
                            maxHeight: '90vh',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            zIndex: 9999,
                            padding: '24px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        className="glass-premium"
                    >
                        {/* Drag Handle (Visual only) */}
                        <div style={{
                            width: '40px',
                            height: '5px',
                            background: 'rgba(150, 150, 150, 0.3)',
                            borderRadius: '10px',
                            margin: '0 auto 16px auto'
                        }} />

                        {title && (
                            <h2 className="premium-title" style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>
                                {title}
                            </h2>
                        )}

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
