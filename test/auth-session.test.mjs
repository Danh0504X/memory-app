import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';

// Giả SecureStore (sessionStore) và API: kiểm tra authStore giữ phiên khi mất mạng, chỉ đăng xuất khi backend từ chối
const stored = new Map();
globalThis.__session = {
    getRefreshToken: () => stored.get('refresh') ?? null,
    clearTokens: () => stored.delete('refresh'),
    getUser: () => stored.get('user') ?? null,
    setUser: (user) => (user ? stored.set('user', user) : stored.delete('user')),
};
globalThis.__authApi = { refreshToken: async () => { throw new Error('chưa đặt'); } };

const MOCKS = {
    '@/lib/session': 'export const sessionStore = globalThis.__session;',
    '@/lib/api-client': 'export const setSessionHandlers = () => {};',
    '@/lib/queryCache': 'export const clearQueries = () => {};',
    '@/features/auth/api/auth.api': 'export const authApi = globalThis.__authApi;',
};
registerHooks({
    resolve(specifier, context, next) {
        if (context.parentURL?.endsWith('/auth/store/authStore.ts') && MOCKS[specifier]) {
            return { url: `data:text/javascript,${encodeURIComponent(MOCKS[specifier])}`, shortCircuit: true };
        }
        return next(specifier, context);
    },
});
const { useAuthStore } = await import('../src/features/auth/store/authStore.ts');

const USER = { _id: 'u1', username: 'Lan', email: 'lan@example.com' };
const reset = (entries) => {
    stored.clear();
    for (const [key, value] of entries) stored.set(key, value);
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });
};

test('mất mạng khi mở app: vẫn đăng nhập bằng user đã lưu', async () => {
    reset([['refresh', 'r1'], ['user', USER]]);
    globalThis.__authApi.refreshToken = async () => { throw { status: 0, code: 'ERR_NETWORK' }; };
    await useAuthStore.getState().hydrate();
    const state = useAuthStore.getState();
    assert.equal(state.isAuthenticated, true);
    assert.deepEqual(state.user, USER);
    assert.equal(state.isLoading, false);
    assert.deepEqual(stored.get('user'), USER);
});

test('backend từ chối phiên: đăng xuất và xoá user đã lưu', async () => {
    reset([['refresh', 'r1'], ['user', USER]]);
    globalThis.__authApi.refreshToken = async () => { throw { status: 401 }; };
    await useAuthStore.getState().hydrate();
    assert.equal(useAuthStore.getState().isAuthenticated, false);
    assert.equal(stored.has('user'), false);
});

test('refresh thành công: cập nhật và lưu user mới nhất', async () => {
    reset([['refresh', 'r1'], ['user', USER]]);
    const fresh = { ...USER, username: 'Lan Anh' };
    globalThis.__authApi.refreshToken = async () => fresh;
    await useAuthStore.getState().hydrate();
    assert.deepEqual(useAuthStore.getState().user, fresh);
    assert.deepEqual(stored.get('user'), fresh);
});

test('chưa có user đã lưu và mất mạng: tạm là khách nhưng giữ token để thử lại', async () => {
    reset([['refresh', 'r1']]);
    globalThis.__authApi.refreshToken = async () => { throw { status: 0 }; };
    await useAuthStore.getState().hydrate();
    assert.equal(useAuthStore.getState().isAuthenticated, false);
    assert.equal(useAuthStore.getState().isLoading, false);
    assert.equal(stored.get('refresh'), 'r1');
});
