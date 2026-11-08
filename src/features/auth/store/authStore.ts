import { create } from 'zustand';
import { setSessionHandlers } from '@/lib/api-client';
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

// Token nằm trong cookie httpOnly nên frontend không đọc được; store chỉ giữ thông tin user.
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    // Khôi phục phiên khi tải trang: gọi refresh để lấy access token mới và userInfo từ cookie.
    hydrate: async () => {
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

    // Gọi backend để thu hồi session và xóa cookie; chỉ xóa phiên ở client khi backend thành công.
    logout: async () => {
        await authApi.logout();
        try {
            localStorage.removeItem('memio_user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } catch {
            // Bỏ qua nếu môi trường không cho phép truy cập localStorage
        }
        useAuthStore.getState().clearSession();
    },
}));

setSessionHandlers({
    onRefreshed: (user) => useAuthStore.getState().saveSession(user),
    onExpired: () => useAuthStore.getState().clearSession(),
});
