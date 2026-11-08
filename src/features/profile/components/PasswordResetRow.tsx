import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Mail } from 'lucide-react';
import { authApi } from '@/features/auth/api/auth.api';
import { maskEmail } from '@/features/auth/utils/maskEmail';
import { PASSWORD_RESET_ERROR_CODES, type ApiErrorResponse } from '@/types/auth.types';

interface PasswordResetRowProps {
    email: string;
}

type SendState =
    | { kind: 'idle' }
    | { kind: 'sent'; expiresInMinutes: number }
    | { kind: 'error'; message: string };

const describeError = (error: ApiErrorResponse): string => {
    if (error.status === 0) return 'Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.';
    if (error.code === PASSWORD_RESET_ERROR_CODES.EMAIL_NOT_CONFIGURED) {
        return 'Hệ thống chưa thể gửi email lúc này. Vui lòng thử lại sau.';
    }
    if (error.code === PASSWORD_RESET_ERROR_CODES.EMAIL_DELIVERY_FAILED) {
        return 'Không gửi được email. Bạn có thể bấm gửi lại.';
    }
    return error.message || 'Chưa gửi được liên kết. Vui lòng thử lại.';
};

const describeWait = (seconds: number): string =>
    seconds > 90 ? `Bạn đã gửi quá nhiều yêu cầu. Hãy thử lại sau khoảng ${Math.ceil(seconds / 60)} phút.` : `Vui lòng chờ ${seconds} giây rồi gửi lại.`;

// Đổi mật khẩu không nhập mật khẩu cũ: quyền đặt mật khẩu mới được chứng minh bằng việc mở được link gửi tới email của chính tài khoản
export const PasswordResetRow = ({ email }: PasswordResetRowProps) => {
    const [state, setState] = useState<SendState>({ kind: 'idle' });
    const [isSending, setIsSending] = useState(false);
    // Thời điểm được gửi lại; hết mốc này nút mới bấm được (backend vẫn là nơi kiểm tra thật)
    const [availableAt, setAvailableAt] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const sendingRef = useRef(false);

    const secondsLeft = Math.max(0, Math.ceil((availableAt - now) / 1000));

    useEffect(() => {
        if (availableAt <= Date.now()) return;
        const timer = setInterval(() => {
            const current = Date.now();
            setNow(current);
            if (current >= availableAt) clearInterval(timer);
        }, 500);
        return () => clearInterval(timer);
    }, [availableAt]);

    const waitFor = (seconds: number) => {
        setNow(Date.now());
        setAvailableAt(Date.now() + seconds * 1000);
    };

    const send = async () => {
        // Chặn bấm lặp trước khi React kịp vô hiệu hoá nút
        if (sendingRef.current || secondsLeft > 0) return;
        sendingRef.current = true;
        setIsSending(true);
        try {
            const { data } = await authApi.requestPasswordResetLink();
            setState({ kind: 'sent', expiresInMinutes: data.expiresInMinutes });
            waitFor(data.resendAfterSeconds);
        } catch (err) {
            const error = err as ApiErrorResponse;
            if (error.code === PASSWORD_RESET_ERROR_CODES.RATE_LIMITED) {
                const retryAfter = (error.errors?.[0] as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds ?? 60;
                waitFor(retryAfter);
                setState({ kind: 'error', message: describeWait(retryAfter) });
            } else {
                setState({ kind: 'error', message: describeError(error) });
            }
        } finally {
            sendingRef.current = false;
            setIsSending(false);
        }
    };

    const buttonLabel = isSending
        ? 'Đang gửi…'
        : secondsLeft > 0
          ? `Gửi lại sau ${secondsLeft}s`
          : state.kind === 'sent'
            ? 'Gửi lại liên kết'
            : 'Gửi liên kết đổi mật khẩu';

    return (
        <div className="settings__row">
            <dt id="password-label">Mật khẩu</dt>
            <dd>
                <span className="settings__hint">
                    Nhận liên kết đặt mật khẩu mới qua email <strong>{maskEmail(email)}</strong>.
                </span>
                {state.kind === 'sent' && (
                    <span className="settings__status" role="status">
                        Đã gửi liên kết. Hãy mở email (kể cả thư rác); liên kết có hiệu lực {state.expiresInMinutes} phút và chỉ dùng một lần.
                    </span>
                )}
                {state.kind === 'error' && (
                    <span className="settings__error" role="alert">
                        {state.message}
                    </span>
                )}
                <button
                    type="button"
                    className="settings__action"
                    onClick={send}
                    disabled={isSending || secondsLeft > 0}
                >
                    {isSending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
                    {buttonLabel}
                </button>
            </dd>
        </div>
    );
};
