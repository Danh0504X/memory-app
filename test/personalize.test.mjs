import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    daysUntilExam,
    examLine,
    goalGames,
    recommendGame,
    roundsPerDay,
} from '../src/features/today/utils/personalize.ts';

const ALL = ['card', 'image', 'number', 'facename', 'word'];
const prefs = (overrides = {}) => ({ goals: [], dailyMinutes: 15, targetDate: null, status: 'answered', ...overrides });
const played = (game, isoDate) => ({ game, playedAt: new Date(isoDate) });

test('without answered goals the recommendation is unchanged: last game, or images for a new player', () => {
    const sessions = [played('card', '2026-11-08T09:00:00Z'), played('word', '2026-11-07T09:00:00Z')];
    assert.deepEqual(recommendGame(sessions, null, ALL), { game: 'card', reason: null });
    assert.deepEqual(recommendGame([], prefs({ status: 'skipped', goals: ['language'] }), ALL), { game: 'image', reason: null });
    assert.deepEqual(recommendGame(null, prefs({ status: 'unset' }), ALL), { game: 'image', reason: null });
});

test('a goal points to its games and says why', () => {
    const sessions = [played('card', '2026-11-08T09:00:00Z')];
    const pick = recommendGame(sessions, prefs({ goals: ['language'] }), ALL);
    assert.equal(pick.game, 'word');
    assert.match(pick.reason, /học ngoại ngữ/);
});

test('among the goal games the one played longest ago comes first, never-played before all', () => {
    const goals = prefs({ goals: ['numbers'] });
    // Chưa chơi trò nào: theo thứ tự ưu tiên (số trước thẻ bài)
    assert.equal(recommendGame([], goals, ALL).game, 'number');
    // Vừa chơi số: chuyển sang thẻ bài
    assert.equal(recommendGame([played('number', '2026-11-08T09:00:00Z')], goals, ALL).game, 'card');
    // Cả hai đã chơi: trò lâu hơn
    const both = [played('number', '2026-11-08T09:00:00Z'), played('card', '2026-11-05T09:00:00Z')];
    assert.equal(recommendGame(both, goals, ALL).game, 'card');
});

test('training the whole brain rotates through every game', () => {
    const sessions = ALL.filter((game) => game !== 'facename').map((game, i) => played(game, `2026-11-0${8 - i}T09:00:00Z`));
    const pick = recommendGame(sessions, prefs({ goals: ['brain', 'language'] }), ALL);
    assert.equal(pick.game, 'facename');
    assert.match(pick.reason, /Xen kẽ/);
    assert.deepEqual(goalGames(prefs({ goals: ['brain'] })), []);
    assert.deepEqual(goalGames(prefs({ goals: ['exam', 'language'] })), ['word', 'image']);
});

test('daily minutes become a number of rounds', () => {
    assert.equal(roundsPerDay(null), 1);
    assert.equal(roundsPerDay(prefs({ goals: ['names'], dailyMinutes: 5 })), 1);
    assert.equal(roundsPerDay(prefs({ goals: ['names'], dailyMinutes: 15 })), 3);
    assert.equal(roundsPerDay(prefs({ goals: ['names'], dailyMinutes: 30 })), 5);
    assert.equal(roundsPerDay(prefs({ status: 'skipped', goals: ['names'], dailyMinutes: 30 })), 1);
});

test('exam countdown only for the exam goal, urgent in the last two weeks', () => {
    const exam = prefs({ goals: ['exam'], targetDate: '2026-11-20' });
    assert.equal(daysUntilExam(exam, '2026-11-08'), 12);
    assert.equal(daysUntilExam(prefs({ goals: ['language'], targetDate: '2026-11-20' }), '2026-11-08'), null);
    assert.equal(daysUntilExam(exam, '2026-11-21'), null);

    assert.deepEqual(examLine(30, 3), { text: 'Còn 30 ngày tới kỳ thi.', urgent: false });
    assert.equal(examLine(12, 3).urgent, true);
    assert.match(examLine(12, 3).text, /3 ván mỗi ngày/);
    assert.match(examLine(0, 3).text, /Hôm nay là ngày thi/);
    assert.equal(examLine(null, 3), null);
});

test('cách ôn hôm nay khớp với trò được gợi ý', async () => {
    const { METHOD_FOR_GAME } = await import('../src/features/today/utils/personalize.ts');
    assert.deepEqual(Object.keys(METHOD_FOR_GAME).sort(), [...ALL].sort());
    assert.equal(METHOD_FOR_GAME.card, 'loci');
    assert.equal(METHOD_FOR_GAME.number, 'numbers');
    assert.equal(METHOD_FOR_GAME.image, 'story');
});
