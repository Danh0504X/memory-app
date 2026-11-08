// Model thông tin người dùng - khớp với `buildUserInfo` ở backend (services/user.service.ts)
export interface User {
    _id: string;
    id?: string;
    email: string;
    username: string;
    status: string;
    role: string;
    avatarUrl?: string | null;
    authProvider?: 'local' | 'google';
    isEmailVerified?: boolean;
    hasPassword?: boolean;
}

// Payload gửi lên API AUTH-01 Đăng ký
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

// Payload gửi lên API AUTH-02 Đăng nhập
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe: boolean;    // false: đăng xuất khi đóng trình duyệt
}

// Payload gửi lên API Google OAuth
export interface GoogleLoginRequest {
    accessToken: string;
}

// Payload gửi lên API Đặt / Đổi mật khẩu
export interface SetPasswordRequest {
    currentPassword?: string;
    newPassword: string;
}

// Khung response thành công chung của backend
export interface ApiSuccessResponse<T = undefined> {
    status: 'success';
    message?: string;
    data: T;
}

// AUTH-01 Đăng ký: trả về thông tin user vừa tạo
export type RegisterResponse = ApiSuccessResponse<{ userInfo: User }>;

// AUTH-02 Đăng nhập và AUTH-03 Refresh: token nằm trong cookie httpOnly, body chỉ dùng userInfo
export type AuthSuccessResponse = ApiSuccessResponse<{ userInfo: User }>;

// AUTH-04 Logout
export interface MessageResponse {
    status: 'success';
    message: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

// Đổi mật khẩu bằng link gửi qua email - khớp /api/password-reset của backend (controller/passwordReset.controller.ts)
export interface PasswordResetRequestData {
    maskedEmail: string;
    expiresInMinutes: number;
    resendAfterSeconds: number;
}

export type PasswordResetRequestResponse = ApiSuccessResponse<PasswordResetRequestData>;
export type PasswordResetValidateResponse = ApiSuccessResponse<{ maskedEmail: string }>;

// Mã lỗi của luồng đổi mật khẩu (config/passwordReset.ts ở backend)
export const PASSWORD_RESET_ERROR_CODES = {
    INVALID_TOKEN: 'INVALID_RESET_TOKEN',
    RATE_LIMITED: 'RESET_LINK_RATE_LIMITED',
    INVALID_PASSWORD: 'INVALID_PASSWORD',
    PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',
    SAME_PASSWORD: 'SAME_PASSWORD',
    INCORRECT_CURRENT_PASSWORD: 'INCORRECT_CURRENT_PASSWORD',
    CURRENT_PASSWORD_REQUIRED: 'CURRENT_PASSWORD_REQUIRED',
    EMAIL_NOT_CONFIGURED: 'EMAIL_NOT_CONFIGURED',
    EMAIL_DELIVERY_FAILED: 'EMAIL_DELIVERY_FAILED',
    SESSION_REVOKE_FAILED: 'SESSION_REVOKE_FAILED',
} as const;

// Mã lỗi backend gửi kèm (middlewares/authMiddleware.ts - AUTH_ERROR_CODES)
export const AUTH_ERROR_CODES = {
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
} as const;

// Định dạng lỗi đã chuẩn hóa ở api-client từ response `{ statusCode, code?, message, errors }` của backend
export interface ApiErrorResponse {
    code: string;           // Mã lỗi từ backend, hoặc 'UNKNOWN_ERROR' / 'ERR_NETWORK'
    message: string;        // Thông báo lỗi từ backend
    status: number;         // HTTP Status Code (0 khi lỗi mạng)
    errors?: unknown[];
}
