'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development, could send to error tracking service in production
        logger.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--color-background)',
                    color: 'var(--color-text)'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        background: 'var(--color-surface)',
                        padding: '2rem',
                        borderRadius: 'var(--radius-card)',
                        boxShadow: 'var(--shadow-glow)'
                    }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>
                            ⚠️ Oops!
                        </h1>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-dim)' }}>
                            Something went wrong. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                            style={{ marginTop: '1rem' }}
                        >
                            Refresh Page
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    Error Details
                                </summary>
                                <pre style={{
                                    fontSize: '0.75rem',
                                    background: '#1e1e1e',
                                    color: '#d4d4d4',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    overflow: 'auto',
                                    maxHeight: '200px'
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
