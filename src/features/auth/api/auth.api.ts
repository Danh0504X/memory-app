import { apiClient, refreshSession } from '@/lib/api-client';
import type {
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    AuthSuccessResponse,
    MessageResponse,
    ChangePasswordRequest,
    PasswordResetRequestResponse,
    PasswordResetValidateResponse,
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

    // Đổi mật khẩu khi đã đăng nhập (Flow A)
    changePassword: (
        data: ChangePasswordRequest
    ): Promise<MessageResponse> => {
        return apiClient.patch(
            '/auth/change-password',
            data
        ) as unknown as Promise<MessageResponse>;
    },

    // Quên mật khẩu: gửi link email (Flow B)
    forgotPassword: (
        email: string
    ): Promise<MessageResponse> => {
        return apiClient.post(
            '/password-reset/forgot',
            { email }
        ) as unknown as Promise<MessageResponse>;
    },

    // Gửi link đổi mật khẩu tới email của chính tài khoản đang đăng nhập; không có body vì backend tự lấy email
    requestPasswordResetLink: (): Promise<PasswordResetRequestResponse> => {
        return apiClient.post(
            '/password-reset/request'
        ) as unknown as Promise<PasswordResetRequestResponse>;
    },

    // Chỉ kiểm tra link, không làm link mất hiệu lực. Token đi trong body (không đặt trên URL) để khỏi vào log
    validatePasswordResetToken: (token: string): Promise<PasswordResetValidateResponse> => {
        return apiClient.post(
            '/password-reset/validate',
            { token }
        ) as unknown as Promise<PasswordResetValidateResponse>;
    },

    // Đặt mật khẩu mới; chỉ lúc này backend mới tiêu thụ token
    confirmPasswordReset: (data: {
        token: string;
        newPassword: string;
        confirmPassword: string;
    }): Promise<MessageResponse> => {
        return apiClient.post(
            '/password-reset/confirm',
            data
        ) as unknown as Promise<MessageResponse>;
    },
};
