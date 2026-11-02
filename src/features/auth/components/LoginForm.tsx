import { useState, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/features/auth/store/authStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { loginSchema, type LoginFormData } from '../schemas/auth.schema';
import { authApi } from '../api/auth.api';
import { AuthField, AuthScene } from './AuthScene';
import type { ApiErrorResponse } from '@/types/auth.types';

export const LoginForm = (): ReactElement => {
    const navigate = useNavigate();
    const location = useLocation();
    // Quay lại trang được bảo vệ đã chặn trước đó (ProtectedRoute), mặc định về trang chủ
    const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
    const { saveSession } = useAuthStore();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: true,
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setServerError(null);
            const response = await authApi.login({
                email: data.email,
                password: data.password,
                rememberMe: data.rememberMe ?? false,
            });

            // Token đã được backend set vào cookie httpOnly, chỉ cần lưu userInfo
            saveSession(response.data.userInfo);
            navigate(redirectTo, { replace: true });
        } catch (err) {
            const error = err as ApiErrorResponse;
            // Backend không gửi mã lỗi riêng cho login: 401 = sai thông tin, 403 = tài khoản không hoạt động
            if (error.status === 401) {
                setServerError('Email hoặc mật khẩu không chính xác.');
            } else if (error.status === 403) {
                setServerError('Tài khoản của bạn đã bị khóa.');
            } else {
                setServerError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }
        }
    };

    return (
        <AuthScene
            switchPrompt="Chưa có tài khoản?"
            switchLabel="Đăng ký"
            switchTo="/register"
            title={['Bước vào', 'phòng nhớ']}
            lead="Đăng nhập để tiếp tục buổi luyện trí nhớ của bạn với Memio."
        >
            {serverError && (
                <p className="auth-alert" role="alert">{serverError}</p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
                <AuthField
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="ban@email.com"
                    error={errors.email?.message}
                    {...register('email')}
                />

                <AuthField
                    id="password"
                    label="Mật khẩu"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Mật khẩu của bạn"
                    revealable
                    error={errors.password?.message}
                    {...register('password')}
                />

                <div className="auth-form__row">
                    <label className="auth-check">
                        <input type="checkbox" {...register('rememberMe')} />
                        Duy trì đăng nhập trên thiết bị này
                    </label>
                    <a href="#forgot-password" className="auth__link">
                        Quên mật khẩu?
                    </a>
                </div>

                <div className="auth-form__actions">
                    <button type="submit" disabled={isSubmitting} className="auth-button">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Đang đăng nhập...
                            </>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>
                    <button type="button" className="auth-button auth-button--quiet">
                        Tiếp tục với Google
                    </button>
                </div>
            </form>
        </AuthScene>
    );
};

export default LoginForm;
