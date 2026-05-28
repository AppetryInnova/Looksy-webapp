/**
 * Push Notification utilities for Looksy
 * Handles subscription registration and management
 */

// VAPID public key — in production, generate real keys with:
// npx web-push generate-vapid-keys
// and store private key in env vars. This is a demo key.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return null;
    }

    try {
        const reg = await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existing = await reg.pushManager.getSubscription();
        if (existing) return existing;

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });

        // Save to server
        const p256dh = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!)));
        const auth = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)));

        await fetch('/api/notifications/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
                p256dh,
                auth,
            }),
        });

        return subscription;
    } catch (err) {
        console.error('Push subscription error:', err);
        return null;
    }
}

export async function unsubscribeFromPush(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;

    try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.getSubscription();
        if (!subscription) return true;

        // Notify server
        await fetch('/api/notifications/push', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        return subscription.unsubscribe();
    } catch {
        return false;
    }
}

export async function isPushSubscribed(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        return !!sub;
    } catch {
        return false;
    }
}

export async function sendTestNotification(): Promise<void> {
    await fetch('/api/notifications/push/test', { method: 'POST' });
}
