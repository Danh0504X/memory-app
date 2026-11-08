import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import type { ApiErrorResponse } from '@/types/auth.types';

declare global {
    interface Window {
        google?: {
            accounts?: {
                oauth2?: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (response: { access_token?: string; error?: string }) => void;
                        error_callback?: (error: unknown) => void;
                    }) => {
                        requestAccessToken: (config?: { prompt?: string }) => void;
                    };
                };
            };
        };
    }
}

interface UseGoogleAuthOptions {
    redirectTo?: string;
    onError?: (message: string) => void;
}

export const useGoogleAuth = ({ redirectTo = '/', onError }: UseGoogleAuthOptions = {}) => {
    const navigate = useNavigate();
    const { saveSession } = useAuthStore();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const loginWithGoogle = useCallback(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            onError?.('Chưa cấu hình Google Client ID trong biến môi trường.');
            return;
        }

        if (!window.google?.accounts?.oauth2) {
            onError?.('Không thể tải dịch vụ Google. Vui lòng kiểm tra lại mạng hoặc thử lại sau.');
            return;
        }

        try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'email profile openid',
                callback: async (tokenResponse) => {
                    if (tokenResponse.error) {
                        setIsGoogleLoading(false);
                        onError?.('Đăng nhập Google bị hủy hoặc thất bại.');
                        return;
                    }

                    if (tokenResponse.access_token) {
                        try {
                            setIsGoogleLoading(true);
                            const res = await authApi.googleLogin({
                                accessToken: tokenResponse.access_token,
                            });
                            saveSession(res.data.userInfo);
                            navigate(redirectTo, { replace: true });
                        } catch (err) {
                            const error = err as ApiErrorResponse;
                            onError?.(error.message || 'Đăng nhập bằng Google thất bại.');
                        } finally {
                            setIsGoogleLoading(false);
                        }
                    }
                },
                error_callback: () => {
                    setIsGoogleLoading(false);
                    onError?.('Cửa sổ đăng nhập Google đã bị đóng.');
                },
            });

            tokenClient.requestAccessToken({ prompt: 'select_account' });
        } catch {
            onError?.('Đã có lỗi xảy ra khi khởi chạy Google Sign-In.');
        }
    }, [navigate, onError, redirectTo, saveSession]);

    return {
        loginWithGoogle,
        isGoogleLoading,
    };
};

