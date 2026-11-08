import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const api = {};
let completions = 0;
const ownerListeners = [];
globalThis.__selectionOwnerListeners = ownerListeners;
globalThis.__selectionApi = api;
globalThis.__selectionCompleted = () => completions++;
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.window = { localStorage: globalThis.localStorage };
registerHooks({ resolve(specifier, context, next) {
    if (specifier === '@/features/auth/store/authStore') return { url: 'data:text/javascript,export const useAuthStore = { subscribe: (listener) => globalThis.__selectionOwnerListeners.push(listener) };', shortCircuit: true };
    if (specifier === '@/features/shared-game/api/games.api') return { url: 'data:text/javascript,export const gamesApi = globalThis.__selectionApi;', shortCircuit: true };
    if (specifier === '@/features/shared-game/completion') return { url: 'data:text/javascript,export const synchronizeRoundCompletion = globalThis.__selectionCompleted;', shortCircuit: true };
    if (specifier === '../utils/imageUtils') return { url: 'data:text/javascript,export const imageFromView = v => ({id:v.code,imageUrl:v.imageUrl}); export const preloadImages = async () => {};', shortCircuit: true };
    if (specifier.startsWith('@/')) return { url: pathToFileURL(resolve('src', `${specifier.slice(2)}.ts`)).href, shortCircuit: true };
    if (specifier === '../utils/cardUtils') return { url: new URL('../src/features/cards-game/utils/cardUtils.ts', import.meta.url).href, shortCircuit: true };
    return next(specifier, context);
} });
const { useGameStore: cards } = await import('../src/features/cards-game/store/gameStore.ts');
const { useImagesGameStore: images } = await import('../src/features/images-game/store/imagesGameStore.ts');

const started = (gameName, sessionId = 'round') => ({
    gameName, sessionId, status: 'memorizing',
    rules: { mode: 'level', gameLevel: 1, totalItems: 1, memorizeLimitSec: 60, recallLimitSec: 120 },
    items: [{ code: gameName === 'card' ? 'AS' : 'image-1', imageUrl: 'image.svg' }],
    serverNow: '2000-01-01T00:00:50Z', memorizeDeadline: '2000-01-01T00:01:00Z',
});
const begin = (name, state) => name === 'card'
    ? state.startGame({ memorizeSec: 60, gameLevel: 1, customCardCount: null })
    : state.startGame(60, 1, null);

for (const [name, store] of [['card', cards], ['image', images]]) {
    test(`${name}: shared deadlines keep server time and submits retain the complete reward exactly once`, async () => {
        completions = 0;
        store.getState().resetGame();
        const round = started(name);
        const before = Date.now();
        await store.getState().loadRound(round);
        assert.ok(store.getState().phaseDeadline >= before + 10000);
        assert.ok(store.getState().phaseDeadline <= Date.now() + 10000);
        api.startRecall = async () => ({ data: { session: { ...round, recallOptions: round.items,
            serverNow: '2000-01-01T00:01:50Z', recallDeadline: '2000-01-01T00:02:00Z' } } });
        await store.getState().finishMemorize();
        assert.ok(store.getState().phaseDeadline <= Date.now() + 10000);
        let finish;
        let submissions = 0;
        api.submitRound = async (_id, answers) => {
            submissions++;
            assert.deepEqual(answers, [null]);
            return new Promise((resolve) => { finish = resolve; });
        };
        const pending = store.getState().finishGame();
        await store.getState().finishGame();
        const completed = { ...round, status: 'completed', rewards: { exp: { total: 55 } } };
        finish({ data: { session: completed } });
        await pending;
        assert.equal(submissions, 1);
        assert.equal(store.getState().result, completed);
        assert.equal(completions, 1);
    });

    test(`${name}: leaving the game prevents a stale submission from replacing the next screen`, async () => {
        completions = 0;
        store.getState().resetGame();
        store.setState({ sessionId: 'old', phase: 'recall', userRecall: [null] });
        let finish;
        api.submitRound = () => new Promise((resolve) => { finish = resolve; });
        const pending = store.getState().finishGame();
        store.getState().resetGame();
        finish({ data: { session: { ...started(name, 'old'), status: 'completed' } } });
        await pending;
        assert.equal(store.getState().phase, 'idle');
        assert.equal(store.getState().result, null);
        assert.equal(completions, 0);
    });

    test(`${name}: a pending start from an old mount cannot replace a newly started round`, async () => {
        store.getState().resetGame();
        const pending = [];
        api.startRound = () => new Promise((resolve) => pending.push(resolve));
        const first = begin(name, store.getState());
        store.getState().resetGame();
        const second = begin(name, store.getState());
        pending[1]({ data: { session: started(name, 'new') } });
        await second;
        pending[0]({ data: { session: started(name, 'old') } });
        await first;
        assert.equal(store.getState().sessionId, 'new');
    });
}

test('changing account clears saved card and image rounds even while their screens are unmounted', () => {
    for (const store of [cards, images]) store.setState({ phase: 'result', result: { sessionId: 'old-account' } });
    for (const listener of ownerListeners) listener({ user: { _id: 'next' } }, { user: { _id: 'previous' } });
    assert.equal(cards.getState().phase, 'idle');
    assert.equal(images.getState().phase, 'idle');
});
