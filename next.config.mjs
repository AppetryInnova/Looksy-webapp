import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development', // No molestar en local
    register: true,
    skipWaiting: true,
});

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'api.dicebear.com' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'plus.unsplash.com' },
            { protocol: 'https', hostname: 'source.unsplash.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'maps.googleapis.com' },
            { protocol: 'https', hostname: 'hnxpercbdncbzhldvzkm.supabase.co' }
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 3600, // 1 hour image cache
    },

    // Optimize large package imports (critical for bundle size)
    experimental: {
        optimizePackageImports: [
            'react-icons',
            'framer-motion',
            'lucide-react',
        ],
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' }
                ],
            },
            // Aggressive cache for static assets
            {
                source: '/_next/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
                ]
            },
            // Cache API responses that rarely change
            {
                source: '/api/campaigns',
                headers: [
                    { key: 'Cache-Control', value: 's-maxage=300, stale-while-revalidate=600' }
                ]
            }
        ];
    },

    compress: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
};

export default withSentryConfig(withPWA(withNextIntl(nextConfig)), {
    silent: true,
    org: "appetryinnova",
    project: "looksy-gravity",
}, {
    widenClientFileUpload: true,
    transpileClientSDK: false,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
});
