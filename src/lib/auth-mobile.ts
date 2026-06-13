import { supabase } from './supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Resolves the authenticated User ID from either a NextAuth cookie session (web)
 * or a Supabase JWT Bearer token passed in the Authorization header (mobile).
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
    // Dev/Test helper: allow mock user ID from header if not in production
    if (process.env.NODE_ENV !== 'production') {
        const mockUserId = req.headers.get('x-mock-user-id');
        if (mockUserId) {
            console.log('[auth-mobile] Dev-mode mock userId resolved from header:', mockUserId);
            return mockUserId;
        }
    }

    // 1. Try NextAuth session (Web)
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            return session.user.id;
        }
    } catch (_) {
        // getServerSession can fail if running outside of Next request context
    }

    // 2. Try Supabase JWT Bearer token (Mobile)
    const authHeader = req.headers.get('authorization');
    console.log('[auth-mobile] incoming authorization header:', authHeader);
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('[auth-mobile] extracted token length:', token.length);
        try {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error) {
                console.error('[auth-mobile] Supabase getUser error:', error);
            }
            if (user && !error) {
                console.log('[auth-mobile] Supabase token resolved to user:', user.id);
                return user.id;
            }
        } catch (err) {
            console.error('Error verifying Supabase token in mobile auth helper:', err);
        }
    } else {
        console.log('[auth-mobile] authorization header is either missing or does not start with Bearer');
    }

    return null;
}
