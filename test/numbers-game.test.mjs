import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { registerHooks } from 'node:module';

// Chỉ thay adapter API trong unit test. Luồng trình duyệt dùng API/MongoDB thật.
const memoryStorage = () => {
    const entries = new Map();
    return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) };
};
Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage(), configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: memoryStorage(), configurable: true });
globalThis.window = new EventTarget();
window.localStorage = localStorage;
const api = {};
globalThis.__numberTestApi = api;
registerHooks({ resolve(specifier, context, nextResolve) {
    if (specifier === '../../shared-game/completion.ts') {
        return { url: 'data:text/javascript,export const synchronizeRoundCompletion = () => {};', shortCircuit: true };
    }
    if (specifier === '../api/numbers.api' && context.parentURL?.endsWith('/store/numbersGameStore.ts')) {
        return { url: 'data:text/javascript,export const numbersApi = globalThis.__numberTestApi;', shortCircuit: true };
    }
    return nextResolve(specifier, context);
} });
const { useNumbersGameStore: store } = await import('../src/features/numbers-game/store/numbersGameStore.ts');
const { getDigitGroups, isValidGroups } = await import('../src/features/numbers-game/utils/numberUtils.ts');
const state = () => store.getState();
const waitFor = (condition) => {
    if (condition()) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { unsubscribe(); reject(new Error('State did not settle')); }, 2000);
        const unsubscribe = store.subscribe(() => { if (condition()) { clearTimeout(timeout); unsubscribe(); resolve(); } });
    });
};
let server;
let calls;
let owner = 0;
const timestamp = (offset) => new Date(Date.now() + offset).toISOString();
const response = (change = {}) => {
    server = { ...server, ...change, serverNow: timestamp(0) };
    return structuredClone(server);
};
const setup = async () => {
    calls = { create: 0, save: 0, submit: 0 };
    Object.assign(api, {
        progress: async () => ({ unlockedLevel: 1, digitCounts: [8, 12, 18, 24, 30, 40, 50, 60, 70, 80] }),
        create: async (settings) => {
            calls.create++;
            server = { ...settings, id: 'a'.repeat(24), level: settings.level ?? null, digitCount: 4,
                phase: 'memorizing', revision: 0, memorizeSeconds: 60, recallSeconds: 120,
                digits: ['0', '1', '2', '3'], startedAt: timestamp(0), memorizeEndsAt: timestamp(60000),
                recallStartedAt: null, recallEndsAt: null, completedAt: null, completionReason: null, memorizeUsedMs: null };
            return response();
        },
        get: async () => response(),
        recall: async () => response({ phase: 'preparing_recall', digits: undefined, revision: server.revision + 1, recallStartedAt: timestamp(65000), recallEndsAt: timestamp(185000) }),
        ready: async () => response({ phase: 'recalling', answers: Array(4).fill(null), revision: server.revision + 1, recallStartedAt: timestamp(0), recallEndsAt: timestamp(120000) }),
        save: async (_id, revision, answers) => {
            calls.save++; assert.equal(revision, server.revision);
            return response({ answers, revision: revision + 1 });
        },
        submit: async (_id, revision, answers) => {
            calls.submit++; assert.equal(revision, server.revision);
            return response({ phase: 'completed', answers, revision: revision + 1, completedAt: timestamp(0), completionReason: 'submitted' });
        },
    });
    state().initialize(`unit-${++owner}`);
    await waitFor(() => !state().busy);
    state().setPreferences({ groups: '3', hideTimer: false, prepTime: 0 });
};
const startRecall = async () => {
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    state().begin(); await waitFor(() => !state().busy);
    state().recall(); await waitFor(() => !state().busy);
    state().ready(); await waitFor(() => !state().busy);
};
afterEach(() => state().dispose());

test('group patterns repeat and preserve leading zeros and the final short group', () => {
    assert.equal(isValidGroups('3 2'), true);
    for (const pattern of ['', '0', '10', '-1', '3x']) assert.equal(isValidGroups(pattern), false);
    assert.deepEqual(getDigitGroups(['0','1','2','3','4','5','6','7','8'], '3 2'), [
        { start: 0, digits: ['0','1','2'] }, { start: 3, digits: ['3','4'] },
        { start: 5, digits: ['5','6','7'] }, { start: 8, digits: ['8'] },
    ]);
});

test('preparation does not create a session until begin; duplicate begin creates once', async () => {
    await setup();
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    assert.equal(calls.create, 0);
    state().begin(); state().begin();
    await waitFor(() => !state().busy);
    assert.equal(calls.create, 1);
    assert.equal(state().session.digits[0], '0');
    state().recall();
    assert.equal(state().hidden, true);
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'preparing_recall');
    assert.equal(state().session.digits, undefined);
});

test('submit waits for autosave, includes newer edits and ignores double submit', async () => {
    await setup(); await startRecall();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const save = api.save;
    api.save = async (...args) => { calls.started = true; store.setState({ saving: true }); await gate; return save(...args); };
    state().edit(['0', null, null, null]); state().save();
    await waitFor(() => calls.started);
    state().edit(['0', '4', null, null]);
    state().submit(); state().submit();
    assert.equal(calls.submit, 0);
    release();
    await waitFor(() => !state().busy && !state().saving);
    assert.equal(calls.submit, 1);
    assert.deepEqual(server.answers, ['0', '4', null, null]);
    assert.equal(state().session.phase, 'completed');
});

test('revision conflict fetches current revision without replacing local answers', async () => {
    await setup(); await startRecall();
    let first = true;
    const save = api.save;
    api.save = async (...args) => {
        if (first) { first = false; server.revision += 1; throw { status: 409, code: 'REVISION_CONFLICT' }; }
        return save(...args);
    };
    state().edit(['0', '9', null, null]); state().save();
    await waitFor(() => !state().saving);
    assert.deepEqual(state().answers, ['0', '9', null, null]);
    assert.deepEqual(server.answers, state().answers);
    assert.equal(state().dirty, false);
    assert.equal(state().error, null);
});

test('API failure keeps answers dirty; explicit retry saves them', async () => {
    await setup(); await startRecall();
    const save = api.save;
    api.save = async () => { throw { status: 0 }; };
    state().edit(['0', '0', null, null]); state().save();
    await waitFor(() => !state().saving);
    assert.equal(state().dirty, true);
    assert.match(state().error, /thử lại/);
    assert.deepEqual(state().answers, ['0', '0', null, null]);
    api.save = save; state().save();
    await waitFor(() => !state().saving);
    assert.equal(state().dirty, false);
    assert.equal(state().error, null);
});

test('initialize always starts with null session for settings home and clears session storage', async () => {
    await setup(); await startRecall();
    state().edit(['0', '1', '2', '3']); state().save();
    await waitFor(() => !state().saving);
    const account = `unit-${owner}`;
    state().dispose();
    assert.equal(sessionStorage.getItem(`memio:number-session:${account}`), null);
    state().initialize(account);
    await waitFor(() => !state().busy);
    assert.equal(state().session, null);
    assert.deepEqual(state().answers, []);
    assert.ok(state().progress !== null);
    const saved = JSON.parse(localStorage.getItem('memio-number-preferences'));
    assert.deepEqual(Object.keys(saved.state), ['preferences']);
    state().initialize('another-account');
    await waitFor(() => !state().busy);
    assert.equal(state().session, null);
});

test('initialize restores cached progress immediately preventing level 1 flash', async () => {
    const account = `unit-cached-${++owner}`;
    sessionStorage.setItem(`memio:number-progress:${account}`, JSON.stringify({ unlockedLevel: 2, digitCounts: [8, 12, 18, 24, 30, 40, 50, 60, 70, 80] }));
    let releaseGate;
    const gate = new Promise((resolve) => { releaseGate = resolve; });
    const originalProgress = api.progress;
    api.progress = async () => { await gate; return { unlockedLevel: 2, digitCounts: [8, 12, 18, 24, 30, 40, 50, 60, 70, 80] }; };

    state().initialize(account);
    // Before API resolves, progress must ALREADY be unlockedLevel 2 from cache!
    assert.equal(state().progress?.unlockedLevel, 2);
    releaseGate();
    await waitFor(() => !state().busy);
    assert.equal(state().progress?.unlockedLevel, 2);
    api.progress = originalProgress;
});

test('replay creates a fresh session and clears previous answers', async () => {
    await setup(); await startRecall();
    state().edit(['0', '1', '2', '3']); state().submit();
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'completed');
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    state().begin(); await waitFor(() => !state().busy);
    assert.equal(calls.create, 2);
    assert.equal(state().session.phase, 'memorizing');
    assert.deepEqual(state().answers, [null, null, null, null]);
});

test('leaving flushes the latest answers and reports a save failure', async () => {
    await setup(); await startRecall();
    state().edit(['0', '5', null, null]);
    assert.equal(await state().flush(), true);
    assert.deepEqual(server.answers, ['0', '5', null, null]);
    api.save = async () => { throw { status: 0 }; };
    state().edit(['0', '6', null, null]);
    assert.equal(await state().flush(), false);
    assert.deepEqual(state().answers, ['0', '6', null, null]);
    assert.equal(state().busy, false);
});

test('a response from a previous mount cannot replace the new account state', async () => {
    await setup(); await startRecall();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const old = structuredClone(server);
    api.get = async () => { await gate; return old; };
    state().refresh();
    await Promise.resolve();
    state().dispose(); state().initialize('different-account');
    await waitFor(() => !state().busy);
    release();
    await Promise.resolve(); await Promise.resolve();
    assert.equal(state().session, null);
    assert.equal(state().savedSessionId, null);
});

test('transition from prepare to begin preserves inGame state without flicker to settings', async () => {
    await setup();
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    assert.equal(state().isStarting, true);
    assert.ok(state().prepDeadline !== null);
    const inGameBefore = !!state().session || !!state().prepDeadline || state().isStarting;
    assert.equal(inGameBefore, true);

    let releaseCreate;
    const gate = new Promise((resolve) => { releaseCreate = resolve; });
    const originalCreate = api.create;
    api.create = async (...args) => {
        await gate;
        return originalCreate(...args);
    };

    state().begin();
    // While create is in-flight, isStarting must stay true and inGame must remain true
    assert.equal(state().isStarting, true);
    const inGameDuring = !!state().session || !!state().prepDeadline || state().isStarting;
    assert.equal(inGameDuring, true);

    releaseCreate();
    await waitFor(() => !state().busy);
    assert.equal(state().isStarting, false);
    assert.equal(state().prepDeadline, null);
    assert.equal(state().session.phase, 'memorizing');
    const inGameAfter = !!state().session || !!state().prepDeadline || state().isStarting;
    assert.equal(inGameAfter, true);
});

test('memorization deadline gives exact 60 seconds without minus-one cutoff', async () => {
    await setup();
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    state().begin();
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'memorizing');
    const clientNow = Date.now();
    const remainingMs = state().deadline - clientNow;
    // Server gave memorizeSeconds = 60 (60,000ms). Client deadline diff should be ~60000ms.
    assert.ok(remainingMs >= 59900 && remainingMs <= 60100, `Expected ~60000ms but got ${remainingMs}ms`);
});

test('exiting at any phase resets to settings home (inGame = false) without session persistence', async () => {
    // 1. Exit during prep
    await setup();
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    assert.equal(!!state().session || !!state().prepDeadline || state().isStarting, true);
    state().reset();
    await waitFor(() => !state().busy);
    assert.equal(!!state().session || !!state().prepDeadline || state().isStarting, false);
    assert.equal(state().session, null);

    // 2. Exit during memorizing
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    state().begin();
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'memorizing');
    await state().flush();
    state().reset();
    await waitFor(() => !state().busy);
    assert.equal(!!state().session || !!state().prepDeadline || state().isStarting, false);

    // 3. Exit during preparing_recall
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    state().begin();
    await waitFor(() => !state().busy);
    state().recall();
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'preparing_recall');
    state().reset();
    await waitFor(() => !state().busy);
    assert.equal(!!state().session || !!state().prepDeadline || state().isStarting, false);

    // 4. Exit during recalling
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    state().begin();
    await waitFor(() => !state().busy);
    state().recall();
    await waitFor(() => !state().busy);
    state().ready();
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'recalling');
    await state().flush();
    state().reset();
    await waitFor(() => !state().busy);
    assert.equal(!!state().session || !!state().prepDeadline || state().isStarting, false);
});

test('full lifecycle: early finish memorization -> skip prep -> enter recall -> submit', async () => {
    await setup();
    state().prepare({ mode: 'practice', digitCount: 4, prepareRecall: true });
    // Click "Bắt đầu ngay" early
    state().begin();
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'memorizing');

    // Click "Mình đã nhớ xong" early
    state().recall();
    assert.equal(state().hidden, true);
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'preparing_recall');

    // Click "Mình sẵn sàng" (skip preparation)
    state().ready();
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'recalling');

    // Type answers and submit
    state().edit(['0', '1', '2', '3']);
    state().submit();
    await waitFor(() => !state().busy);
    assert.equal(state().session.phase, 'completed');
});

test('challenge mode: progress reports todayChallenge status correctly', async () => {
    await setup();
    api.progress = async () => ({
        unlockedLevel: 1,
        digitCounts: [8, 12, 18, 24, 30, 40, 50, 60, 70, 80],
        todayChallenge: {
            played: true,
            score: 72,
            correctCount: 72,
            digitCount: 80,
            accuracy: 90,
            memorizeUsedMs: 45000,
        },
    });
    state().refresh();
    await waitFor(() => !state().busy);
    assert.equal(state().progress.todayChallenge?.played, true);
    assert.equal(state().progress.todayChallenge?.correctCount, 72);
});

test('memorization stream: groups order left (passed), center (current), right (upcoming)', () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const groups = getDigitGroups(digits, '2'); // 5 groups of 2: [12, 34, 56, 78, 90]
    assert.equal(groups.length, 5);

    // Initial at index 0: center is group 0, left empty, right has 1..4
    let index = 0;
    let passed = groups.slice(Math.max(0, index - 5), index);
    let current = groups[index];
    let upcoming = groups.slice(index + 1, index + 6);
    assert.equal(passed.length, 0);
    assert.equal(current.digits.join(''), '12');
    assert.deepEqual(upcoming.map(g => g.digits.join('')), ['34', '56', '78', '90']);

    // Advance to index 1: group 0 is on left, center is group 1, right has 2..4
    index = 1;
    passed = groups.slice(Math.max(0, index - 5), index);
    current = groups[index];
    upcoming = groups.slice(index + 1, index + 6);
    assert.deepEqual(passed.map(g => g.digits.join('')), ['12']);
    assert.equal(current.digits.join(''), '34');
    assert.deepEqual(upcoming.map(g => g.digits.join('')), ['56', '78', '90']);

    // Step back to index 0: group 1 returns to right, left is empty again
    index = 0;
    passed = groups.slice(Math.max(0, index - 5), index);
    current = groups[index];
    upcoming = groups.slice(index + 1, index + 6);
    assert.equal(passed.length, 0);
    assert.equal(current.digits.join(''), '12');
    assert.deepEqual(upcoming.map(g => g.digits.join('')), ['34', '56', '78', '90']);
});
