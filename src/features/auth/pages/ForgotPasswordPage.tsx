import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck } from 'lucide-react';

import { authApi } from '../api/auth.api';
import { AuthField, AuthScene } from '../components/AuthScene';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/auth.schema';
import { PASSWORD_RESET_ERROR_CODES, type ApiErrorResponse } from '@/types/auth.types';

export const ForgotPasswordPage = (): ReactElement => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setServerError(null);
        try {
            await authApi.forgotPassword(data.email);
            setSubmittedEmail(data.email);
            setIsSubmitted(true);
        } catch (err) {
            const error = err as ApiErrorResponse;
            if (error.code === PASSWORD_RESET_ERROR_CODES.RATE_LIMITED) {
                setServerError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
            } else if (error.code === PASSWORD_RESET_ERROR_CODES.EMAIL_NOT_CONFIGURED) {
                setServerError('Hệ thống chưa thể gửi email lúc này. Vui lòng liên hệ quản trị viên hoặc thử lại sau.');
            } else if (error.status === 0) {
                setServerError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng rồi thử lại.');
            } else {
                setServerError(error.message || 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
            }
        }
    };

    return (
        <AuthScene
            switchPrompt="Đã nhớ mật khẩu?"
            switchLabel="Đăng nhập"
            switchTo="/login"
            title={['Khôi phục', 'mật khẩu']}
            lead="Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu."
        >
            {serverError && (
                <p className="auth-alert" role="alert">
                    {serverError}
                </p>
            )}

            {isSubmitted ? (
                <div className="auth-confirmed" style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', marginBottom: '16px' }}>
                        <MailCheck size={36} aria-hidden="true" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                        Kiểm tra hộp thư của bạn
                    </h3>
                    <p style={{ color: 'var(--color-ink-soft)', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                        Nếu email <strong>{submittedEmail}</strong> tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hộp thư của bạn.
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
                        Liên kết có hiệu lực trong 15 phút. Hãy kiểm tra cả hộp thư rác (Spam) nếu bạn không thấy email trong hộp thư đến.
                    </p>
                    <div className="auth-form__actions">
                        <Link to="/login" className="auth-button" style={{ textAlign: 'center' }}>
                            Quay lại đăng nhập
                        </Link>
                        <button
                            type="button"
                            className="auth-button auth-button--quiet"
                            onClick={() => setIsSubmitted(false)}
                        >
                            Gửi lại tới email khác
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
                    <AuthField
                        id="email"
                        label="Email tài khoản"
                        type="email"
                        autoComplete="email"
                        placeholder="ban@email.com"
                        error={errors.email?.message}
                        disabled={isSubmitting}
                        {...register('email')}
                    />

                    <div className="auth-form__actions" style={{ marginTop: '12px' }}>
                        <button type="submit" disabled={isSubmitting} className="auth-button">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Đang gửi liên kết...
                                </>
                            ) : (
                                'Gửi liên kết đặt lại mật khẩu'
                            )}
                        </button>
                        <Link to="/login" className="auth-button auth-button--quiet" style={{ textAlign: 'center' }}>
                            Huỷ
                        </Link>
                    </div>
                </form>
            )}
        </AuthScene>
    );
};

export default ForgotPasswordPage;

