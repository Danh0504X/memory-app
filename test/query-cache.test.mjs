import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
import { resolve as resolvePath } from 'node:path';
import { pathToFileURL } from 'node:url';

registerHooks({
    resolve(specifier, context, next) {
        if (specifier.startsWith('@/')) return { url: pathToFileURL(resolvePath('src', `${specifier.slice(2)}.ts`)).href, shortCircuit: true };
        return next(specifier, context);
    },
});
const { clearQueries, fetchQuery, peekQuery, setQuery, setQueryOwner } = await import('../src/lib/queryCache.ts');

test('dữ liệu đã tải chỉ thuộc về tài khoản đã tải nó', () => {
    clearQueries();
    setQueryOwner('a');
    setQuery('daily-challenge', { me: 'a' });
    setQueryOwner('b');
    assert.equal(peekQuery('daily-challenge'), undefined);
    setQueryOwner('a');
    assert.deepEqual(peekQuery('daily-challenge'), { me: 'a' });
});

test('request của tài khoản cũ về muộn sau khi đổi tài khoản không lọt sang tài khoản mới', async () => {
    clearQueries();
    setQueryOwner('a');
    let finish;
    const pending = fetchQuery('daily-challenge', () => new Promise((resolve) => (finish = resolve)));

    // Đăng xuất rồi đăng nhập tài khoản b trong lúc request của a còn đang chạy
    clearQueries();
    setQueryOwner('b');
    finish({ me: 'a' });
    await pending;

    assert.equal(peekQuery('daily-challenge'), undefined);
    const fresh = await fetchQuery('daily-challenge', async () => ({ me: 'b' }));
    assert.deepEqual(fresh, { me: 'b' });
});

test('đăng xuất về khách dùng ngăn riêng của khách', () => {
    clearQueries();
    setQueryOwner('a');
    setQuery('profile', { name: 'A' });
    setQueryOwner(null);
    assert.equal(peekQuery('profile'), undefined);
});
