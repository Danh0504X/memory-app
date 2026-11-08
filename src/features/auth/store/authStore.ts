import { create } from 'zustand';
import { setSessionHandlers } from '@/lib/api-client';
import { sessionStore } from '@/lib/session';
import { clearQueries } from '@/lib/queryCache';
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

// Token nằm ở SecureStore (src/lib/session.ts) và do api-client quản lý; store chỉ giữ thông tin user.
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    // Khôi phục phiên khi mở app: có refresh token đã lưu thì refresh để lấy access token mới và userInfo.
    hydrate: async () => {
        if (!sessionStore.getRefreshToken()) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
        }
        try {
            const user = await authApi.refreshToken();
            set({ user, isAuthenticated: true, isLoading: false });
        } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    saveSession: (user) => {
        set({ user, isAuthenticated: true, isLoading: false });
    },

    updateUser: (changes) => {
        set((state) => (state.user ? { user: { ...state.user, ...changes } } : {}));
    },

    // Xoá cả dữ liệu đã lưu đệm (hồ sơ, tiến độ) để người đăng nhập sau không thấy dữ liệu của người trước
    clearSession: () => {
        clearQueries();
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

setSessionHandlers({
    onRefreshed: (user) => useAuthStore.getState().saveSession(user),
    onExpired: () => useAuthStore.getState().clearSession(),
});
