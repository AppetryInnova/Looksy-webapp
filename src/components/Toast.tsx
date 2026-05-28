'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
}

let toastTimeout: NodeJS.Timeout;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
    const event = new CustomEvent('show-toast', { detail: { message, type, duration } });
    window.dispatchEvent(event);
}

export default function Toast() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'success' | 'error' | 'info'>('success');

    useEffect(() => {
        const handleToast = (e: Event) => {
            const customEvent = e as CustomEvent<ToastProps>;
            const { message, type = 'success', duration = 3000 } = customEvent.detail;

            setMessage(message);
            setType(type);
            setVisible(true);

            if (toastTimeout) clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                setVisible(false);
            }, duration);
        };

        window.addEventListener('show-toast', handleToast);
        return () => window.removeEventListener('show-toast', handleToast);
    }, []);

    if (!visible) return null;

    return (
        <div className={`toast ${type}`} style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            animation: 'slideUp 0.3s ease-out',
            fontWeight: 600,
            fontSize: '0.95rem'
        }}>
            {message}
        </div>
    );
}
