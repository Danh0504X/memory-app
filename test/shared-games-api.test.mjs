import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';

const client = {};
globalThis.__sharedApiClient = client;
registerHooks({ resolve(specifier, context, next) {
    if (context.parentURL?.endsWith('/shared-game/api/games.api.ts') && specifier === '@/lib/api-client') {
        return { url: 'data:text/javascript,export const apiClient = globalThis.__sharedApiClient;', shortCircuit: true };
    }
    return next(specifier, context);
} });
const { gamesApi } = await import('../src/features/shared-game/api/games.api.ts');

test('recorded Numbers results are read without resubmitting answers and keep the server reward', async () => {
    const recorded = { sessionId: 'number/id', gameName: 'number', status: 'completed', rewards: { exp: { total: 38 } } };
    client.get = async (path) => { assert.equal(path, '/game-sessions/number%2Fid'); return { data: { session: recorded } }; };
    assert.equal(await gamesApi.getCompletedRound('number/id'), recorded);
});

test('missing, incomplete or mismatched recorded results remain errors instead of becoming zero EXP', async () => {
    client.get = async () => { throw { status: 404 }; };
    await assert.rejects(gamesApi.getCompletedRound('id'));
    for (const session of [{ sessionId: 'id', status: 'recalling' }, { sessionId: 'other', status: 'completed' }]) {
        client.get = async () => ({ data: { session } });
        await assert.rejects(gamesApi.getCompletedRound('id'));
    }
});
