import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { registerHooks } from 'node:module';

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
const api = {};
globalThis.__faceTestApi = api;
registerHooks({ resolve(specifier, context, next) {
    if (context.parentURL?.endsWith('/store/faceNameStore.ts')) {
        if (specifier === '../api/faceNameApi') return { url: 'data:text/javascript,export const { fetchLevels, startLevelRound, startFreeRound, submitFaceNameRound } = globalThis.__faceTestApi;', shortCircuit: true };
        if (specifier === '../utils/preloadImages') return { url: 'data:text/javascript,export const preloadImages = async () => {};', shortCircuit: true };
    }
    return next(specifier, context);
} });
Object.assign(api, {
    fetchLevels: () => api.levels(),
    startLevelRound: (...args) => api.start(...args),
    startFreeRound: (...args) => api.free(...args),
    submitFaceNameRound: (...args) => api.submit(...args),
});
const { useFaceNameStore: store } = await import('../src/features/facename-game/store/faceNameStore.ts');
const state = () => store.getState();
const people = [{ id: 1, name: 'Anna', imageUrl: 'anna.svg' }, { id: 2, name: 'Ana', imageUrl: 'ana.svg' }];
const round = { roundId: 'round-1', settings: { faceCount: 2, memorizeSeconds: 60, recallSeconds: 120 }, people };
beforeEach(() => {
    state().goHome();
    storage.clear();
    store.setState({ levels: [], stats: { unlockedLevel: 1, bestScores: {}, totalRounds: 0, totalAccuracies: [], completedLevels: [] } });
    api.levels = async () => [{ levelId: 1, faceCount: 6, memorizeSeconds: 60, recallSeconds: 120, requiredScore: 4, unlockThreshold: 4 / 6 }];
    api.start = async () => structuredClone(round);
    api.free = async () => structuredClone(round);
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
    assert.equal(state().memorizeDeadline - state().roundStartTime, 60_000);
    state().finishMemorize();
    assert.deepEqual(state().recallPeople.map((person) => person.id).sort(), [1, 2]);
    assert.equal(state().phase, 'recall');
});

test('failed submission keeps answers and can be retried without losing the round', async () => {
    await state().startLevelGame(1);
    state().finishMemorize();
    state().updateAnswer(1, 'Anna');
    api.submit = async () => { throw new Error('offline'); };
    await state().submitCurrentRound();
    assert.equal(state().phase, 'recall');
    assert.equal(state().userAnswers[1], 'Anna');
    api.submit = async (_id, answers) => {
        assert.deepEqual(answers, [{ personId: 1, answer: 'Anna' }, { personId: 2, answer: '' }]);
        return { mode: 'level', levelId: 1, isPassed: true, score: 1, accuracy: 50, nextLevelUnlocked: true };
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
    state().finishMemorize();
    api.submit = async () => ({ mode: 'free', isPassed: true, score: 2, accuracy: 100 });
    await state().submitCurrentRound();
    assert.equal(state().stats.unlockedLevel, 1);
    assert.equal(state().stats.totalRounds, 1);
});
