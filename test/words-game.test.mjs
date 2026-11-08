import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const api = {};
let completions = 0;
const ownerListeners = [];
globalThis.__wordsOwnerListeners = ownerListeners;
globalThis.__wordsApi = api;
globalThis.__wordsCompleted = () => completions++;
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.window = { localStorage: globalThis.localStorage };

registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '@/features/auth/store/authStore') {
            return {
                url: 'data:text/javascript,export const useAuthStore = { subscribe: (listener) => globalThis.__wordsOwnerListeners.push(listener) };',
                shortCircuit: true,
            };
        }
        if (specifier === '@/features/shared-game/api/games.api') {
            return {
                url: 'data:text/javascript,export const gamesApi = globalThis.__wordsApi;',
                shortCircuit: true,
            };
        }
        if (specifier === '@/features/shared-game/completion') {
            return {
                url: 'data:text/javascript,export const synchronizeRoundCompletion = globalThis.__wordsCompleted;',
                shortCircuit: true,
            };
        }
        if (specifier.startsWith('@/')) {
            return {
                url: pathToFileURL(resolve('src', `${specifier.slice(2)}.ts`)).href,
                shortCircuit: true,
            };
        }
        return next(specifier, context);
    },
});

const { useWordsGameStore: store } = await import('../src/features/words-game/store/wordsGameStore.ts');

const started = (sessionId = 'word-round') => ({
    gameName: 'word',
    sessionId,
    status: 'memorizing',
    rules: { mode: 'level', gameLevel: 1, totalItems: 3, memorizeLimitSec: 60, recallLimitSec: 240, passAccuracy: 2 / 3, requiredScore: 2 },
    items: [
        { code: 'Bồ câu', label: 'Bồ câu' },
        { code: 'Hải đăng', label: 'Hải đăng' },
        { code: 'Hoa sen', label: 'Hoa sen' },
    ],
    serverNow: '2000-01-01T00:00:50Z',
    memorizeDeadline: '2000-01-01T00:01:50Z',
});

beforeEach(() => {
    completions = 0;
    store.getState().resetGame();
});

test('word: starts round through shared gamesApi and loads items and deadline', async () => {
    const round = started();
    api.startRound = async (req) => {
        assert.equal(req.gameName, 'word');
        assert.equal(req.gameLevel, 1);
        assert.equal(req.language, 'vi');
        return { data: { session: round } };
    };

    await store.getState().startGame({ gameLevel: 1, memorizeSec: 60 });
    assert.equal(store.getState().phase, 'memorize');
    assert.equal(store.getState().sessionId, 'word-round');
    assert.deepEqual(store.getState().wordsToMemorize, ['Bồ câu', 'Hải đăng', 'Hoa sen']);
});

test('word: passes selected language preference to startRound', async () => {
    let capturedLang = null;
    api.startRound = async (req) => {
        capturedLang = req.language;
        return { data: { session: started() } };
    };

    store.getState().setPreferences({
        language: 'en',
        groups: 2,
        hideTimer: true,
        prepTime: 0,
    });

    await store.getState().startGame({ gameLevel: 2, memorizeSec: 120 });
    assert.equal(capturedLang, 'en');
});

test('word: transitions to recall via startRecall and submits answers through submitRound', async () => {
    const round = started();
    store.getState().loadRound(round);

    api.startRecall = async (id) => {
        assert.equal(id, 'word-round');
        return {
            data: {
                session: {
                    ...round,
                    status: 'recalling',
                    recallOptions: round.items,
                    serverNow: '2000-01-01T00:01:50Z',
                    recallDeadline: '2000-01-01T00:05:50Z',
                },
            },
        };
    };

    await store.getState().finishMemorize();
    assert.equal(store.getState().phase, 'recall');

    // Điền câu trả lời
    store.getState().setAnswer(0, 'bồ câu');
    store.getState().setAnswer(1, 'hải đăng');

    let submittedAnswers = null;
    const completed = {
        ...round,
        status: 'completed',
        completedAt: '2000-01-01T00:02:30Z',
        result: {
            correctItems: 2,
            totalItems: 3,
            accuracy: 2 / 3,
            result: 'pass',
            memorizeSec: 30,
            recallSec: 40,
            perItem: [
                { expected: { code: 'Bồ câu', label: 'Bồ câu' }, answer: { code: 'bồ câu', label: 'bồ câu' }, correct: true },
                { expected: { code: 'Hải đăng', label: 'Hải đăng' }, answer: { code: 'hải đăng', label: 'hải đăng' }, correct: true },
                { expected: { code: 'Hoa sen', label: 'Hoa sen' }, answer: null, correct: false },
            ],
        },
        rewards: { exp: { total: 50 } },
        unlockedLevel: { before: 1, after: 2 },
    };

    api.submitRound = async (id, answers) => {
        assert.equal(id, 'word-round');
        submittedAnswers = answers;
        return { data: { session: completed } };
    };

    await store.getState().finishGame();
    assert.deepEqual(submittedAnswers, ['bồ câu', 'hải đăng', null]);
    assert.equal(store.getState().phase, 'result');
    assert.equal(store.getState().result, completed);
    assert.equal(completions, 1);
});

test('word: resetGame clears session and returns to settings phase', () => {
    store.getState().loadRound(started());
    assert.equal(store.getState().phase, 'memorize');
    store.getState().resetGame();
    assert.equal(store.getState().phase, 'settings');
    assert.equal(store.getState().sessionId, null);
    assert.deepEqual(store.getState().wordsToMemorize, []);
});

