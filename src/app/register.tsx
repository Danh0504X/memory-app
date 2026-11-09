import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { authApi } from '@/features/auth/api/auth.api';
import { AuthHeader, FormError, TextLink } from '@/features/auth/components/AuthParts';
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/auth.schema';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { ApiErrorResponse } from '@/types/auth.types';

const FIELDS = [
    { name: 'username', label: 'Tên hiển thị', props: { autoComplete: 'name', textContentType: 'name' } },
    { name: 'email', label: 'Email', props: { autoCapitalize: 'none', autoComplete: 'email', keyboardType: 'email-address', textContentType: 'emailAddress' } },
    { name: 'password', label: 'Mật khẩu', props: { secureTextEntry: true, autoComplete: 'new-password', textContentType: 'newPassword' } },
    { name: 'confirmPassword', label: 'Nhập lại mật khẩu', props: { secureTextEntry: true, autoComplete: 'new-password', textContentType: 'newPassword' } },
] as const;

export default function RegisterScreen() {
    const saveSession = useAuthStore((state) => state.saveSession);
    const [serverError, setServerError] = useState<string | null>(null);
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
    });

    // Tạo tài khoản xong thì đăng nhập luôn, không bắt người dùng gõ lại email và mật khẩu
    const onSubmit = async ({ username, email, password }: RegisterFormData) => {
        setServerError(null);
        try {
            await authApi.register({ username, email, password });
            const response = await authApi.login({ email, password });
            saveSession(response.data.userInfo);
            router.dismissTo('/');
        } catch (error) {
            setServerError((error as ApiErrorResponse).message);
        }
    };

    return (
        <Screen edges={['bottom']}>
            <AuthHeader title="Tạo tài khoản" line="Miễn phí. Lưu tiến độ và mở thử thách mỗi ngày." tint="#fff3cf" />
            {FIELDS.map(({ name, label, props }) => (
                <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field }) => (
                        <TextField
                            label={label}
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            error={errors[name]?.message}
                            {...props}
                        />
                    )}
                />
            ))}
            <FormError>{serverError}</FormError>
            <Button title="Tạo tài khoản" loading={isSubmitting} onPress={() => void handleSubmit(onSubmit)()} />
            <TextLink lead="Tạo tài khoản là bạn đồng ý với" label="Chính sách quyền riêng tư" onPress={() => router.push('/privacy')} />
            <TextLink lead="Đã có tài khoản?" label="Đăng nhập" onPress={() => router.replace('/login')} />
        </Screen>
    );
}
