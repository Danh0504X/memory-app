import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accessRedirect, accountHome } from '../src/features/parent/utils/access.ts';
const child = { role: 'user' };
const pending = { role: 'parent', isEmailVerified: false };
const parent = { role: 'parent', isEmailVerified: true };

test('guest cannot enter parent data, linking or family rooms from deep links', () => {
    for (const path of ['/parent', '/parent/profile', '/parent-link', '/family-room', '/family-room/ABC23456']) assert.equal(accessRedirect(path, null), '/login');
    assert.equal(accessRedirect('/games/cards', null), null);
});
test('child cannot read parent data but can link and play with family', () => {
    assert.equal(accessRedirect('/parent/profile', child), '/');
    assert.equal(accessRedirect('/parent-link', child), null);
    assert.equal(accessRedirect('/family-room/ABC23456', child), null);
});
test('pending parent has only pending, password and verification/recovery access', () => {
    for (const path of ['/parent', '/parent/child-profile', '/family-room', '/games/cards', '/login']) assert.equal(accessRedirect(path, pending), '/parent/pending');
    for (const path of ['/parent/pending', '/parent/password', '/parent/verify', '/parent/reset-password']) assert.equal(accessRedirect(path, pending), null);
});
test('verified parent cannot reach child screens or prefix lookalikes', () => {
    for (const path of ['/', '/profile', '/games/words', '/parent-link', '/family-room-fake', '/parent-fake']) assert.equal(accessRedirect(path, parent), '/parent');
    assert.equal(accessRedirect('/parent/pending', parent), '/parent');
    for (const path of ['/parent', '/parent/profile', '/family-room/ABC23456']) assert.equal(accessRedirect(path, parent), null);
});
test('public token routes are available without signing in; homes follow current verification', () => {
    for (const user of [null, child, pending, parent]) for (const path of ['/parent/verify', '/parent/reset-password', '/parent/forgot-password']) assert.equal(accessRedirect(path, user), null);
    assert.equal(accessRedirect('/forgot-password', parent), '/parent/forgot-password');
    assert.equal(accountHome(child), '/'); assert.equal(accountHome(parent), '/parent'); assert.equal(accountHome(pending), '/parent/pending');
});
