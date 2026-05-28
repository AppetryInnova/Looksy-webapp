'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/routing';
import SocialFeedImmersive from '@/components/SocialFeedImmersive';
import { PostSkeleton } from '@/components/ui/Skeleton';

export default function Home() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/welcome');
        }
    }, [status, router]);

    // Show skeleton during auth check instead of blank screen
    if (status === 'loading') {
        return (
            <div style={{ width: '100%', height: '100dvh', background: '#000', overflow: 'hidden' }}>
                <PostSkeleton />
            </div>
        );
    }

    // Redirecting
    if (status === 'unauthenticated') return null;

    return (
        <div style={{ width: '100%', height: '100dvh', overflow: 'hidden' }}>
            <SocialFeedImmersive feedType="global" />
        </div>
    );
}
