import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Mascot } from '@/components/ui/Mascot';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { sessionStore } from '@/lib/session';
import { PASSWORD_RESET_ERROR_CODES, type ApiErrorResponse } from '@/types/auth.types';
import { authApi } from '../api/auth.api';
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas/auth.schema';
import { useAuthStore } from '../store/authStore';
import { parseResetTokenFromHash } from '../utils/resetToken';

const SUCCESS_NOTICE = 'Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.';
const PARTIAL_NOTICE =
    'Mật khẩu đã được đổi, nhưng chưa đăng xuất hết các thiết bị khác. Hãy đăng nhập bằng mật khẩu mới rồi đăng xuất trên thiết bị khác.';

type LinkStatus = 'checking' | 'ready' | 'invalid' | 'network-error';

// Đặt mật khẩu mới từ link trong email, mở vào app dạng memio://reset-password?token=...
// (bản web đọc token ở "#token="; deep link của app dùng query vì expo-router không đưa fragment vào params)
export function ResetPasswordScreen({ rawToken }: { rawToken: string | undefined }) {
    const token = rawToken ? parseResetTokenFromHash(`token=${rawToken}`) : null;
    const [status, setStatus] = useState<LinkStatus>(token ? 'checking' : 'invalid');
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [serverError, setServerError] = useState<string | null>(null);
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    // Chỉ kiểm tra link, chưa làm link mất hiệu lực (backend tiêu thụ token lúc đặt mật khẩu)
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
                if (!cancelled) setStatus(err.code === PASSWORD_RESET_ERROR_CODES.INVALID_TOKEN ? 'invalid' : 'network-error');
            });
        return () => {
            cancelled = true;
        };
    }, [token, attempt]);

    // Backend đã thu hồi mọi phiên: xoá token đang lưu trên máy rồi về màn đăng nhập
    const finish = (notice: string) => {
        sessionStore.clearTokens();
        useAuthStore.getState().clearSession();
        Alert.alert('Đặt lại mật khẩu', notice, [{ text: 'Đăng nhập', onPress: () => router.replace('/login') }]);
    };

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) return;
        setServerError(null);
        try {
            await authApi.confirmPasswordReset({ token, ...data });
            finish(SUCCESS_NOTICE);
        } catch (err) {
            const error = err as ApiErrorResponse;
            if (error.code === PASSWORD_RESET_ERROR_CODES.INVALID_TOKEN) setStatus('invalid');
            else if (error.code === PASSWORD_RESET_ERROR_CODES.SESSION_REVOKE_FAILED) finish(PARTIAL_NOTICE);
            else if (error.status === 0) setServerError('Không kết nối được máy chủ. Mật khẩu chưa bị thay đổi, hãy thử lại.');
            else if (error.code === PASSWORD_RESET_ERROR_CODES.SAME_PASSWORD) setServerError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
            else if (error.code === PASSWORD_RESET_ERROR_CODES.INVALID_PASSWORD || error.code === PASSWORD_RESET_ERROR_CODES.PASSWORD_MISMATCH)
                setServerError('Mật khẩu mới chưa hợp lệ. Hãy kiểm tra lại rồi gửi lại.');
            else setServerError(error.message || 'Chưa đổi được mật khẩu. Vui lòng thử lại.');
        }
    };

    return (
        <Screen edges={['bottom']}>
            <Mascot />
            <AppText variant="lead">Chọn mật khẩu mới cho tài khoản Memio của bạn.</AppText>

            {status === 'checking' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} accessibilityLiveRegion="polite">
                    <ActivityIndicator color={colors.brand} />
                    <AppText variant="body">Đang kiểm tra liên kết…</AppText>
                </View>
            ) : null}

            {status === 'invalid' ? (
                <>
                    <AppText variant="body" style={{ color: colors.danger }}>Liên kết không hợp lệ, đã hết hạn hoặc đã được dùng.</AppText>
                    <AppText variant="small">Để nhận liên kết mới, bạn có thể gửi lại yêu cầu khôi phục mật khẩu.</AppText>
                    <Button title="Yêu cầu liên kết mới" onPress={() => router.replace('/forgot-password')} />
                </>
            ) : null}

            {status === 'network-error' ? (
                <>
                    <AppText variant="body" style={{ color: colors.danger }}>Không kiểm tra được liên kết. Hãy kiểm tra kết nối mạng.</AppText>
                    <Button
                        title="Thử lại"
                        variant="secondary"
                        onPress={() => {
                            setStatus('checking');
                            setAttempt((value) => value + 1);
                        }}
                    />
                </>
            ) : null}

            {status === 'ready' ? (
                <>
                    {maskedEmail ? <AppText variant="body">Tài khoản: {maskedEmail}</AppText> : null}
                    {(['newPassword', 'confirmPassword'] as const).map((name) => (
                        <Controller
                            key={name}
                            control={control}
                            name={name}
                            render={({ field }) => (
                                <TextField
                                    label={name === 'newPassword' ? 'Mật khẩu mới' : 'Nhập lại mật khẩu mới'}
                                    value={field.value}
                                    onChangeText={field.onChange}
                                    onBlur={field.onBlur}
                                    error={errors[name]?.message}
                                    secureTextEntry
                                    autoComplete="new-password"
                                    textContentType="newPassword"
                                />
                            )}
                        />
                    ))}
                    <AppText variant="small">Từ 8 ký tự trở lên.</AppText>
                    {serverError ? <AppText variant="small" style={{ color: colors.danger }} accessibilityRole="alert">{serverError}</AppText> : null}
                    <Button title="Đặt mật khẩu mới" loading={isSubmitting} onPress={() => void handleSubmit(onSubmit)()} />
                </>
            ) : null}
        </Screen>
    );
}
