import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, "Vui lòng nhập tên người dùng.")
      .min(3, "Tên người dùng phải có ít nhất 3 ký tự."),
    email: z
      .string()
      .min(1, "Vui lòng nhập email của bạn.")
      .email("Địa chỉ email không đúng định dạng."),
    password: z.string(),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email của bạn.")
    .email("Địa chỉ email không đúng định dạng."),
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
