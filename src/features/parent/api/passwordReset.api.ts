import { apiClient } from '@/lib/api-client';
import type { MessageResponse, PasswordResetValidateResponse } from '@/types/auth.types';

// Separate endpoints: a parent reset token cannot reset a child's password.
export const parentPasswordResetApi = {
    forgot: (email: string) => apiClient.post('/parent/password-reset/forgot', { email }) as unknown as Promise<MessageResponse>,
    validate: (token: string) => apiClient.post('/parent/password-reset/validate', { token }) as unknown as Promise<PasswordResetValidateResponse>,
    confirm: (body: { token: string; newPassword: string; confirmPassword: string }) =>
        apiClient.post('/parent/password-reset/confirm', body) as unknown as Promise<MessageResponse>,
};
