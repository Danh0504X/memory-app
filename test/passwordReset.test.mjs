import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../src/features/auth/schemas/auth.schema.ts';
import { maskEmail } from '../src/features/auth/utils/maskEmail.ts';
import { parseResetTokenFromHash } from '../src/features/auth/utils/resetToken.ts';

const TOKEN = 'A'.repeat(21) + 'b_-'.repeat(7) + 'Z'; // 43 ký tự base64url

test('maskEmail hides the middle of the local part and keeps the domain', () => {
    assert.equal(maskEmail('learner@example.com'), 'l***r@example.com');
    assert.equal(maskEmail('ab@example.com'), 'a***@example.com');
    assert.equal(maskEmail('not-an-email'), '***');
});

test('reset token is read only from a well-formed fragment', () => {
    assert.equal(TOKEN.length, 43);
    assert.equal(parseResetTokenFromHash(`#token=${TOKEN}`), TOKEN);
    assert.equal(parseResetTokenFromHash(`token=${TOKEN}`), TOKEN);
    assert.equal(parseResetTokenFromHash(''), null);
    assert.equal(parseResetTokenFromHash('#token='), null);
    assert.equal(parseResetTokenFromHash('#token=short'), null);
    assert.equal(parseResetTokenFromHash(`#other=${TOKEN}`), null);
    assert.equal(parseResetTokenFromHash(`#token=${TOKEN}x`), null);
});

test('reset password schema mirrors the backend rules', () => {
    const ok = resetPasswordSchema.safeParse({ newPassword: 'long-enough-1', confirmPassword: 'long-enough-1' });
    assert.equal(ok.success, true);

    const short = resetPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' });
    assert.equal(short.success, false);

    const tooLong = resetPasswordSchema.safeParse({ newPassword: 'é'.repeat(37), confirmPassword: 'é'.repeat(37) });
    assert.equal(tooLong.success, false);

    const mismatch = resetPasswordSchema.safeParse({ newPassword: 'long-enough-1', confirmPassword: 'long-enough-2' });
    assert.equal(mismatch.success, false);
    assert.deepEqual(mismatch.error?.issues[0]?.path, ['confirmPassword']);

    const empty = resetPasswordSchema.safeParse({ newPassword: 'long-enough-1', confirmPassword: '' });
    assert.equal(empty.success, false);
});

test('change password schema validates current password, length, match, and non-identical new password', () => {
    const ok = changePasswordSchema.safeParse({
        currentPassword: 'old-password-1',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-1',
    });
    assert.equal(ok.success, true);

    const missingCurrent = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-1',
    });
    assert.equal(missingCurrent.success, false);

    const sameAsOld = changePasswordSchema.safeParse({
        currentPassword: 'same-password-1',
        newPassword: 'same-password-1',
        confirmPassword: 'same-password-1',
    });
    assert.equal(sameAsOld.success, false);
    assert.deepEqual(sameAsOld.error?.issues[0]?.path, ['newPassword']);

    const mismatch = changePasswordSchema.safeParse({
        currentPassword: 'old-password-1',
        newPassword: 'new-password-1',
        confirmPassword: 'mismatch-pass-1',
    });
    assert.equal(mismatch.success, false);
    assert.deepEqual(mismatch.error?.issues[0]?.path, ['confirmPassword']);
});

test('forgot password schema requires a valid email', () => {
    assert.equal(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success, true);
    assert.equal(forgotPasswordSchema.safeParse({ email: '' }).success, false);
    assert.equal(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success, false);
});
