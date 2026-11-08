import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';

const api = {};
globalThis.__faceAdapterApi = api;
globalThis.window = new EventTarget();
registerHooks({ resolve(specifier, context, next) {
    if (context.parentURL?.endsWith('/api/faceNameApi.ts')) {
        if (specifier === '@/features/shared-game/api/games.api') return { url: 'data:text/javascript,export const gamesApi = globalThis.__faceAdapterApi;', shortCircuit: true };
        if (specifier === '@/features/shared-game/events') return { url: 'data:text/javascript,export const notifyGameSessionRecorded = () => window.dispatchEvent(new Event("recorded"));', shortCircuit: true };
        if (specifier === '@/features/shared-game/store/gameCatalogStore') return { url: 'data:text/javascript,export const reloadGameCatalog = async () => {};', shortCircuit: true };
    }
    return next(specifier, context);
} });
const face = await import('../src/features/facename-game/api/faceNameApi.ts');

test('FaceName setup derives scoring, times and player progress from the unified catalog', async () => {
    api.getGames = async () => ({ data: { games: [{ gameName: 'facename', maxLevel: 10, defaultMemorizeSec: 60,
        recallSec: 120, passAccuracy: 0.7, levels: [{ level: 1, itemCount: 6, recallSec: 150, requiredScore: 4 }],
        player: { unlockedLevel: 3, played: 8 } }] } });
    const setup = await face.fetchFaceNameSetup();
    assert.equal(setup.levels[0].requiredScore, 4);
    assert.equal(setup.levels[0].recallSeconds, 150);
    assert.equal(setup.stats.unlockedLevel, 3);
    assert.equal(setup.stats.totalRounds, 8);
});

test('FaceName start and recall adapt shared sessions and adjust a skewed server clock', async () => {
    let body;
    api.startRound = async (input) => {
        body = input;
        return { data: { session: { sessionId: 'session', rules: { mode: input.mode, gameLevel: 1, totalItems: 3,
            memorizeLimitSec: 60, recallLimitSec: 90 }, items: [{ code: '1', label: 'Anna', imageUrl: 'anna.svg' }],
            serverNow: '2000-01-01T00:00:00Z', memorizeDeadline: '2000-01-01T00:01:00Z' } } };
    };
    const before = Date.now();
    const started = await face.startFreeRound(3, 60, 90);
    assert.deepEqual(body, { gameName: 'facename', mode: 'custom', itemCount: 3, memorizeSec: 60, recallSec: 90 });
    assert.equal(started.people[0].name, 'Anna');
    assert.equal(started.people[0].id, 1);
    assert.ok(Date.parse(started.memorizeDeadline) >= before + 60000);
    api.startRecall = async () => ({ data: { session: { serverNow: '2000-01-01T00:00:00Z', recallDeadline: '2000-01-01T00:01:30Z', recallOptions: [{ code: '1', imageUrl: 'anna.svg' }] } } });
    const recall = await face.startFaceNameRecall('session');
    assert.ok(Date.parse(recall.recallDeadline) >= before + 90000);
    assert.equal(recall.recallOptions[0].label, undefined);
});

test('FaceName submission preserves original order and uses server score, unlock and timing', async () => {
    api.submitRound = async (id, answers) => {
        assert.equal(id, 'session');
        assert.deepEqual(answers, ['Anna', 'wrong', null]);
        return { data: { session: { sessionId: 'session', status: 'completed', gameName: 'facename', rewards: { exp: { total: 8 } }, rules: { mode: 'level', gameLevel: 1 }, unlockedLevel: { before: 1, after: 1 },
            result: { score: 0.5, maxScore: 3, correctItems: 1, totalItems: 3, accuracy: 1 / 3, result: 'fail', memorizeSec: 12, recallSec: 20,
                perItem: [
                    { expected: { code: '1', label: 'Anna' }, answer: { code: 'Anna', label: 'Anna' }, correct: true },
                    { expected: { code: '2', label: 'Ana' }, answer: { code: 'wrong', label: 'wrong' }, correct: false },
                    { expected: { code: '3', label: 'Claire' }, answer: null, correct: false },
                ] } } } };
    };
    const result = await face.submitFaceNameRound('session', [{ personId: 1, answer: 'Anna' }, { personId: 2, answer: 'wrong' }, { personId: 3, answer: '' }], 9999);
    assert.equal(result.score, 0.5);
    assert.equal(result.timeUsedSeconds, 32);
    assert.equal(result.unlockedLevel, 1);
    assert.equal(result.incorrectCount, 1);
    assert.equal(result.blankCount, 1);
    assert.equal(result.results[1].answer, 'wrong');
    assert.equal(result.round.rewards.exp.total, 8);
    assert.equal(result.round.sessionId, 'session');
});
