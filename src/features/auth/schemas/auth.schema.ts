import { z } from 'zod';

const emailField = z
    .string()
    .min(1, 'Vui lòng nhập email của bạn.')
    .email('Địa chỉ email không đúng định dạng.');

const passwordField = z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu.')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')
    .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.')
    .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số.');

const usernameField = z
    .string()
    .min(1, 'Vui lòng nhập tên người dùng.')
    .min(3, 'Tên người dùng phải có ít nhất 3 ký tự.');

// Hiển thị cạnh ô mật khẩu khi đăng ký, khớp với passwordField ở trên
export const passwordRules = [
    { label: 'Ít nhất 8 ký tự', test: (value: string) => value.length >= 8 },
    { label: '1 chữ viết hoa', test: (value: string) => /[A-Z]/.test(value) },
    { label: '1 chữ số', test: (value: string) => /[0-9]/.test(value) },
];

export const registerSchema = z.object({
    username: usernameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z
        .string()
        .min(1, 'Vui lòng nhập lại mật khẩu.'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
});

export const loginSchema = z.object({
    email: emailField,
    password: passwordField,
    rememberMe: z.boolean().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
