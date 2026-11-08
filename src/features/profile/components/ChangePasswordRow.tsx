import { useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';

import { authApi } from '@/features/auth/api/auth.api';
import { changePasswordSchema, type ChangePasswordFormData } from '@/features/auth/schemas/auth.schema';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PASSWORD_RESET_ERROR_CODES, type ApiErrorResponse } from '@/types/auth.types';

export const ChangePasswordRow = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const editButtonRef = useRef<HTMLButtonElement | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const openForm = () => {
        setServerError(null);
        reset();
        setIsEditing(true);
    };

    const closeForm = () => {
        setIsEditing(false);
        setServerError(null);
        reset();
        editButtonRef.current?.focus();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeForm();
        }
    };

    const onSubmit = async (data: ChangePasswordFormData) => {
        setServerError(null);
        try {
            await authApi.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
            });

            // Thành công: xóa form, đóng form, thu hồi session ở frontend và đưa về login
            reset();
            setIsEditing(false);
            useAuthStore.getState().clearSession();
            navigate('/login', {
                replace: true,
                state: { notice: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.' },
            });
        } catch (err) {
            const error = err as ApiErrorResponse;
            if (error.code === PASSWORD_RESET_ERROR_CODES.INCORRECT_CURRENT_PASSWORD) {
                setServerError('Mật khẩu hiện tại không chính xác.');
            } else if (error.code === PASSWORD_RESET_ERROR_CODES.SAME_PASSWORD) {
                setServerError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
            } else if (error.status === 401) {
                setServerError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (error.status === 0) {
                setServerError('Không thể kết nối máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
            } else {
                setServerError(error.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
            }
        }
    };

    return (
        <div className="settings__row">
            <dt id="password-label">Mật khẩu</dt>
            <dd>
                {isEditing ? (
                    <form className="settings__password-form" onSubmit={handleSubmit(onSubmit)} onKeyDown={onKeyDown} noValidate>
                        {serverError && (
                            <p className="settings__error" role="alert">
                                {serverError}
                            </p>
                        )}

                        <div className="settings__password-field">
                            <label htmlFor="currentPassword" className="settings__password-label">
                                Mật khẩu hiện tại
                            </label>
                            <div className="settings__password-control">
                                <input
                                    id="currentPassword"
                                    type={showCurrent ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    aria-invalid={Boolean(errors.currentPassword)}
                                    aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
                                    className="settings__input"
                                    disabled={isSubmitting}
                                    {...register('currentPassword')}
                                />
                                <button
                                    type="button"
                                    className="settings__reveal-btn"
                                    onClick={() => setShowCurrent((prev) => !prev)}
                                    aria-label={showCurrent ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                                    tabIndex={-1}
                                >
                                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.currentPassword && (
                                <p id="current-password-error" className="settings__error" role="alert">
                                    {errors.currentPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="settings__password-field">
                            <label htmlFor="newPassword" className="settings__password-label">
                                Mật khẩu mới
                            </label>
                            <div className="settings__password-control">
                                <input
                                    id="newPassword"
                                    type={showNew ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(errors.newPassword)}
                                    aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
                                    className="settings__input"
                                    disabled={isSubmitting}
                                    {...register('newPassword')}
                                />
                                <button
                                    type="button"
                                    className="settings__reveal-btn"
                                    onClick={() => setShowNew((prev) => !prev)}
                                    aria-label={showNew ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                                    tabIndex={-1}
                                >
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p id="new-password-error" className="settings__error" role="alert">
                                    {errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="settings__password-field">
                            <label htmlFor="confirmPassword" className="settings__password-label">
                                Xác nhận mật khẩu mới
                            </label>
                            <div className="settings__password-control">
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(errors.confirmPassword)}
                                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                                    className="settings__input"
                                    disabled={isSubmitting}
                                    {...register('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    className="settings__reveal-btn"
                                    onClick={() => setShowConfirm((prev) => !prev)}
                                    aria-label={showConfirm ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                                    tabIndex={-1}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p id="confirm-password-error" className="settings__error" role="alert">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="settings__password-footer">
                            <div className="settings__password-actions">
                                <button type="submit" className="btn btn--brand settings__btn" disabled={isSubmitting}>
                                    {isSubmitting && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                                    {isSubmitting ? 'Đang lưu…' : 'Lưu mật khẩu'}
                                </button>
                                <button type="button" className="btn btn--quiet settings__btn" onClick={closeForm} disabled={isSubmitting}>
                                    Huỷ
                                </button>
                            </div>
                            <Link to="/forgot-password" className="auth__link" style={{ fontSize: '13px' }}>
                                Quên mật khẩu?
                            </Link>
                        </div>
                    </form>
                ) : (
                    <>
                        <span className="settings__value">••••••••</span>
                        <button
                            ref={editButtonRef}
                            type="button"
                            className="settings__action"
                            onClick={openForm}
                        >
                            Đổi mật khẩu
                        </button>
                    </>
                )}
            </dd>
        </div>
    );
};

