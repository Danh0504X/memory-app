import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { registerHooks } from 'node:module';

const shared = {};
const native = {};
let auth = { isAuthenticated: false, user: null };
const listeners = [];
globalThis.__guestNumberShared = shared;
globalThis.__guestNumberNative = native;
globalThis.__guestNumberAuth = { getState: () => auth, subscribe: (listener) => listeners.push(listener) };
registerHooks({ resolve(specifier, context, next) {
    if (specifier === '@/features/shared-game/api/games.api' && context.parentURL?.endsWith('/api/guestNumbers.api.ts')) {
        return { url: 'data:text/javascript,export const gamesApi = globalThis.__guestNumberShared;', shortCircuit: true };
    }
    if (context.parentURL?.endsWith('/api/numbers.api.ts')) {
        if (specifier === '@/lib/api-client') return { url: 'data:text/javascript,export const apiClient = globalThis.__guestNumberNative;', shortCircuit: true };
        if (specifier === '@/features/auth/store/authStore') return { url: 'data:text/javascript,export const useAuthStore = globalThis.__guestNumberAuth;', shortCircuit: true };
        if (specifier === './guestNumbers.api') return { url: new URL('../src/features/numbers-game/api/guestNumbers.api.ts', import.meta.url).href, shortCircuit: true };
    }
    return next(specifier, context);
} });
const { guestNumbersApi } = await import('../src/features/numbers-game/api/guestNumbers.api.ts');
const { numbersApi } = await import('../src/features/numbers-game/api/numbers.api.ts');
const digits = ['0', '0', '1', '2', '3', '4', '5', '6'];
const started = () => ({ sessionId: 'guest-round', gameName: 'number', status: 'memorizing',
    rules: { mode: 'level', gameLevel: 1, totalItems: 8, memorizeLimitSec: 60, recallLimitSec: 300 },
    items: digits.map((code) => ({ code })), serverNow: '2000-01-01T00:00:00Z', memorizeDeadline: '2000-01-01T00:01:00Z' });
const completed = () => ({ ...started(), status: 'completed', completedAt: new Date().toISOString(), rewards: null,
    unlockedLevel: { before: 1, after: 2 }, result: { result: 'perfect', correctItems: 8, totalItems: 8, accuracy: 1, memorizeSec: 10, recallSec: 20,
        perItem: digits.map((code) => ({ expected: { code }, answer: { code }, correct: true })) } });
const changeOwner = (next) => { const previous = auth; auth = next; for (const listener of listeners) listener(next, previous); };
beforeEach(() => {
    guestNumbersApi.clear();
    changeOwner({ isAuthenticated: false, user: null });
    native.get = native.post = native.put = async () => { throw new Error('Guest must not call the account-only Numbers API'); };
    shared.startRound = async () => ({ data: { session: started() } });
    shared.startRecall = async () => ({ data: { session: { ...started(), status: 'recalling', serverNow: '2000-01-01T00:01:00Z', recallDeadline: '2000-01-01T00:06:00Z' } } });
    shared.submitRound = async () => ({ data: { session: completed() } });
    shared.getGames = async () => ({ data: { games: [{ gameName: 'number', player: { unlockedLevel: 2 }, levels: [{ itemCount: 8 }, { itemCount: 12 }] }] } });
});

test('guest Numbers uses the shared API from create through recall and server-graded completion', async () => {
    let setup;
    shared.startRound = async (body) => { setup = body; return { data: { session: started() } }; };
    const source = await numbersApi.create({ mode: 'practice', level: 1, memorizeSeconds: 60, prepareRecall: true });
    assert.deepEqual(setup, { gameName: 'number', mode: 'level', gameLevel: 1, memorizeSec: 60 });
    assert.deepEqual(source.digits, digits);
    const recall = await numbersApi.recall(source.id);
    assert.equal(recall.phase, 'recalling');
    assert.equal(recall.digits, undefined);
    const saved = await numbersApi.save(source.id, recall.revision, digits);
    shared.submitRound = async (id, answers) => {
        assert.equal(id, source.id);
        assert.deepEqual(answers, digits);
        return { data: { session: completed() } };
    };
    const result = await numbersApi.submit(source.id, saved.revision, digits);
    assert.equal(result.phase, 'completed');
    assert.equal(result.result.correctCount, 8);
    assert.equal(result.completedRound.rewards, null);
    assert.equal(result.completedRound.unlockedLevel.after, 2);
    assert.equal(result.comparison[0].expected, '0');
});

test('guest drafts retain revision checks, copies and leading zeros without network autosaves', async () => {
    const round = await numbersApi.create({ mode: 'practice', level: 1 });
    const recall = await numbersApi.recall(round.id);
    const saved = await numbersApi.save(round.id, recall.revision, digits);
    saved.answers[0] = '9';
    assert.equal((await numbersApi.get(round.id)).answers[0], '0');
    await assert.rejects(numbersApi.save(round.id, recall.revision, digits), (error) => error.code === 'REVISION_CONFLICT');
    await assert.rejects(numbersApi.save(round.id, saved.revision, ['00', ...digits.slice(1)]), (error) => error.status === 400);
});

test('failed guest submit keeps the draft and retry returns the complete result without local EXP', async () => {
    const round = await numbersApi.create({ mode: 'practice', level: 1 });
    const recall = await numbersApi.recall(round.id);
    const saved = await numbersApi.save(round.id, recall.revision, digits);
    shared.submitRound = async () => { throw { status: 0 }; };
    await assert.rejects(numbersApi.submit(round.id, saved.revision, digits));
    assert.deepEqual((await numbersApi.get(round.id)).answers, digits);
    let submits = 0;
    shared.submitRound = async () => { submits++; return { data: { session: completed() } }; };
    await numbersApi.submit(round.id, saved.revision, digits);
    const repeated = await numbersApi.submit(round.id, saved.revision, digits);
    assert.equal(submits, 1);
    assert.equal(repeated.completedRound.rewards, null);
});

test('guest progress comes from the cookie-owned catalog and daily challenge stays account-only', async () => {
    assert.deepEqual(await numbersApi.progress(), { unlockedLevel: 2, digitCounts: [8, 12], todayChallenge: { played: false } });
    shared.startRound = async () => { throw new Error('Must not start a challenge'); };
    await assert.rejects(numbersApi.create({ mode: 'challenge' }), (error) => error.status === 401 && error.code === 'AUTH_REQUIRED');
});

test('guest custom games send count and custom times through the shared contract', async () => {
    shared.startRound = async (body) => {
        assert.deepEqual(body, { gameName: 'number', mode: 'custom', itemCount: 8, memorizeSec: 20, recallSec: 90 });
        return { data: { session: { ...started(), rules: { ...started().rules, gameLevel: null, mode: 'custom', memorizeLimitSec: 20, recallLimitSec: 90 } } } };
    };
    const result = await numbersApi.create({ mode: 'practice', digitCount: 8, memorizeSeconds: 20, recallSeconds: 90 });
    assert.equal(result.level, null);
    assert.equal(result.recallSeconds, 90);
});

test('account owners keep the native Numbers transport and cannot inherit guest drafts', async () => {
    const guest = await numbersApi.create({ mode: 'practice', level: 1 });
    changeOwner({ isAuthenticated: true, user: { _id: 'account' } });
    native.post = async (path) => { assert.equal(path, '/numbers/sessions'); return { data: { id: 'account-round' } }; };
    assert.equal((await numbersApi.create({ mode: 'practice', level: 1 })).id, 'account-round');
    changeOwner({ isAuthenticated: false, user: null });
    await assert.rejects(numbersApi.get(guest.id), (error) => error.status === 404);
});

test('a guest create response arriving after login cannot recreate the old guest session', async () => {
    let finish;
    shared.startRound = () => new Promise((resolve) => { finish = resolve; });
    const pending = numbersApi.create({ mode: 'practice', level: 1 });
    changeOwner({ isAuthenticated: true, user: { _id: 'account' } });
    finish({ data: { session: started() } });
    await assert.rejects(pending, (error) => error.code === 'SESSION_CLOSED');
});
