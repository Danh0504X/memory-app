import { apiClient, refreshSession } from '@/lib/api-client';
import type {
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    AuthSuccessResponse,
    MessageResponse,
    GoogleLoginRequest,
    SetPasswordRequest,
} from '@/types/auth.types';

export const authApi = {
    // AUTH-01: Đăng ký
    register: (
        data: RegisterRequest
    ): Promise<RegisterResponse> => {
        return apiClient.post(
            '/auth/register',
            data
        ) as unknown as Promise<RegisterResponse>;
    },

    // AUTH-02: Đăng nhập - backend set cookie accessToken/refreshToken
    login: (
        data: LoginRequest
    ): Promise<AuthSuccessResponse> => {
        return apiClient.post(
            '/auth/login',
            data
        ) as unknown as Promise<AuthSuccessResponse>;
    },

    // AUTH-03: Refresh Token - refresh token gửi qua cookie, trả về userInfo hiện tại
    refreshToken: refreshSession,

    // AUTH-04: Logout - backend thu hồi session và xóa cookie
    logout: (): Promise<MessageResponse> => {
        return apiClient.post(
            '/auth/logout'
        ) as unknown as Promise<MessageResponse>;
    },

    // AUTH-05: Đăng nhập Google
    googleLogin: (
        data: GoogleLoginRequest
    ): Promise<AuthSuccessResponse> => {
        return apiClient.post(
            '/auth/google',
            data
        ) as unknown as Promise<AuthSuccessResponse>;
    },

    // AUTH-06: Thiết lập / đổi mật khẩu
    setPassword: (
        data: SetPasswordRequest
    ): Promise<MessageResponse> => {
        return apiClient.post(
            '/auth/set-password',
            data
        ) as unknown as Promise<MessageResponse>;
    },
};
