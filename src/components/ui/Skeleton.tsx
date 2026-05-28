import React from 'react';

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
}

export function Skeleton({ className = '', style, width, height, borderRadius }: SkeletonProps) {
    return (
        <div 
            className={`skeleton ${className}`}
            style={{
                width: width || '100%',
                height: height || '100%',
                borderRadius: borderRadius || 'var(--radius-card)',
                ...style
            }}
        />
    );
}

export function PostSkeleton() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: '90px' }}>
            <Skeleton height="100%" borderRadius="20px" />
            <div style={{ position: 'absolute', bottom: '120px', left: '20px', width: 'calc(100% - 40px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Skeleton width="48px" height="48px" borderRadius="24px" />
                    <Skeleton width="150px" height="24px" borderRadius="12px" />
                </div>
                <Skeleton width="80%" height="20px" borderRadius="10px" style={{ marginBottom: '8px' }} />
                <Skeleton width="60%" height="20px" borderRadius="10px" />
            </div>
            {/* Interactive sidebar skeleton */}
            <div style={{ position: 'absolute', bottom: '150px', right: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Skeleton width="45px" height="45px" borderRadius="50%" />
                <Skeleton width="45px" height="45px" borderRadius="50%" />
                <Skeleton width="45px" height="45px" borderRadius="50%" />
            </div>
        </div>
    );
}
