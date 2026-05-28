import React from 'react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
}

export default function LoadingSpinner({ size = 'medium', color = 'var(--color-primary)' }: LoadingSpinnerProps) {
    const sizeMap = {
        small: '20px',
        medium: '40px',
        large: '60px'
    };

    return (
        <div style={{
            display: 'inline-block',
            width: sizeMap[size],
            height: sizeMap[size],
            border: `3px solid rgba(0,0,0,0.1)`,
            borderTop: `3px solid ${color}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
    );
}
