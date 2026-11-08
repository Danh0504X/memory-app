import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { PASSWORD_RESET_ERROR_CODES, type ApiErrorResponse } from '@/types/auth.types';
import { authApi } from '../api/auth.api';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/auth.schema';

// Gửi link đặt lại mật khẩu qua email. Link mở trang /reset-password của bản web (backend ghép từ CLIENT_URL),
// đặt mật khẩu mới ở đó rồi quay lại app đăng nhập.
export function ForgotPasswordScreen() {
    const [serverError, setServerError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = async ({ email }: ForgotPasswordFormData) => {
        setServerError(null);
        try {
            await authApi.forgotPassword(email);
            setSentTo(email);
        } catch (err) {
            const error = err as ApiErrorResponse;
            if (error.code === PASSWORD_RESET_ERROR_CODES.RATE_LIMITED) setServerError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
            else if (error.code === PASSWORD_RESET_ERROR_CODES.EMAIL_NOT_CONFIGURED) setServerError('Hệ thống chưa thể gửi email lúc này. Vui lòng thử lại sau.');
            else if (error.status === 0) setServerError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng rồi thử lại.');
            else setServerError(error.message || 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
        }
    };

    if (sentTo) {
        return (
            <Screen edges={['bottom']}>
                <View style={{ alignItems: 'center', gap: spacing.sm }}>
                    <MailCheck color={colors.brand} size={48} />
                    <AppText variant="heading">Kiểm tra hộp thư của bạn</AppText>
                </View>
                <AppText variant="body">
                    Nếu email {sentTo} có trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hộp thư của bạn.
                </AppText>
                <AppText variant="small">
                    Mở liên kết trong email (có hiệu lực 15 phút) để đặt mật khẩu mới, rồi quay lại đây đăng nhập. Hãy kiểm tra cả hộp thư rác nếu không thấy email.
                </AppText>
                <Button title="Quay lại đăng nhập" onPress={() => router.replace('/login')} />
                <Button title="Gửi lại" variant="secondary" onPress={() => setSentTo(null)} />
            </Screen>
        );
    }

    return (
        <Screen edges={['bottom']}>
            <AppText variant="lead">Nhập email của tài khoản để nhận liên kết đặt lại mật khẩu.</AppText>
            <Controller
                control={control}
                name="email"
                render={({ field }) => (
                    <TextField
                        label="Email"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.email?.message}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        onSubmitEditing={() => void handleSubmit(onSubmit)()}
                    />
                )}
            />
            {serverError ? <AppText variant="small" style={{ color: colors.danger }} accessibilityRole="alert">{serverError}</AppText> : null}
            <Button title="Gửi liên kết" loading={isSubmitting} onPress={() => void handleSubmit(onSubmit)()} />
        </Screen>
    );
}
