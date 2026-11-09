import { create } from 'zustand';
import { setSessionHandlers } from '@/lib/api-client';
import { sessionStore } from '@/lib/session';
import { clearQueries, setQueryOwner } from '@/lib/queryCache';
import { authApi } from '@/features/auth/api/auth.api';
import type { User } from '@/types/auth.types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hydrate: () => Promise<void>;
    saveSession: (user: User) => void;
    updateUser: (changes: Partial<User>) => void;
    clearSession: () => void;
    logout: () => Promise<void>;
}

// Backend từ chối phiên (hết hạn, bị thu hồi, tài khoản bị khoá); lỗi mạng có status 0
export const isSessionRejected = (error: unknown): boolean => {
    const status = (error as { status?: number } | null)?.status;
    return status === 401 || status === 403;
};

// Token nằm ở SecureStore (src/lib/session.ts) và do api-client quản lý; store chỉ giữ thông tin user.
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    // Khôi phục phiên khi mở app. Có user đã lưu thì vào app ngay rồi refresh ở nền;
    // chỉ đăng xuất khi backend từ chối phiên (401/403), mất mạng hay backend chưa chạy thì giữ phiên.
    hydrate: async () => {
        if (!sessionStore.getRefreshToken()) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
        }
        const cached = sessionStore.getUser();
        if (cached) set({ user: cached, isAuthenticated: true, isLoading: false });
        try {
            useAuthStore.getState().saveSession(await authApi.refreshToken());
        } catch (error) {
            if (isSessionRejected(error)) useAuthStore.getState().clearSession();
            else if (!cached) set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    saveSession: (user) => {
        sessionStore.setUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
    },

    updateUser: (changes) => {
        const { user } = useAuthStore.getState();
        if (!user) return;
        const next = { ...user, ...changes };
        sessionStore.setUser(next);
        set({ user: next });
    },

    // Xoá cả dữ liệu đã lưu đệm (hồ sơ, tiến độ) để người đăng nhập sau không thấy dữ liệu của người trước
    clearSession: () => {
        clearQueries();
        sessionStore.setUser(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
    },

    // Gọi backend để thu hồi session. Khác bản web: mất mạng vẫn đăng xuất trên máy,
    // vì không còn cookie nào để trình duyệt xoá hộ; refresh token cũ tự hết hạn ở backend.
    logout: async () => {
        try {
            await authApi.logout(sessionStore.getRefreshToken());
        } finally {
            sessionStore.clearTokens();
            useAuthStore.getState().clearSession();
        }
    },
}));

// Dữ liệu đã tải gắn với tài khoản đang đăng nhập (xem queryCache)
useAuthStore.subscribe((state, previous) => {
    if (state.user?._id !== previous.user?._id) setQueryOwner(state.user?._id ?? null);
});

setSessionHandlers({
    onRefreshed: (user) => useAuthStore.getState().saveSession(user),
    onExpired: () => useAuthStore.getState().clearSession(),
});
