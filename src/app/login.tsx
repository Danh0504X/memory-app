import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { authApi } from '@/features/auth/api/auth.api';
import { AuthHeader, FormError, TextLink } from '@/features/auth/components/AuthParts';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/auth.schema';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { ApiErrorResponse } from '@/types/auth.types';

export default function LoginScreen() {
    const saveSession = useAuthStore((state) => state.saveSession);
    const [serverError, setServerError] = useState<string | null>(null);
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async ({ email, password }: LoginFormData) => {
        setServerError(null);
        try {
            const response = await authApi.login({ email, password });
            saveSession(response.data.userInfo);
            router.dismissTo('/');
        } catch (error) {
            setServerError((error as ApiErrorResponse).message);
        }
    };

    return (
        <Screen edges={['bottom']}>
            <AuthHeader title="Chào mừng trở lại!" line="Đăng nhập để lưu EXP, kỷ lục và chuỗi ngày." />
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
                    />
                )}
            />
            <Controller
                control={control}
                name="password"
                render={({ field }) => (
                    <TextField
                        label="Mật khẩu"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.password?.message}
                        secureTextEntry
                        autoComplete="current-password"
                        textContentType="password"
                        onSubmitEditing={() => void handleSubmit(onSubmit)()}
                    />
                )}
            />
            <TextLink label="Quên mật khẩu?" align="right" onPress={() => router.push('/forgot-password')} />
            <FormError>{serverError}</FormError>
            <Button title="Đăng nhập" loading={isSubmitting} onPress={() => void handleSubmit(onSubmit)()} />
            <TextLink lead="Chưa có tài khoản?" label="Tạo tài khoản" onPress={() => router.replace('/register')} />
        </Screen>
    );
}
