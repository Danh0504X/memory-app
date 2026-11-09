import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { appStorage } from '@/lib/storage';
import { roomsApi, type RoomView } from '../api/rooms.api';
import { isRoomCode, isTerminalRoom, RoomSession, roomSeconds, type RoomSnapshot } from '../utils/roomSession';

export function useFamilyRoom(code: string) {
    const accountId = useAuthStore((s) => s.user?._id ?? '');
    const [snapshot, setSnapshot] = useState<RoomSnapshot>({ room: null, answers: [], offset: 0 });
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [connected, setConnected] = useState(false);
    const [, tick] = useState(0);
    const actionLock = useRef(false);
    const session = useRef<RoomSession | null>(null);
    const refresh = useRef<() => void>(() => {});
    useFocusEffect(useCallback(() => {
        const own = new RoomSession(accountId, code, appStorage);
        session.current = own;
        let active = true, fetching = false, foreground = AppState.currentState === 'active';
        let timer: ReturnType<typeof setTimeout> | undefined;
        let failures = 0;
        setSnapshot(own.snapshot); setError(null); setActionError(null); setConnected(false); setBusy(false);
        const poll = async () => {
            if (!active || fetching || !foreground || !isRoomCode(code)) return;
            fetching = true;
            clearTimeout(timer);
            try {
                const value = await roomsApi.get(code);
                if (!active) return;
                if (own.apply(value)) setSnapshot(own.snapshot);
                failures = 0; setConnected(true); setError(null);
            } catch (cause) {
                if (!active) return;
                failures++; setConnected(false); setError((cause as { message?: string })?.message ?? 'Không đồng bộ được phòng.');
            } finally {
                fetching = false;
                if (active && foreground && !(own.snapshot.room && isTerminalRoom(own.snapshot.room))) timer = setTimeout(() => void poll(), Math.min(10000, 1500 * 2 ** Math.min(failures, 3)));
            }
        };
        refresh.current = () => void poll();
        if (!isRoomCode(code)) setError('Mã phòng phải gồm 8 ký tự A–Z và 2–9.');
        else void poll();
        const sub = AppState.addEventListener('change', (state) => {
            foreground = state === 'active'; clearTimeout(timer);
            if (foreground) void poll();
        });
        const clock = setInterval(() => { if (active && foreground) tick((n) => n + 1); }, 500);
        return () => { active = false; own.dispose(); clearTimeout(timer); clearInterval(clock); sub.remove(); session.current = null; refresh.current = () => {}; };
    }, [code, accountId]));
    const act = async (action: () => Promise<RoomView>) => {
        const own = session.current;
        if (!own || actionLock.current) return;
        actionLock.current = true;
        setActionError(null); setBusy(true);
        try {
            await own.act(action);
            if (session.current === own) { setSnapshot(own.snapshot); setConnected(true); }
        } catch (cause) {
            if (session.current === own) setActionError((cause as { message?: string })?.message ?? 'Chưa thực hiện được. Hãy đồng bộ và thử lại.');
        } finally { actionLock.current = false; if (session.current === own) { setBusy(false); refresh.current(); } }
    };
    const edit = (index: number, answer: string | null) => {
        const own = session.current;
        if (own?.edit(index, answer)) setSnapshot(own.snapshot);
    };
    return { ...snapshot, remaining: roomSeconds(snapshot), error: actionError ?? error, busy, connected, act, edit, reload: () => refresh.current() };
}
