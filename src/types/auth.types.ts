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
