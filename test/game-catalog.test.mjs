import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';

const api = {};
globalThis.__catalogApi = api;
registerHooks({ resolve(specifier, context, next) {
    if (context.parentURL?.endsWith('/store/gameCatalogStore.ts')) {
        if (specifier === '../api/games.api') return { url: 'data:text/javascript,export const gamesApi = globalThis.__catalogApi;', shortCircuit: true };
        if (specifier === '@/features/auth/store/authStore') return { url: 'data:text/javascript,export const useAuthStore = { getState: () => ({ user: null }) };', shortCircuit: true };
    }
    return next(specifier, context);
} });
const { useGameCatalogStore: store } = await import('../src/features/shared-game/store/gameCatalogStore.ts');

test('shared catalog deduplicates one player and rejects an old account response', async () => {
    const pending = [];
    api.getGames = () => new Promise((resolve) => pending.push(resolve));
    const first = store.getState().load('first');
    const repeated = store.getState().load('first');
    assert.equal(pending.length, 1);
    const second = store.getState().load('second');
    assert.equal(pending.length, 2);
    pending[1]({ data: { games: [{ gameName: 'facename', player: { unlockedLevel: 2 } }] } });
    await second;
    pending[0]({ data: { games: [{ gameName: 'facename', player: { unlockedLevel: 9 } }] } });
    await Promise.all([first, repeated]);
    assert.equal(store.getState().loadedFor, 'second');
    assert.equal(store.getState().games[0].player.unlockedLevel, 2);
});
