import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, LogOut } from 'lucide-react';
import { z } from 'zod';
import { useAuthStore } from '@/features/auth/store/authStore';
import { profileApi, type UserProfile } from '../api/profile.api';

// Khớp với kiểm tra ở backend (profile.service.ts): bỏ khoảng trắng hai đầu, 2–100 ký tự, có dấu và dấu cách đều được
const nameSchema = z.object({
    username: z
        .string()
        .trim()
        .min(2, 'Tên hiển thị cần ít nhất 2 ký tự.')
        .max(100, 'Tên hiển thị tối đa 100 ký tự.'),
});

type NameForm = z.infer<typeof nameSchema>;

interface AccountSettingsProps {
    profile: UserProfile;
    startEditing?: boolean;
    onSaved: (profile: UserProfile) => void;
}

// Tài khoản dạng danh sách cài đặt: mỗi dòng một nhãn, một giá trị và một hành động
export const AccountSettings = ({ profile, startEditing = false, onSaved }: AccountSettingsProps) => {
    const navigate = useNavigate();
    const { user, updateUser, logout } = useAuthStore();
    const [editing, setEditing] = useState(startEditing);
    const [status, setStatus] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const editButton = useRef<HTMLButtonElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        setFocus,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<NameForm>({
        resolver: zodResolver(nameSchema),
        defaultValues: { username: profile.username },
    });

    // Mở ô sửa thì con trỏ vào ô nhập; đóng (lưu hoặc huỷ) thì con trỏ trở về nút "Đổi"
    const wasEditing = useRef(editing);
    useEffect(() => {
        if (editing) setFocus('username');
        else if (wasEditing.current) editButton.current?.focus();
        wasEditing.current = editing;
    }, [editing, setFocus]);

    const close = () => {
        setEditing(false);
        setSaveError(null);
        reset({ username: profile.username });
    };

    const onSubmit = async ({ username }: NameForm) => {
        setSaveError(null);
        try {
            const { data } = await profileApi.updateUsername(username);
            updateUser({ username: data.profile.username });
            onSaved(data.profile);
            reset({ username: data.profile.username });
            setEditing(false);
            setStatus('Đã đổi tên hiển thị.');
        } catch (error) {
            setSaveError((error as { message?: string }).message ?? 'Không lưu được tên mới. Vui lòng thử lại.');
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    };

    const onLogout = async () => {
        setIsLoggingOut(true);
        setLogoutError(null);
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            setLogoutError((error as { message?: string }).message ?? 'Đăng xuất thất bại. Vui lòng thử lại.');
            setIsLoggingOut(false);
        }
    };

    return (
        <dl className="settings">
            <div className="settings__row">
                <dt id="display-name-label">Tên hiển thị</dt>
                <dd>
                    {editing ? (
                        <form className="settings__form" onSubmit={handleSubmit(onSubmit)} onKeyDown={onKeyDown} noValidate>
                            <div className="settings__inline">
                                <input
                                    type="text"
                                    autoComplete="nickname"
                                    maxLength={100}
                                    aria-labelledby="display-name-label"
                                    aria-invalid={Boolean(errors.username)}
                                    aria-describedby="display-name-help"
                                    className="settings__input"
                                    {...register('username', { onChange: () => setStatus(null) })}
                                />
                                <button type="submit" className="btn btn--brand settings__btn" disabled={isSubmitting || !isDirty}>
                                    {isSubmitting && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                                    {isSubmitting ? 'Đang lưu…' : 'Lưu'}
                                </button>
                                <button type="button" className="btn btn--quiet settings__btn" onClick={close}>
                                    Huỷ
                                </button>
                            </div>
                            <p
                                id="display-name-help"
                                className={errors.username || saveError ? 'settings__error' : 'settings__hint'}
                                role={errors.username || saveError ? 'alert' : undefined}
                            >
                                {errors.username?.message ?? saveError ?? 'Từ 2 đến 100 ký tự, có thể có dấu và dấu cách. Bấm Esc để huỷ.'}
                            </p>
                        </form>
                    ) : (
                        <>
                            <span className="settings__value">{profile.username}</span>
                            <span className="settings__status" role="status">
                                {status}
                            </span>
                            <button ref={editButton} type="button" className="settings__action" onClick={() => setEditing(true)}>
                                Đổi
                            </button>
                        </>
                    )}
                </dd>
            </div>

            {user?.email && (
                <div className="settings__row">
                    <dt>Email đăng nhập</dt>
                    <dd>
                        <span className="settings__value">{user.email}</span>
                    </dd>
                </div>
            )}

            <div className="settings__row">
                <dt>Phiên đăng nhập</dt>
                <dd>
                    <span className="settings__hint">Đăng xuất khỏi trình duyệt này.</span>
                    {logoutError && (
                        <span className="settings__error" role="alert">
                            {logoutError}
                        </span>
                    )}
                    <button type="button" className="settings__action settings__action--danger" onClick={onLogout} disabled={isLoggingOut}>
                        {isLoggingOut ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
                        {isLoggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
                    </button>
                </dd>
            </div>
        </dl>
    );
};
