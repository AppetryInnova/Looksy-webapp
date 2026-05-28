import React from 'react';

interface ErrorMessageProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

export default function ErrorMessage({ title = 'Oops!', message, onRetry }: ErrorMessageProps) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
            <div style={{
                fontSize: '3rem',
                marginBottom: '16px'
            }}>
                ⚠️
            </div>
            <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--color-alert)'
            }}>
                {title}
            </h3>
            <p style={{
                fontSize: '0.95rem',
                color: '#666',
                marginBottom: onRetry ? '20px' : '0'
            }}>
                {message}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="btn-secondary"
                    style={{ marginTop: '16px' }}
                >
                    Reintentar
                </button>
            )}
        </div>
    );
}
