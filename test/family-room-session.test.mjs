import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RoomSession, roomSeconds, isRoomCode } from '../src/features/parent/utils/roomSession.ts';
const view = (extra = {}) => ({ code: 'ABC23456', revision: 1, role: 'child', state: 'recalling', phase: 'recalling', gameName: 'number', rules: { totalItems: 3 }, roundIndex: 0, serverNow: '2026-11-09T00:00:00Z', round: { memorizeEndsAt: '2026-11-09T00:01:00Z', recallEndsAt: '2026-11-09T00:03:00Z' }, ...extra });
const setup = (id = 'child1', map = new Map()) => {
    const storage = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
    return { session: new RoomSession(id, 'ABC23456', storage), map, storage };
};
test('room code matches actual backend alphabet and length', () => {
    assert.ok(isRoomCode('ABC23456')); for (const value of ['ABC2345', 'ABC234567', 'ABC01456', 'abc23456', 'A/B23456']) assert.equal(isRoomCode(value), false);
});
test('number drafts preserve leading zeros and repeated digits across reopen; accounts stay isolated', () => {
    const { session, map, storage } = setup(); session.apply(view()); session.edit(0, '0'); session.edit(1, '0'); session.edit(2, '7');
    const reopened = new RoomSession('child1', 'ABC23456', storage); reopened.apply(view()); assert.deepEqual(reopened.snapshot.answers, ['0', '0', '7']);
    const other = setup('child2', map).session; other.apply(view()); assert.deepEqual(other.snapshot.answers, [null, null, null]);
});
test('unique selections move cards while repeated numbers remain legal; next round clears old drafts', () => {
    const { session, map } = setup(); session.apply(view({ gameName: 'card' })); session.edit(0, 'AS'); session.edit(1, 'AS');
    assert.deepEqual(session.snapshot.answers, [null, 'AS', null]);
    session.apply(view({ revision: 2, roundIndex: 1 })); assert.deepEqual(session.snapshot.answers, [null, null, null]); assert.equal(map.size, 0);
});
test('late reads never regress a newer revision, and disposed sessions never accept responses', () => {
    const { session } = setup(); session.apply(view({ revision: 5, phase: 'waiting_for_other' }));
    assert.equal(session.apply(view({ revision: 4 })), false); assert.equal(session.snapshot.room.phase, 'waiting_for_other');
    assert.equal(session.apply(view({ code: 'OTHER234', revision: 9 })), false);
    session.dispose(); assert.equal(session.apply(view({ revision: 10 })), false); assert.equal(session.snapshot.room, null);
});
test('double submission is locked synchronously; failed submission retains draft and can retry', async () => {
    const { session } = setup(); session.apply(view()); session.edit(0, '0');
    let rejectFirst; let calls = 0;
    const first = session.act(() => { calls++; return new Promise((_resolve, reject) => { rejectFirst = reject; }); });
    assert.equal(await session.act(async () => { calls++; return view(); }), false); assert.equal(calls, 1);
    assert.equal(session.edit(1, '5'), false);
    rejectFirst(new Error('network')); await assert.rejects(first, /network/);
    assert.deepEqual(session.snapshot.answers, ['0', null, null]);
    assert.equal(await session.act(async () => view({ revision: 2, phase: 'waiting_for_other' })), true);
});
test('terminal result deletes draft and prevents further edits; corrupt local drafts are ignored', () => {
    const { session, map } = setup(); map.set('family-draft:child1:ABC23456:0', '{broken'); session.apply(view());
    session.edit(0, '0'); assert.equal(map.size, 1);
    session.apply(view({ revision: 2, state: 'completed', phase: 'completed' })); assert.equal(map.size, 0); assert.equal(session.edit(1, '1'), false);
});
test('remaining time uses server offset and never extends an expired round', () => {
    const { session } = setup(); const clientNow = Date.parse('2026-11-09T10:00:00Z'); session.apply(view(), clientNow);
    assert.equal(roomSeconds(session.snapshot, clientNow), 180); assert.equal(roomSeconds(session.snapshot, clientNow + 181000), 0);
    session.apply(view({ revision: 2, phase: 'waiting_for_other' }), clientNow); assert.equal(roomSeconds(session.snapshot, clientNow), null);
});
