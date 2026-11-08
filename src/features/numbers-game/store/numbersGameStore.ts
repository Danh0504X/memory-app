import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { numbersApi } from '../api/numbers.api';
import { synchronizeRoundCompletion } from '../../shared-game/completion.ts';
import { clientDeadline } from '../../shared-game/utils/deadline.ts';
import type { NumberAnswers, NumberPreferences, NumberProgress, NumberSession, NumberSettings } from '../types/numberTypes';
import type { ApiErrorResponse } from '@/types/auth.types';

interface NumbersGameState {
    session: NumberSession | null;
    answers: NumberAnswers;
    progress: NumberProgress | null;
    preferences: NumberPreferences;
    busy: boolean;
    saving: boolean;
    dirty: boolean;
    error: string | null;
    hidden: boolean;
    isStarting: boolean;
    prepDeadline: number | null;
    deadline: number | null;
    savedSessionId: string | null;
    initialize: (userId: string) => void;
    dispose: () => void;
    setPreferences: (preferences: NumberPreferences) => void;
    prepare: (settings: NumberSettings) => void;
    begin: () => void;
    refresh: () => void;
    recall: () => void;
    ready: () => void;
    submit: () => void;
    edit: (answers: NumberAnswers) => void;
    save: () => void;
    flush: () => Promise<boolean>;
    reset: () => void;
}
let epoch = 0;
let storageKey = '';
let queue: Promise<void> = Promise.resolve();
let debounce: ReturnType<typeof setTimeout> | undefined;
let pendingSettings: NumberSettings | null = null;
const progressStorageKey = (userId: string) => `memio:number-progress:${userId}`;
const readStoredProgress = (userId: string): NumberProgress | null => {
    try {
        const raw = sessionStorage.getItem(progressStorageKey(userId)) ?? localStorage.getItem(progressStorageKey(userId));
        if (raw) return JSON.parse(raw);
    } catch { /* Storage có thể bị chặn. */ }
    return null;
};
const writeStoredProgress = (userId: string, progress: NumberProgress | null) => {
    try {
        const key = progressStorageKey(userId);
        if (progress) {
            sessionStorage.setItem(key, JSON.stringify(progress));
            localStorage.setItem(key, JSON.stringify(progress));
        } else {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        }
    } catch { /* Storage có thể bị chặn. */ }
};
const persistId = (id: string | null) => {
    try { if (id) sessionStorage.setItem(storageKey, id); else sessionStorage.removeItem(storageKey); } catch { /* Storage có thể bị chặn. */ }
};
const errorText = (error: unknown) => {
    const value = error as ApiErrorResponse;
    if (value.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (value.status === 404) return 'Không tìm thấy lượt chơi. Bạn có thể bắt đầu lượt mới.';
    // Backend gắn mã lỗi cho 403 (numberSession.service.ts): hiện câu tiếng Việt theo mã thay vì câu tiếng Anh của server
    if (value.status === 403 && value.code === 'CHALLENGE_PLAYED') return 'Bạn đã chơi thử thách hôm nay. Quay lại vào ngày mai nhé.';
    if (value.status === 403 && value.code === 'LEVEL_LOCKED') return 'Cấp này chưa mở khoá. Hãy nhớ đúng hết ở cấp trước để mở.';
    if (value.status === 403) return 'Bạn chưa mở khoá cấp độ này hoặc đã tham gia thử thách hôm nay.';
    if (value.status === 409) return 'Trạng thái lượt chơi đã thay đổi. Hãy thử lại để đồng bộ.';
    return 'Không thể kết nối hoặc lưu lượt chơi. Đáp án đang nhập vẫn được giữ; hãy thử lại.';
};

export const useNumbersGameStore = create<NumbersGameState>()(persist((set, get) => {
    const accept = (session: NumberSession, preserveAnswers = false) => {
        const end = session.phase === 'memorizing' ? session.memorizeEndsAt
            : session.phase === 'preparing_recall' ? session.recallStartedAt
            : session.phase === 'recalling' ? session.recallEndsAt : null;
        // Quy đổi deadline server sang mốc thời gian client
        const deadline = end ? clientDeadline(end, session.serverNow) : null;
        persistId(session.id);
        set({ session, deadline, savedSessionId: session.id,
            isStarting: false,
            prepDeadline: null,
            hidden: session.phase !== 'memorizing',
            ...(preserveAnswers && session.phase === 'recalling' ? {} : {
                answers: session.answers ?? Array<string | null>(session.digitCount).fill(null), dirty: false,
            }),
        });
        if (session.phase === 'completed') {
            persistId(null);
            synchronizeRoundCompletion(session.id);
        }
    };
    const enqueue = (job: (active: () => boolean) => Promise<void>, saving = false) => {
        const generation = epoch;
        const active = () => generation === epoch;
        if (saving) set({ saving: true });
        else set({ busy: true });
        queue = queue.then(async () => {
            if (!active()) return;
            set({ error: null });
            try { await job(active); }
            catch (error) { if (active()) set({ error: errorText(error) }); }
            finally { if (active()) set(saving ? { saving: false } : { busy: false }); }
        });
    };
    const write = (submit: boolean) => {
        clearTimeout(debounce);
        if (submit && get().busy) return;
        enqueue(async (active) => {
            for (let attempt = 0; attempt < 2; attempt++) {
                const { session, answers } = get();
                if (!session || session.phase !== 'recalling') return;
                const snapshot = [...answers];
                try {
                    const next = await (submit ? numbersApi.submit : numbersApi.save)(session.id, session.revision, snapshot);
                    if (!active()) return;
                    accept(next, true);
                    set({ dirty: JSON.stringify(snapshot) !== JSON.stringify(get().answers) });
                    if (next.phase === 'completed') {
                        set({ dirty: false });
                        persistId(null);
                    } else if (get().dirty) {
                        debounce = setTimeout(() => get().save(), 500);
                    }
                    return;
                } catch (error) {
                    if ((error as ApiErrorResponse).status !== 409 || attempt === 1) throw error;
                    const current = await numbersApi.get(session.id);
                    if (!active()) return;
                    accept(current, true);
                    if (current.phase === 'completed') return;
                }
            }
        }, !submit);
    };
    return {
        session: null, answers: [], progress: null,
        preferences: { groups: '3', hideTimer: false, prepTime: 20 },
        busy: false, saving: false, dirty: false, error: null, hidden: false,
        isStarting: false, prepDeadline: null, deadline: null, savedSessionId: null,
        initialize: (userId) => {
            epoch++; queue = Promise.resolve(); clearTimeout(debounce);
            storageKey = `memio:number-session:${userId}`;
            const cachedProgress = userId === 'guest' ? null : readStoredProgress(userId);
            set({ session: null, answers: [], progress: cachedProgress, busy: false, saving: false,
                dirty: false, hidden: false, error: null, deadline: null, prepDeadline: null,
                isStarting: false, savedSessionId: null });
            get().refresh();
        },
        dispose: () => {
            epoch++; clearTimeout(debounce); pendingSettings = null; persistId(null);
            set({ session: null, answers: [], busy: false, saving: false, dirty: false,
                error: null, hidden: false, isStarting: false, prepDeadline: null, deadline: null, savedSessionId: null });
        },
        setPreferences: (preferences) => set({ preferences }),
        prepare: (settings) => {
            if (get().busy || get().isStarting) return;
            pendingSettings = settings;
            set({ session: null, answers: [], error: null, deadline: null, isStarting: true,
                prepDeadline: Date.now() + get().preferences.prepTime * 1000 });
        },
        begin: () => {
            if (get().busy || !pendingSettings) return;
            const settings = pendingSettings;
            set({ isStarting: true });
            enqueue(async (active) => {
                try {
                    const session = await numbersApi.create(settings);
                    if (active()) {
                        pendingSettings = null;
                        accept(session);
                    }
                } catch (err) {
                    if (active()) {
                        set({ isStarting: false });
                    }
                    throw err;
                }
            });
        },
        refresh: () => {
            if (get().busy) return;
            enqueue(async (active) => {
                const id = get().session?.id;
                if (id) {
                    const session = await numbersApi.get(id);
                    if (!active()) return;
                    accept(session, get().dirty);
                }
                const progress = await numbersApi.progress();
                if (active()) {
                    if (storageKey) {
                        const currentUserId = storageKey.replace('memio:number-session:', '');
                        if (currentUserId && currentUserId !== 'guest') writeStoredProgress(currentUserId, progress);
                    }
                    set({ progress });
                }
            });
        },
        recall: () => {
            if (get().busy || get().session?.phase !== 'memorizing') return;
            set({ hidden: true });
            enqueue(async (active) => {
                const session = await numbersApi.recall(get().session!.id);
                if (active()) accept(session);
            });
        },
        ready: () => {
            if (get().busy || get().session?.phase !== 'preparing_recall') return;
            enqueue(async (active) => {
                const session = await numbersApi.ready(get().session!.id);
                if (active()) accept(session);
            });
        },
        submit: () => write(true),
        edit: (answers) => {
            const state = get();
            if (state.busy || state.session?.phase !== 'recalling' ||
                (state.deadline && Date.now() >= state.deadline)) return;
            set({ answers, dirty: true });
            clearTimeout(debounce);
            debounce = setTimeout(() => get().save(), 500);
        },
        save: () => { if (get().dirty && !get().saving && !get().busy) write(false); },
        flush: async () => {
            if (get().busy) return false;
            clearTimeout(debounce);
            if (!get().dirty && !get().saving) return true;
            const generation = epoch;
            get().save();
            set({ busy: true });
            await queue;
            if (generation !== epoch) return false;
            // Nếu autosave đang chạy trước lúc thoát, lưu thêm snapshot mới nhất.
            if (get().dirty && !get().error) { write(false); await queue; }
            if (generation !== epoch) return false;
            set({ busy: false });
            return !get().dirty;
        },
        reset: () => {
            if (get().busy || get().saving) return;
            clearTimeout(debounce); pendingSettings = null; persistId(null);
            set({ session: null, answers: [], hidden: false, error: null, dirty: false,
                isStarting: false, deadline: null, prepDeadline: null, savedSessionId: null });
            get().refresh();
        },
    };
}, { name: 'memio-number-preferences', partialize: (state) => ({ preferences: state.preferences }) }));
