import { useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { authApi } from '../api/auth.api';
import { passwordRules, registerSchema, type RegisterFormData } from '../schemas/auth.schema';
import { AuthField, AuthScene } from './AuthScene';
import { GoogleIcon } from './GoogleIcon';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import type { ApiErrorResponse } from '@/types/auth.types';

export const RegisterForm = (): ReactElement => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { loginWithGoogle, isGoogleLoading } = useGoogleAuth({
        redirectTo: '/',
        onError: (message) => setServerError(message),
    });

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    // Theo dõi mật khẩu để các điều kiện bên dưới ô sáng lên khi đạt
    const password = useWatch({ control, name: 'password' });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setServerError(null);
            await authApi.register({
                username: data.username,
                email: data.email,
                password: data.password,
            });

            setIsSuccess(true);
        } catch (err) {
            const error = err as ApiErrorResponse;
            // Backend trả 409 khi email đã tồn tại (username không bắt buộc duy nhất)
            if (error.status === 409) {
                setServerError('Email này đã được sử dụng. Vui lòng thử email khác.');
            } else {
                setServerError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        }
    };

    if (isSuccess) {
        return (
            <AuthScene
                switchPrompt="Đã có tài khoản?"
                switchLabel="Đăng nhập"
                switchTo="/login"
                title={['Phòng đã', 'sẵn sàng']}
                lead="Tài khoản của bạn đã được tạo. Đăng nhập để bắt đầu buổi luyện tập đầu tiên."
            >
                <div className="auth-form">
                    <p className="auth-done">
                        Câu chuyện, con số và không gian đang chờ bạn. Buổi luyện đầu tiên chỉ mất vài phút.
                    </p>
                    <div className="auth-form__actions">
                        <button
                            type="button"
                            onClick={() => navigate('/login', { viewTransition: true })}
                            className="auth-button"
                        >
                            Đi đến trang đăng nhập
                        </button>
                    </div>
                </div>
            </AuthScene>
        );
    }

    return (
        <AuthScene
            switchPrompt="Đã có tài khoản?"
            switchLabel="Đăng nhập"
            switchTo="/login"
            title={['Phòng nhớ', 'đầu tiên']}
            lead="Tạo tài khoản Memio miễn phí và bắt đầu luyện trí nhớ bằng câu chuyện, con số, không gian."
        >
            {serverError && (
                <p className="auth-alert" role="alert">{serverError}</p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form auth-form--grid">
                <AuthField
                    id="username"
                    label="Tên người dùng"
                    type="text"
                    autoComplete="username"
                    placeholder="Ví dụ: minhanh"
                    error={errors.username?.message}
                    {...register('username')}
                />

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
                    autoComplete="new-password"
                    placeholder="Tạo mật khẩu"
                    revealable
                    error={errors.password?.message}
                    hint={
                        <ul className="rules">
                            {passwordRules.map((rule) => (
                                <li key={rule.label} className="rules__item" data-met={rule.test(password)}>
                                    {rule.label}
                                </li>
                            ))}
                        </ul>
                    }
                    {...register('password')}
                />

                <AuthField
                    id="confirmPassword"
                    label="Nhập lại mật khẩu"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Gõ lại mật khẩu"
                    revealable
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <div className="auth-form__actions">
                    <button type="submit" disabled={isSubmitting || isGoogleLoading} className="auth-button">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Đang tạo tài khoản...
                            </>
                        ) : (
                            'Tạo tài khoản'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={loginWithGoogle}
                        disabled={isSubmitting || isGoogleLoading}
                        className="auth-button auth-button--quiet"
                    >
                        {isGoogleLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Đang chuyển hướng...
                            </>
                        ) : (
                            <>
                                <GoogleIcon />
                                Tiếp tục với Google
                            </>
                        )}
                    </button>
                </div>
            </form>
        </AuthScene>
    );
};

export default RegisterForm;
