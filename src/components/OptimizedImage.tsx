'use client';

import Image from 'next/image';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    priority?: boolean;
    onLoad?: () => void;
}

export default function OptimizedImage({
    src,
    alt,
    className,
    style,
    priority = false,
    onLoad
}: OptimizedImageProps) {
    // If src is empty or invalid, fallback to a placeholder to prevent Next/Image errors
    let validSrc = src && (src.startsWith('http') || src.startsWith('/'))
        ? src
        : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800';

    // Next.js 15+ Image component throws an error if local images have query strings 
    // without specific localPatterns configuration. We strip them here for safety.
    if (validSrc.startsWith('/') && validSrc.includes('?')) {
        validSrc = validSrc.split('?')[0];
    }

    return (
        <div
            style={{
                position: 'relative',
                overflow: 'hidden',
                ...style
            }}
            className={className}
        >
            <Image
                src={validSrc}
                alt={alt}
                fill
                priority={priority}
                onLoad={onLoad}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{
                    objectFit: 'cover',
                }}
            />
        </div>
    );
}
