import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { registerHooks } from 'node:module';

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
const api = {};
globalThis.__faceTestApi = api;
registerHooks({ resolve(specifier, context, next) {
    if (specifier === '../../shared-game/completion.ts') return { url: 'data:text/javascript,export const synchronizeRoundCompletion = () => {};', shortCircuit: true };
    if (context.parentURL?.endsWith('/store/faceNameStore.ts')) {
        if (specifier === '../api/faceNameApi') return { url: 'data:text/javascript,export const { fetchFaceNameSetup, startFaceNameRecall, startLevelRound, startFreeRound, submitFaceNameRound } = globalThis.__faceTestApi;', shortCircuit: true };
        if (specifier === '../utils/preloadImages') return { url: 'data:text/javascript,export const preloadImages = async () => {};', shortCircuit: true };
    }
    return next(specifier, context);
} });
Object.assign(api, {
    fetchFaceNameSetup: async () => ({ levels: await api.levels(), stats: api.stats ?? { unlockedLevel: 1, bestScores: {}, totalRounds: 0, totalAccuracies: [], completedLevels: [] } }),
    startFaceNameRecall: () => api.recall(),
    startLevelRound: (...args) => api.start(...args),
    startFreeRound: (...args) => api.free(...args),
    submitFaceNameRound: (...args) => api.submit(...args),
});
const { useFaceNameStore: store } = await import('../src/features/facename-game/store/faceNameStore.ts');
const state = () => store.getState();
const people = [{ id: 1, name: 'Anna', imageUrl: 'anna.svg' }, { id: 2, name: 'Ana', imageUrl: 'ana.svg' }];
const round = { roundId: 'round-1', settings: { faceCount: 2, memorizeSeconds: 60, recallSeconds: 120 }, people, memorizeDeadline: new Date(Date.now() + 60000).toISOString() };
beforeEach(() => {
    state().goHome();
    storage.clear();
    store.setState({ levels: [], stats: { unlockedLevel: 1, bestScores: {}, totalRounds: 0, totalAccuracies: [], completedLevels: [] } });
    api.levels = async () => [{ levelId: 1, faceCount: 6, memorizeSeconds: 60, recallSeconds: 120, requiredScore: 4, unlockThreshold: 4 / 6 }];
    api.start = async () => structuredClone(round);
    api.free = async () => structuredClone(round);
    api.stats = null;
    api.recall = async () => ({ recallDeadline: new Date(Date.now() + 120000).toISOString() });
});

test('levels come from the API and failure offers an honest retry state', async () => {
    api.levels = async () => { throw new Error('offline'); };
    await state().initialize();
    assert.equal(state().levels.length, 0);
    assert.ok(state().errorMessage);
    assert.equal(state().isLoading, false);
    api.levels = async () => [{ levelId: 1, requiredScore: 4 }];
    await state().initialize();
    assert.equal(state().levels[0].requiredScore, 4);
    assert.equal(state().errorMessage, null);
});

test('level timing uses server settings and recall keeps stable person IDs', async () => {
    await state().startLevelGame(1, 240);
    assert.equal(state().settings.memorizeSeconds, 60);
    assert.equal(state().memorizeDeadline, Date.parse(round.memorizeDeadline));
    await state().finishMemorize();
    assert.deepEqual(state().recallPeople.map((person) => person.id).sort(), [1, 2]);
    assert.equal(state().phase, 'recall');
});

test('failed submission keeps answers and can be retried without losing the round', async () => {
    await state().startLevelGame(1);
    await state().finishMemorize();
    state().updateAnswer(1, 'Anna');
    api.submit = async () => { throw new Error('offline'); };
    await state().submitCurrentRound();
    assert.equal(state().phase, 'recall');
    assert.equal(state().userAnswers[1], 'Anna');
    api.submit = async (_id, answers) => {
        assert.deepEqual(answers, [{ personId: 1, answer: 'Anna' }, { personId: 2, answer: '' }]);
        return { mode: 'level', levelId: 1, isPassed: true, score: 1, accuracy: 50, nextLevelUnlocked: true, unlockedLevel: 2 };
    };
    await state().submitCurrentRound();
    assert.equal(state().phase, 'result');
    assert.equal(state().stats.unlockedLevel, 2);
    assert.equal(state().stats.totalRounds, 1);
    await state().submitCurrentRound();
    assert.equal(state().stats.totalRounds, 1);
});

test('free rounds keep their settings and do not unlock a level', async () => {
    await state().startFreeGame(3, 30, 90);
    await state().finishMemorize();
    api.submit = async () => ({ mode: 'free', isPassed: true, score: 2, accuracy: 100 });
    await state().submitCurrentRound();
    assert.equal(state().stats.unlockedLevel, 1);
    assert.equal(state().stats.totalRounds, 1);
});

test('server progress replaces browser-local progress and failed recall can be retried', async () => {
    api.stats = { unlockedLevel: 3, bestScores: {}, totalRounds: 8, totalAccuracies: [], completedLevels: [1, 2] };
    await state().initialize();
    assert.equal(state().stats.unlockedLevel, 3);
    assert.equal(state().stats.totalRounds, 8);
    await state().startLevelGame(1);
    api.recall = async () => { throw new Error('offline'); };
    await state().finishMemorize();
    assert.equal(state().phase, 'memorize');
    assert.ok(state().errorMessage);
    api.recall = async () => ({ recallDeadline: new Date(Date.now() + 90000).toISOString() });
    await state().finishMemorize();
    assert.equal(state().phase, 'recall');
    assert.equal(state().errorMessage, null);
});

test('a pending round or setup from an old mount cannot replace the next player state', async () => {
    let resolveStart;
    api.start = () => new Promise((resolve) => { resolveStart = resolve; });
    const pending = state().startLevelGame(1);
    state().goHome();
    resolveStart(round);
    await pending;
    assert.equal(state().phase, 'home');
    assert.equal(state().currentRoundId, null);
    let resolveLevels;
    api.levels = () => new Promise((resolve) => { resolveLevels = resolve; });
    const setup = state().initialize();
    state().goHome();
    resolveLevels([]);
    await setup;
    assert.equal(state().isLoading, false);
});
