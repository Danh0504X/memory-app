import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/constants/theme';
import { authApi } from '@/features/auth/api/auth.api';
import { changePasswordSchema, setPasswordSchema, type ChangePasswordFormData } from '@/features/auth/schemas/auth.schema';
import { useAuthStore } from '@/features/auth/store/authStore';
import { sessionStore } from '@/lib/session';
import type { ApiErrorResponse } from '@/types/auth.types';

// Tài khoản đã có mật khẩu: nhập mật khẩu hiện tại rồi đổi.
// Tài khoản Google chưa có mật khẩu: đặt mật khẩu lần đầu, không có ô mật khẩu hiện tại.
// Backend thu hồi mọi phiên sau khi đổi, nên app xoá token đã lưu và đưa về màn đăng nhập.
export function ChangePasswordScreen() {
    const hasPassword = useAuthStore((state) => state.user?.hasPassword !== false);
    const clearSession = useAuthStore((state) => state.clearSession);
    const [serverError, setServerError] = useState<string | null>(null);
    const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(hasPassword ? changePasswordSchema : setPasswordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    const onSubmit = async (data: ChangePasswordFormData) => {
        setServerError(null);
        try {
            await authApi.changePassword(hasPassword ? data : { newPassword: data.newPassword, confirmPassword: data.confirmPassword });
            sessionStore.clearTokens();
            clearSession();
            Alert.alert('Đã đổi mật khẩu', 'Vui lòng đăng nhập lại bằng mật khẩu mới.', [{ text: 'Đăng nhập', onPress: () => router.replace('/login') }]);
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            // Lỗi gắn với một ô (vd. mật khẩu hiện tại sai) thì hiện ngay dưới ô đó
            const field = (apiError.errors?.[0] as { field?: keyof ChangePasswordFormData } | undefined)?.field;
            if (field) setError(field, { message: apiError.message });
            else setServerError(apiError.message || 'Không đổi được mật khẩu. Vui lòng thử lại.');
        }
    };

    const fields: { name: keyof ChangePasswordFormData; label: string; autoComplete: 'current-password' | 'new-password' }[] = [
        ...(hasPassword ? [{ name: 'currentPassword' as const, label: 'Mật khẩu hiện tại', autoComplete: 'current-password' as const }] : []),
        { name: 'newPassword', label: 'Mật khẩu mới', autoComplete: 'new-password' },
        { name: 'confirmPassword', label: 'Nhập lại mật khẩu mới', autoComplete: 'new-password' },
    ];

    return (
        <Screen edges={['bottom']}>
            <AppText variant="lead">
                {hasPassword
                    ? 'Đổi mật khẩu sẽ đăng xuất bạn khỏi mọi thiết bị.'
                    : 'Bạn đang đăng nhập bằng Google. Đặt mật khẩu để đăng nhập được bằng email nữa.'}
            </AppText>
            {fields.map(({ name, label, autoComplete }) => (
                <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field }) => (
                        <TextField
                            label={label}
                            value={field.value ?? ''}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            error={errors[name]?.message}
                            secureTextEntry
                            autoComplete={autoComplete}
                            textContentType={autoComplete === 'current-password' ? 'password' : 'newPassword'}
                        />
                    )}
                />
            ))}
            <AppText variant="small">Từ 8 ký tự trở lên.</AppText>
            {serverError ? <AppText variant="small" style={{ color: colors.danger }} accessibilityRole="alert">{serverError}</AppText> : null}
            <Button title={hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'} loading={isSubmitting} onPress={() => void handleSubmit(onSubmit)()} />
        </Screen>
    );
}
