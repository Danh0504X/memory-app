import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reminderDates } from '../src/features/reminder/reminderDates.ts';

const at = (d, h, m = 0) => new Date(2026, 10, d, h, m);
const key = (date) => `${date.getDate()}/${date.getHours()}:${date.getMinutes()}`;

test('chưa chơi và chưa tới giờ: nhắc từ hôm nay', () => {
    const dates = reminderDates(19, false, at(9, 8), 3);
    assert.deepEqual(dates.map(key), ['9/19:0', '10/19:0', '11/19:0']);
});

test('hôm nay đã chơi: bắt đầu từ ngày mai', () => {
    assert.equal(key(reminderDates(19, true, at(9, 8), 1)[0]), '10/19:0');
});

test('đã quá giờ nhắc: bắt đầu từ ngày mai, qua được cuối tháng', () => {
    const dates = reminderDates(19, false, at(30, 20), 2);
    assert.deepEqual(dates.map((date) => `${date.getMonth() + 1}/${key(date)}`), ['12/1/19:0', '12/2/19:0']);
});

test('mặc định hẹn 14 ngày', () => {
    assert.equal(reminderDates(7, false, at(9, 6)).length, 14);
});
