import React from 'react';

interface StoryCircleProps {
    imageUrl?: string;
    username: string;
    hasGradient?: boolean;
    size?: 'small' | 'medium' | 'large';
    onClick?: () => void;
}

export default function StoryCircle({
    imageUrl,
    username,
    hasGradient = true,
    size = 'medium',
    onClick
}: StoryCircleProps) {
    const sizeMap = {
        small: '48px',
        medium: '64px',
        large: '80px'
    };

    const innerSizeMap = {
        small: '44px',
        medium: '60px',
        large: '76px'
    };

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: onClick ? 'pointer' : 'default'
            }}
        >
            <div style={{
                width: sizeMap[size],
                height: sizeMap[size],
                borderRadius: '50%',
                background: hasGradient ? 'var(--gradient-primary)' : 'var(--color-border)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: innerSizeMap[size],
                    height: innerSizeMap[size],
                    borderRadius: '50%',
                    background: 'var(--color-background)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={username}
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: size === 'small' ? '1rem' : size === 'medium' ? '1.25rem' : '1.5rem'
                        }}>
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
            <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                maxWidth: sizeMap[size],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center'
            }}>
                {username}
            </span>
        </div>
    );
}
