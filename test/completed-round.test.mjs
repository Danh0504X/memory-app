import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
import { describeCompletedRound } from '../src/features/shared-game/utils/completedRound.ts';
import { clientDeadline } from '../src/features/shared-game/utils/deadline.ts';

const round = (overrides = {}) => ({
    sessionId: 'round', gameName: 'number', status: 'completed', rewards: null,
    rules: { mode: 'level', gameLevel: 1 }, unlockedLevel: { before: 1, after: 1 },
    result: { correctItems: 7, totalItems: 8, accuracy: 0.875, result: 'pass' },
    ...overrides,
});

test('a passing Numbers round is presented as pass without claiming an unlocked level', () => {
    const summary = describeCompletedRound(round(), 10);
    assert.equal(summary.canPlayNext, false);
    assert.equal(summary.newLevel, false);
    assert.equal(summary.value, 7);
    assert.match(summary.message, /chưa mở/);
});

test('FaceName score keeps fractional and negative points independently of correct count', () => {
    const summary = describeCompletedRound(round({ gameName: 'facename',
        result: { correctItems: 1, totalItems: 6, score: -1.5, maxScore: 6, accuracy: 1 / 6, result: 'fail' } }), 10);
    assert.equal(summary.value, -1.5);
    assert.equal(summary.unit, 'điểm');
    assert.equal(summary.canPlayNext, false);
});

test('replaying a failed level never claims a perfect result or offers a next level', () => {
    const summary = describeCompletedRound(round({ unlockedLevel: { before: 4, after: 4 },
        result: { correctItems: 1, totalItems: 8, result: 'fail' } }), 10);
    assert.equal(summary.nextLevel, null);
    assert.doesNotMatch(summary.message, /đúng toàn bộ|Đúng hết/);
});

test('server unlocks allow the next level while custom and daily rounds never do', () => {
    const unlocked = round({ unlockedLevel: { before: 1, after: 2 } });
    assert.equal(describeCompletedRound(unlocked, 10).nextLevel, 2);
    assert.equal(describeCompletedRound({ ...unlocked, rules: { mode: 'custom', gameLevel: null } }, 10).canPlayNext, false);
    assert.equal(describeCompletedRound({ ...unlocked, rules: { mode: 'daily', gameLevel: null } }, 10).canPlayNext, false);
    assert.equal(describeCompletedRound(round({ rules: { mode: 'level', gameLevel: 10 }, unlockedLevel: { before: 10, after: 10 } }), 10).canPlayNext, false);
});

test('all game deadlines adjust server clock skew and never extend an expired phase', () => {
    const before = Date.now();
    const deadline = clientDeadline('2000-01-01T00:01:00Z', '2000-01-01T00:00:50Z');
    assert.ok(deadline >= before + 10000 && deadline <= Date.now() + 10000);
    assert.ok(clientDeadline('2000-01-01T00:00:40Z', '2000-01-01T00:00:50Z') <= Date.now());
    assert.equal(clientDeadline('2000-01-01T00:01:00Z'), Date.parse('2000-01-01T00:01:00Z'));
});

let notifications = 0;
let reloads = 0;
globalThis.__completionEffects = { notify: () => notifications++, reload: () => reloads++ };
registerHooks({ resolve(specifier, context, next) {
    if (context.parentURL?.endsWith('/shared-game/completion.ts')) {
        if (specifier === './events') return { url: 'data:text/javascript,export const notifyGameSessionRecorded = globalThis.__completionEffects.notify;', shortCircuit: true };
        if (specifier === './store/gameCatalogStore') return { url: 'data:text/javascript,export const reloadGameCatalog = globalThis.__completionEffects.reload;', shortCircuit: true };
    }
    return next(specifier, context);
} });
const { synchronizeRoundCompletion } = await import('../src/features/shared-game/completion.ts');
test('completion effects refresh profile and catalog once for each game session, including retries', () => {
    for (const game of ['card', 'image', 'facename', 'number']) {
        synchronizeRoundCompletion(game);
        synchronizeRoundCompletion(game);
    }
    assert.equal(notifications, 4);
    assert.equal(reloads, 4);
});
