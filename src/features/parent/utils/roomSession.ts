import type { RoomView } from '../api/rooms.api';
import type { SyncStorage } from '@/lib/storage';

export const isRoomCode = (value: string) => /^[A-Z2-9]{8}$/.test(value);
export const isTerminalRoom = (room: RoomView) => room.state === 'completed' || room.state === 'cancelled';
export type RoomSnapshot = { room: RoomView | null; answers: (string | null)[]; offset: number };
const empty = (): RoomSnapshot => ({ room: null, answers: [], offset: 0 });

// One instance belongs to one account + room. No React/native dependency, so races are testable.
export class RoomSession {
    snapshot = empty();
    private active = true;
    private actionLocked = false;
    private accountId: string;
    private code: string;
    private storage: SyncStorage;
    constructor(accountId: string, code: string, storage: SyncStorage) {
        this.accountId = accountId; this.code = code; this.storage = storage;
    }
    private key(room: RoomView) { return `family-draft:${this.accountId}:${room.code}:${room.roundIndex}`; }
    dispose() { this.active = false; this.snapshot = empty(); }
    apply(value: RoomView, now = Date.now()): boolean {
        if (!this.active || value.code !== this.code || value.revision < (this.snapshot.room?.revision ?? -1)) return false;
        const old = this.snapshot.room;
        if (old && old.roundIndex !== value.roundIndex) {
            try { this.storage.removeItem(this.key(old)); } catch { /* optional storage */ }
        }
        let answers = this.snapshot.answers;
        if (!old || old.roundIndex !== value.roundIndex || (old.phase !== 'recalling' && value.phase === 'recalling')) {
            answers = Array(value.rules.totalItems).fill(null);
            if (value.phase === 'recalling') {
                try {
                    const saved = JSON.parse(this.storage.getItem(this.key(value)) ?? 'null');
                    if (Array.isArray(saved) && saved.length === value.rules.totalItems && saved.every((a) => a === null || typeof a === 'string')) answers = saved;
                } catch { /* storage unavailable or corrupt: use empty draft */ }
            }
        }
        if (value.round?.myAnswers) answers = [...value.round.myAnswers];
        if (isTerminalRoom(value) || value.state === 'round_result') {
            try { this.storage.removeItem(this.key(value)); } catch { /* optional local persistence */ }
        }
        this.snapshot = { room: value, answers, offset: Date.parse(value.serverNow) - now };
        return true;
    }
    edit(index: number, answer: string | null): boolean {
        const room = this.snapshot.room;
        if (!this.active || !room || room.phase !== 'recalling' || this.actionLocked || index < 0 || index >= room.rules.totalItems) return false;
        const unique = room.gameName === 'card' || room.gameName === 'image';
        const answers = this.snapshot.answers.map((a, i) => i === index ? answer : unique && answer !== null && a === answer ? null : a);
        this.snapshot = { ...this.snapshot, answers };
        try { this.storage.setItem(this.key(room), JSON.stringify(answers)); } catch { /* still usable without storage */ }
        return true;
    }
    async act(action: () => Promise<RoomView>): Promise<boolean> {
        if (!this.active || this.actionLocked) return false;
        this.actionLocked = true;
        try { return this.apply(await action()); }
        finally { this.actionLocked = false; }
    }
}

export function roomSeconds(snapshot: RoomSnapshot, now = Date.now()) {
    const room = snapshot.room;
    if (!room?.round || !['memorizing', 'recalling'].includes(room.phase)) return null;
    const deadline = room.phase === 'memorizing' ? room.round.memorizeEndsAt : room.round.recallEndsAt;
    return Math.max(0, Math.ceil((Date.parse(deadline) - now - snapshot.offset) / 1000));
}
