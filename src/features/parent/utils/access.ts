import type { User } from '@/types/auth.types';

type Account = Pick<User, 'role' | 'isEmailVerified'> | null;
export const accountHome = (user: Account): '/' | '/parent' | '/parent/pending' =>
    user?.role === 'parent' ? user.isEmailVerified ? '/parent' : '/parent/pending' : '/';
const within = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

// UI policy only; the backend remains responsible for authorization.
export function accessRedirect(path: string, user: Account): string | null {
    const publicParent = ['/parent/verify', '/parent/reset-password', '/parent/forgot-password'];
    if (publicParent.includes(path)) return null;
    if (user?.role === 'parent') {
        if (path === '/forgot-password') return '/parent/forgot-password';
        if (!user.isEmailVerified) return path === '/parent/pending' || path === '/parent/password' ? null : '/parent/pending';
        if (path === '/parent/pending') return '/parent';
        return within(path, '/parent') || within(path, '/family-room') ? null : '/parent';
    }
    if (path === '/parent-link' && !user) return '/login';
    if (within(path, '/parent')) return user ? '/' : '/login';
    if (within(path, '/family-room') && !user) return '/login';
    return null;
}
