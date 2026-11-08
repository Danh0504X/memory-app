import { useNavigate } from 'react-router-dom';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { RoundResultCard } from '@/features/shared-game/components/RoundResultCard';
import { useCompletedRound } from '@/features/shared-game/hooks/useCompletedRound';
import { useGameCatalog } from '@/features/shared-game/store/gameCatalogStore';
import { useNumbersGameStore } from '../store/numbersGameStore';
import type { NumberSession } from '../types/numberTypes';

export const NumbersResultPhase = () => {
    const session = useNumbersGameStore((state) => state.session);
    if (!session?.result) return null;
    return <NumbersCompletedResult key={session.id} session={session} />;
};

const NumbersCompletedResult = ({ session }: { session: NumberSession }) => {
    const { prepare, reset, progress } = useNumbersGameStore();
    const { game } = useGameCatalog('number');
    const { state, retry } = useCompletedRound(session.id, 'number', session.completedRound);
    const navigate = useNavigate();
    const { result, comparison = [] } = session;
    const play = (level: number | null) => prepare({
        mode: 'practice', prepareRecall: true,
        ...(level !== null ? { level } : { digitCount: session.digitCount }),
        memorizeSeconds: session.memorizeSeconds, recallSeconds: session.recallSeconds,
    });

    return <>
        {state.status === 'ready' ? <RoundResultCard
            round={state.round} maxLevel={game?.maxLevel ?? progress?.digitCounts.length ?? 0}
            onPlayAgain={() => play(session.level)} onNextLevel={(level) => play(level)} onReset={reset}
            dailyHref={null}
            note={session.completionReason === 'timeout' ? 'Đã hết giờ gõ lại nên bài được nộp tự động bằng đáp án đã lưu.' : undefined}
        /> : <section className="play__table score" aria-labelledby="number-result-pending">
            <h1 id="number-result-pending" className="score__verdict">Đã nộp bài</h1>
            <p className="score__count">{result!.correctCount}<small> / {result!.total} đúng</small></p>
            <p className="score__line">Chính xác {result!.accuracy}%. Đáp án và kết quả ván được giữ nguyên bên dưới.</p>
            {state.status === 'loading' ? <p role="status" className="score__note">Đang tải kết quả tổng hợp và phần thưởng…</p> : <div role="alert">
                <p className="score__note">Chưa tải được kết quả tổng hợp và phần thưởng. Bạn có thể tải lại; không cần nộp bài lần nữa.</p>
                <button type="button" className="btn btn--on-table" onClick={retry}><RefreshCw size={18} aria-hidden="true" />Tải lại kết quả</button>
            </div>}
            <div className="score__actions">
                {session.mode !== 'challenge' && <button type="button" className="btn btn--sun" onClick={() => play(session.level)}><RotateCcw size={18} aria-hidden="true" />Chơi lại</button>}
                <button type="button" className="btn btn--on-table" onClick={() => { reset(); navigate('/games'); }}>Chọn trò khác</button>
            </div>
        </section>}

        <section className="review" aria-labelledby="ncompare-title">
            <div className="review__head">
                <h2 id="ncompare-title">Đối chiếu từng chữ số</h2>
                <p>Hàng trên: đáp án · Hàng dưới: bạn gõ · Đúng {result!.correctCount}, sai {result!.wrongCount}, bỏ trống {result!.blankCount}</p>
            </div>
            <ol className="ncompare">
                {comparison.map((item) => <li key={item.index} data-status={item.status}>
                    <span className="ncompare__no">{item.index + 1}</span>
                    <span className="ncompare__expected">{item.expected}</span>
                    <span className="ncompare__actual">{item.actual ?? '–'}</span>
                    <span className="sr-only">{item.status === 'correct' ? 'đúng' : item.status === 'wrong' ? 'sai' : 'bỏ trống'}</span>
                </li>)}
            </ol>
        </section>
    </>;
};
