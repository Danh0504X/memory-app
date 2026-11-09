import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';

const calls = [];
let failure;
globalThis.__parentApiClient = Object.fromEntries(['get', 'post', 'patch'].map((method) => [method, async (...args) => {
    calls.push({ method, args });
    if (failure) throw failure;
    return { status: 'success', data: { accepted: true } };
}]));
registerHooks({ resolve(specifier, context, next) {
    if (context.parentURL?.includes('/features/parent/api/') && specifier === '@/lib/api-client') {
        return { url: 'data:text/javascript,export const apiClient = globalThis.__parentApiClient;', shortCircuit: true };
    }
    return next(specifier, context);
} });
const { parentApi } = await import('../src/features/parent/api/parent.api.ts');
const { roomsApi } = await import('../src/features/parent/api/rooms.api.ts');
const { parentPasswordResetApi } = await import('../src/features/parent/api/passwordReset.api.ts');

test('link registration sends only parent details; backend derives child identity from session', async () => {
    const body = { fullname: 'Lan', email: 'lan@example.com', password: 'example123', confirmPassword: 'example123' };
    assert.deepEqual(await parentApi.register(body), { accepted: true });
    assert.deepEqual(calls.at(-1), { method: 'post', args: ['/parent/register', body] });
});

test('reports preserve requested period and date; unset age remains null', async () => {
    await parentApi.report('week', '2026-11-09');
    assert.deepEqual(calls.at(-1).args, ['/parent/report', { params: { period: 'week', date: '2026-11-09' } }]);
    await parentApi.ageGroup(null);
    assert.deepEqual(calls.at(-1).args, ['/parent/age-group', { ageGroup: null }]);
});

test('room actions encode identifiers and preserve zeros, blanks and answer order', async () => {
    const answers = ['0', '0', '7', null, ''];
    await roomsApi.submit('A/B?', answers);
    assert.deepEqual(calls.at(-1), { method: 'post', args: ['/family-rooms/A%2FB%3F/submit', { answers }] });
    for (const action of ['join', 'ready', 'start', 'recall', 'next', 'finish']) {
        await roomsApi[action]('ABC23456');
        assert.equal(calls.at(-1).args[0], `/family-rooms/ABC23456/${action}`);
    }
});

test('API errors including wrong-role and expired-session remain visible to callers', async () => {
    for (const status of [0, 401, 403, 404, 409, 429]) {
        failure = { status, message: 'rejected' };
        await assert.rejects(roomsApi.get('ABC23456'), (error) => error === failure);
    }
    failure = undefined;
});

test('parent password recovery uses isolated endpoints and keeps tokens in request body', async () => {
    await parentPasswordResetApi.forgot('lan@example.com');
    assert.deepEqual(calls.at(-1).args, ['/parent/password-reset/forgot', { email: 'lan@example.com' }]);
    await parentPasswordResetApi.validate('test-token');
    assert.deepEqual(calls.at(-1).args, ['/parent/password-reset/validate', { token: 'test-token' }]);
    const body = { token: 'test-token', newPassword: 'example456', confirmPassword: 'example456' };
    await parentPasswordResetApi.confirm(body);
    assert.deepEqual(calls.at(-1).args, ['/parent/password-reset/confirm', body]);
});
