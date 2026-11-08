import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GameHeader } from '@/features/shared-game/components/GameHeader';
import { usePhaseTimer } from '@/features/cards-game/hooks/usePhaseTimer';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { NumbersSettingsPhase } from './NumbersSettingsPhase';
import { NumbersMemorizePhase } from './NumbersMemorizePhase';
import { NumbersRecallPhase } from './NumbersRecallPhase';
import { NumbersResultPhase } from './NumbersResultPhase';
import { NumbersWaitPhase } from './NumbersWaitPhase';

export const NumbersGame = () => {
    const userId = useAuthStore((state) => state.user?._id);
    const state = useNumbersGameStore();
    const { session, initialize, dispose, prepDeadline, deadline, begin, recall, ready, submit, refresh, reset, busy, error, isStarting } = state;

    useEffect(() => {
        if (userId) initialize(userId);
        return dispose;
    }, [userId, initialize, dispose]);

    useEffect(() => {
        const saveOnHide = () => { if (document.visibilityState === 'hidden') useNumbersGameStore.getState().save(); };
        document.addEventListener('visibilitychange', saveOnHide);
        return () => document.removeEventListener('visibilitychange', saveOnHide);
    }, []);

    const expire = useCallback(() => {
        if (prepDeadline || isStarting) begin();
        else if (session?.phase === 'memorizing') recall();
        else if (session?.phase === 'preparing_recall') ready();
        else if (session?.phase === 'recalling') submit();
    }, [prepDeadline, isStarting, session?.phase, begin, recall, ready, submit]);

    const { formattedTime, timeLeft } = usePhaseTimer(prepDeadline ?? deadline, expire);
    const inGame = !!session || !!prepDeadline || isStarting;

    const subtitle = (prepDeadline || (isStarting && !session)) ? 'Chuẩn bị ghi nhớ'
        : session?.phase === 'memorizing' ? 'Ghi nhớ'
        : session?.phase === 'preparing_recall' ? 'Chuẩn bị nhập'
        : session?.phase === 'recalling'
            ? (session.memorizeUsedMs ? `Thời gian nhớ: ${((session.memorizeUsedMs) / 1000).toFixed(2)}s` : 'Nhập đáp án')
        : 'Kết quả';

    // Mỗi màn chỉ có một hành động chính: Màn chờ (wait phase) dùng nút chính ở giữa thẻ,
    // màn ghi nhớ và nhập đáp án dùng nút hành động trên GameHeader.
    const headerActionText = session?.phase === 'completed' ? undefined
        : (prepDeadline || isStarting) ? undefined
        : session?.phase === 'preparing_recall' ? undefined
        : busy ? 'Đang xử lý…'
        : session?.phase === 'memorizing' ? '✓ Mình đã nhớ xong'
        : session?.phase === 'recalling' ? 'Nộp bài'
        : undefined;

    const onHeaderAction = (prepDeadline || isStarting || session?.phase === 'preparing_recall') ? undefined
        : session?.phase === 'memorizing' ? recall
        : session?.phase === 'recalling' ? submit
        : undefined;

    const retry = () => {
        if (isStarting) begin();
        else if (session?.phase === 'memorizing' && state.hidden) recall();
        else if (session?.phase === 'preparing_recall') ready();
        else if (session?.phase === 'recalling' && deadline && Date.now() >= deadline) submit();
        else if (session?.phase === 'recalling' && state.dirty) state.save();
        else refresh();
    };

    return <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
        {inGame && <GameHeader
            gameName="Ghi nhớ số"
            level={session?.level ?? undefined}
            subtitle={subtitle}
            formattedTime={session?.phase === 'completed' || (session?.phase === 'memorizing' && state.preferences.hideTimer) ? undefined : formattedTime}
            actionButtonText={headerActionText}
            onAction={onHeaderAction}
            actionDisabled={busy}
            resetDisabled={busy}
            onReset={() => {
                void state.flush().finally(() => {
                    state.reset();
                });
            }}
        />}

        {error && <div role="alert" className="mx-auto my-4 flex w-[calc(100%-2rem)] max-w-4xl flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-base text-red-800">
            <p className="flex-1">{error}</p>
            <button type="button" disabled={busy || state.saving} onClick={retry} className="min-h-11 rounded-full border border-red-300 bg-white px-4 py-2 font-bold disabled:opacity-50">Thử lại</button>
            {!session && state.savedSessionId && <button type="button" onClick={reset} disabled={busy} className="min-h-11 rounded-full border border-red-300 bg-white px-4 py-2 font-bold">Bắt đầu lượt mới</button>}
        </div>}

        {!inGame && <NumbersSettingsPhase />}

        {(prepDeadline || (isStarting && !session)) && <NumbersWaitPhase
            title="Sẵn sàng ghi nhớ"
            formattedTime={formattedTime}
            buttonLabel={isStarting && busy ? "Đang chuẩn bị…" : "Bắt đầu ngay"}
            disabled={busy}
            onSkip={begin}
        />}

        {!prepDeadline && !isStarting && session?.phase === 'memorizing' && <NumbersMemorizePhase />}

        {!prepDeadline && !isStarting && session?.phase === 'preparing_recall' && <NumbersWaitPhase
            title="Nhẩm lại trong đầu nhé!"
            formattedTime={formattedTime}
            buttonLabel={busy ? "Đang xử lý…" : "Mình sẵn sàng"}
            disabled={busy}
            onSkip={ready}
        />}

        {!prepDeadline && !isStarting && session?.phase === 'recalling' && <>
            <NumbersRecallPhase expired={timeLeft === 0} />
            <p role="status" className="min-h-6 pb-6 text-center text-sm font-semibold text-[#586274]">
                {state.saving ? 'Đang lưu…' : state.dirty ? 'Chưa lưu' : ''}
            </p>
        </>}

        {!prepDeadline && !isStarting && session?.phase === 'completed' && <NumbersResultPhase />}
    </div>;
};
