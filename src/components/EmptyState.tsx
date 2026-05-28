import React from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999'
        }}>
            <div style={{
                fontSize: '4rem',
                marginBottom: '16px',
                opacity: 0.6
            }}>
                {icon}
            </div>
            <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--color-text)'
            }}>
                {title}
            </h3>
            {description && (
                <p style={{
                    fontSize: '0.95rem',
                    marginBottom: '24px',
                    maxWidth: '400px',
                    margin: '0 auto 24px'
                }}>
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="btn-primary"
                    style={{ marginTop: '16px' }}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
