'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

// Si no hay key válida de PostHog en el entorno local, desactivamos las analíticas para no lanzar alertas.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
                person_profiles: 'identified_only',
                loaded: (posthog) => {
                    if (process.env.NODE_ENV === 'development') posthog.debug(false);
                }
            });
        }
    }, []);

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
