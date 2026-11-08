import { z } from "zod";

const emailField = z
  .string()
  .min(1, "Vui lòng nhập email của bạn.")
  .email("Địa chỉ email không đúng định dạng.");

const passwordField = z.string();

const usernameField = z.string();

// Hiển thị cạnh ô mật khẩu khi đăng ký, khớp với passwordField ở trên
export const passwordRules: { label: string; test: (value: string) => boolean }[] = [];

export const registerSchema = z
  .object({
    username: usernameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
  rememberMe: z.boolean().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
