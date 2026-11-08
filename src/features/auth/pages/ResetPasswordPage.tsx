import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { useAuthStore } from '@/features/auth/store/authStore';
import { PASSWORD_RESET_ERROR_CODES, type ApiErrorResponse } from '@/types/auth.types';
import { authApi } from '../api/auth.api';
import { AuthField, AuthScene } from '../components/AuthScene';
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas/auth.schema';
import { parseResetTokenFromHash } from '../utils/resetToken';

type LinkStatus = 'checking' | 'ready' | 'invalid' | 'network-error';

const SUCCESS_NOTICE = 'Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.';
const PARTIAL_NOTICE =
    'Mật khẩu đã được đổi, nhưng chưa đăng xuất hết các thiết bị khác. Hãy đăng nhập bằng mật khẩu mới rồi đăng xuất trên thiết bị khác.';

// Trang mở từ link trong email: không nằm sau ProtectedRoute vì người mở có thể chưa đăng nhập.
// Mở trang chỉ kiểm tra link (không đổi gì); chỉ khi gửi form backend mới đổi mật khẩu và huỷ link.
export const ResetPasswordPage = (): ReactElement => {
    const navigate = useNavigate();
    // Token chỉ giữ trong bộ nhớ của trang, không ghi vào localStorage/sessionStorage
    const [token] = useState(() => parseResetTokenFromHash(window.location.hash));
    const [status, setStatus] = useState<LinkStatus>(token ? 'checking' : 'invalid');
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    // Gỡ token khỏi thanh địa chỉ để không nằm lại trong lịch sử, ảnh chụp màn hình hay link được chia sẻ
    useEffect(() => {
        if (window.location.hash) {
            window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
        }
    }, []);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        authApi
            .validatePasswordResetToken(token)
            .then((response) => {
                if (cancelled) return;
                setMaskedEmail(response.data.maskedEmail);
                setStatus('ready');
            })
            .catch((err: ApiErrorResponse) => {
                if (cancelled) return;
                // Chỉ coi là link hỏng khi backend xác nhận; lỗi mạng/máy chủ cho phép thử lại, không kết luận link sai
                setStatus(err.code === PASSWORD_RESET_ERROR_CODES.INVALID_TOKEN ? 'invalid' : 'network-error');
            });
        return () => {
            cancelled = true;
        };
    }, [token, attempt]);

    const retryCheck = () => {
        setStatus('checking');
        setAttempt((value) => value + 1);
    };

    // Mọi phiên đăng nhập cũ đã bị backend thu hồi: dọn cả cookie lẫn trạng thái ở trình duyệt này
    const finish = async (notice: string) => {
        try {
            await authApi.logout();
        } catch {
            // Phiên đã bị thu hồi từ backend, lỗi ở đây không ảnh hưởng kết quả
        }
        useAuthStore.getState().clearSession();
        navigate('/login', { replace: true, state: { notice } });
    };

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) return;
        setServerError(null);
        try {
            await authApi.confirmPasswordReset({ token, ...data });
            await finish(SUCCESS_NOTICE);
        } catch (err) {
            const error = err as ApiErrorResponse;
            if (error.code === PASSWORD_RESET_ERROR_CODES.INVALID_TOKEN) {
                setStatus('invalid');
            } else if (error.code === PASSWORD_RESET_ERROR_CODES.SESSION_REVOKE_FAILED) {
                await finish(PARTIAL_NOTICE);
            } else if (error.status === 0) {
                setServerError('Không kết nối được máy chủ. Mật khẩu chưa bị thay đổi, hãy thử lại.');
            } else if (error.code === PASSWORD_RESET_ERROR_CODES.SAME_PASSWORD) {
                setServerError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
            } else if (
                error.code === PASSWORD_RESET_ERROR_CODES.INVALID_PASSWORD ||
                error.code === PASSWORD_RESET_ERROR_CODES.PASSWORD_MISMATCH
            ) {
                setServerError('Mật khẩu mới chưa hợp lệ. Hãy kiểm tra lại rồi gửi lại.');
            } else {
                setServerError(error.message || 'Chưa đổi được mật khẩu. Vui lòng thử lại.');
            }
        }
    };

    return (
        <AuthScene
            switchPrompt="Nhớ ra mật khẩu rồi?"
            switchLabel="Đăng nhập"
            switchTo="/login"
            title={['Đặt mật khẩu', 'mới']}
            lead="Chọn mật khẩu mới cho tài khoản Memio của bạn."
        >
            {status === 'checking' && (
                <p className="auth-done" role="status">
                    <Loader2 className="inline h-5 w-5 animate-spin" aria-hidden="true" /> Đang kiểm tra liên kết…
                </p>
            )}

            {status === 'invalid' && (
                <div className="auth-form">
                    <p className="auth-alert" role="alert">
                        Liên kết không hợp lệ, đã hết hạn hoặc đã được dùng.
                    </p>
                    <p className="auth-done">
                        Để nhận liên kết mới, bạn có thể gửi lại yêu cầu từ trang Khôi phục mật khẩu.
                    </p>
                    <div className="auth-form__actions">
                        <Link to="/forgot-password" className="auth-button">
                            Yêu cầu liên kết mới
                        </Link>
                    </div>
                </div>
            )}

            {status === 'network-error' && (
                <div className="auth-form">
                    <p className="auth-alert" role="alert">
                        Không kết nối được máy chủ để kiểm tra liên kết. Liên kết của bạn chưa bị ảnh hưởng.
                    </p>
                    <div className="auth-form__actions">
                        <button type="button" className="auth-button" onClick={retryCheck}>
                            Thử lại
                        </button>
                    </div>
                </div>
            )}

            {status === 'ready' && (
                <>
                    {maskedEmail && (
                        <p className="auth-done">
                            Tài khoản: <strong>{maskedEmail}</strong>
                        </p>
                    )}
                    {serverError && (
                        <p className="auth-alert" role="alert">
                            {serverError}
                        </p>
                    )}
                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
                        <AuthField
                            id="new-password"
                            label="Mật khẩu mới"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Ít nhất 8 ký tự"
                            revealable
                            error={errors.newPassword?.message}
                            {...register('newPassword')}
                        />
                        <AuthField
                            id="confirm-password"
                            label="Nhập lại mật khẩu mới"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Nhập lại mật khẩu mới"
                            revealable
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword')}
                        />
                        <div className="auth-form__actions">
                            <button type="submit" disabled={isSubmitting} className="auth-button">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                                        Đang đổi mật khẩu…
                                    </>
                                ) : (
                                    'Đổi mật khẩu'
                                )}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </AuthScene>
    );
};

export default ResetPasswordPage;

