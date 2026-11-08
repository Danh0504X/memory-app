import { useCallback, useEffect } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GameHeader } from '@/features/shared-game/components/GameHeader';
import { usePhaseTimer } from '@/features/shared-game/hooks/usePhaseTimer';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { NumbersSettingsPhase } from './NumbersSettingsPhase';
import { NumbersMemorizePhase } from './NumbersMemorizePhase';
import { NumbersRecallPhase } from './NumbersRecallPhase';
import { NumbersResultPhase } from './NumbersResultPhase';
import { NumbersWaitPhase } from './NumbersWaitPhase';
import '@/features/shared-game/game.css';
import '../numbers.css';

export const NumbersGame = () => {
    const userId = useAuthStore((state) => state.user?._id);
    const authLoading = useAuthStore((state) => state.isLoading);
    const state = useNumbersGameStore();
    const { session, initialize, dispose, prepDeadline, deadline, begin, recall, ready, submit, refresh, reset, busy, error, isStarting, answers, preferences } = state;

    useEffect(() => {
        if (!authLoading) initialize(userId ?? 'guest');
        return dispose;
    }, [userId, authLoading, initialize, dispose]);

    // Rời tab giữa lúc gõ đáp án thì lưu ngay
    useEffect(() => {
        const saveOnHide = () => { if (document.visibilityState === 'hidden') useNumbersGameStore.getState().save(); };
        document.addEventListener('visibilitychange', saveOnHide);
        return () => document.removeEventListener('visibilitychange', saveOnHide);
    }, []);

    // Hết giờ ở mỗi bước thì tự sang bước sau
    const expire = useCallback(() => {
        if (prepDeadline || isStarting) begin();
        else if (session?.phase === 'memorizing') recall();
        else if (session?.phase === 'preparing_recall') ready();
        else if (session?.phase === 'recalling') submit();
    }, [prepDeadline, isStarting, session?.phase, begin, recall, ready, submit]);

    const { formattedTime, timeLeft } = usePhaseTimer(prepDeadline ?? deadline, expire);
    const preparing = !!prepDeadline || (isStarting && !session);
    const inGame = !!session || preparing;
    const phase = preparing ? 'preparing' : session?.phase;

    const filled = answers.filter((answer) => answer !== null).length;
    const total = session?.digitCount ?? 0;
    const result = session?.result;

    let status = 'Chuẩn bị ghi nhớ';
    let progress: number | undefined;
    let timeLimit: number | undefined;
    if (phase === 'preparing') timeLimit = preferences.prepTime;
    if (phase === 'memorizing') {
        status = `Ghi nhớ ${total} chữ số`;
        timeLimit = session?.memorizeSeconds;
    }
    if (phase === 'preparing_recall') status = 'Nhẩm lại trong đầu';
    if (phase === 'recalling') {
        status = `Gõ lại · đã điền ${filled} trên ${total}`;
        progress = total ? filled / total : 0;
        timeLimit = session?.recallSeconds;
    }
    if (phase === 'completed' && result) {
        status = `Kết quả · đúng ${result.correctCount} trên ${result.total}`;
        progress = result.total ? result.correctCount / result.total : 0;
    }

    const showTimer = phase !== 'completed' && !(phase === 'memorizing' && preferences.hideTimer);
    const action =
        phase === 'memorizing' ? { label: busy ? 'Đang chuyển…' : 'Đã nhớ xong', run: recall }
        : phase === 'recalling' ? { label: busy ? 'Đang chấm…' : 'Nộp bài', run: submit }
        : null;

    const retry = () => {
        if (isStarting) begin();
        else if (session?.phase === 'memorizing' && state.hidden) recall();
        else if (session?.phase === 'preparing_recall') ready();
        else if (session?.phase === 'recalling' && deadline && Date.now() >= deadline) submit();
        else if (session?.phase === 'recalling' && state.dirty) state.save();
        else refresh();
    };

    const errorBar = error && (
        <div role="alert" className="nerror">
            <AlertCircle size={18} aria-hidden="true" />
            <p>{error}</p>
            <button type="button" disabled={busy || state.saving} onClick={retry}>
                Thử lại
            </button>
            {!session && state.savedSessionId && (
                <button type="button" onClick={reset} disabled={busy}>
                    Bắt đầu lượt mới
                </button>
            )}
        </div>
    );

    if (authLoading) return <div className="grid min-h-dvh place-items-center" role="status"><LoaderCircle size={28} className="animate-spin" aria-label="Đang tải" /></div>;

    if (!inGame) {
        return (
            <>
                {errorBar}
                <NumbersSettingsPhase />
            </>
        );
    }

    return (
        <div className="play">
            <GameHeader
                gameName="Ghi nhớ số"
                level={session?.level ?? null}
                daily={session?.mode === 'challenge'}
                badge={phase === 'preparing' ? 'Chuẩn bị' : undefined}
                status={status}
                progress={progress}
                timeLeft={showTimer ? timeLeft : undefined}
                timeLimit={timeLimit}
                actionLabel={action?.label}
                onAction={action?.run}
                actionBusy={busy}
                onReset={() => {
                    void state.flush().finally(() => state.reset());
                }}
            />
            {errorBar}

            {phase === 'preparing' && (
                <NumbersWaitPhase
                    title="Sẵn sàng ghi nhớ"
                    description="Dãy số sẽ hiện ra khi hết giờ đếm. Chuẩn bị sẵn câu chuyện của bạn nhé."
                    formattedTime={formattedTime}
                    buttonLabel="Bắt đầu ngay"
                    disabled={busy}
                    onSkip={begin}
                />
            )}
            {phase === 'memorizing' && <NumbersMemorizePhase />}
            {phase === 'preparing_recall' && (
                <NumbersWaitPhase
                    title="Nhẩm lại trong đầu"
                    description="Dãy số đã được giấu. Kể lại câu chuyện của bạn một lượt rồi bắt đầu gõ."
                    formattedTime={formattedTime}
                    buttonLabel="Mình sẵn sàng"
                    disabled={busy}
                    onSkip={ready}
                />
            )}
            {phase === 'recalling' && <NumbersRecallPhase expired={timeLeft === 0} />}
            {phase === 'completed' && <NumbersResultPhase />}
        </div>
    );
};
