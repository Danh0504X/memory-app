import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Confetti } from '@/features/shared-game/components/Confetti';
import { numbersApi } from '../api/numbers.api';
import { useNumbersGameStore } from '../store/numbersGameStore';
import type { NumberProgress } from '../types/numberTypes';

const MAX_LEVEL = 10;

const rise = (i: number) => ({ '--i': i }) as CSSProperties;

export const NumbersResultPhase = () => {
    const { session, prepare, reset, busy } = useNumbersGameStore();
    const navigate = useNavigate();
    const [progress, setProgress] = useState<NumberProgress | null>(null);

    // Chỉ báo mở khoá cấp khi máy chủ xác nhận qua API tiến độ
    useEffect(() => {
        let active = true;
        numbersApi
            .progress()
            .then((value) => {
                if (active) {
                    setProgress(value);
                    useNumbersGameStore.setState({ progress: value });
                    useNumbersGameStore.getState().refresh();
                }
            })
            .catch(() => {
                /* Không báo mở khoá khi chưa xác nhận được */
            });
        return () => {
            active = false;
        };
    }, [session?.id, session?.level]);

    if (!session?.result) return null;
    const { result, comparison = [] } = session;
    const level = session.level;
    const isChallenge = session.mode === 'challenge';
    const passed = result.correctCount === result.total;
    const hasNext = passed && level !== null && level < MAX_LEVEL;
    const nextUnlocked = hasNext && progress !== null && progress.unlockedLevel > level;

    const play = (targetLevel: number | null) =>
        prepare(
            isChallenge
                ? { mode: 'challenge', prepareRecall: true }
                : {
                      mode: 'practice',
                      prepareRecall: true,
                      ...(targetLevel ? { level: targetLevel } : { digitCount: session.digitCount }),
                      memorizeSeconds: session.memorizeSeconds,
                      recallSeconds: session.recallSeconds,
                  },
        );

    const primary = isChallenge
        ? { label: 'Về thiết lập', run: reset, next: false }
        : hasNext
          ? { label: `Chơi cấp ${level! + 1}`, run: () => play(level! + 1), next: true }
          : { label: level !== null && !passed ? 'Thử lại cấp này' : 'Chơi lại', run: () => play(level), next: false };
    const secondary = !isChallenge && hasNext ? { label: 'Chơi lại cấp này', run: () => play(level) } : !isChallenge ? { label: 'Về thiết lập', run: reset } : null;

    let line = 'Cố gắng hơn ở lượt sau nhé! Thử đổi mỗi chữ số thành một hình rồi nối thành câu chuyện.';
    if (isChallenge) line = 'Bạn đã hoàn thành thử thách số hôm nay. Kết quả đã được ghi nhận.';
    else if (passed && level !== null && level >= MAX_LEVEL) line = 'Bạn đã đạt cấp cao nhất!';
    else if (passed && nextUnlocked) line = `Bạn đã mở khoá cấp ${level! + 1}.`;
    else if (passed) line = 'Bạn nhớ đúng tất cả.';

    const memorizeSec = ((session.memorizeUsedMs ?? 0) / 1000).toFixed(2);

    return (
        <>
            <section className="play__table score" data-result={passed ? 'perfect' : 'fail'} aria-labelledby="nscore-verdict">
                {passed && <Confetti />}
                <h1 id="nscore-verdict" className="score__verdict" style={rise(0)}>
                    {passed ? 'Hoàn hảo!' : isChallenge ? 'Đã nộp bài' : 'Chưa đạt'}
                </h1>
                <p className="score__count" style={rise(1)}>
                    {result.correctCount}
                    <small> / {result.total} đúng</small>
                </p>
                <div className="score__meter" style={rise(2)} aria-hidden="true">
                    <span style={{ width: `${result.accuracy}%` }} />
                </div>
                <p className="score__line" style={rise(3)}>
                    Độ chính xác <strong>{result.accuracy}%</strong> · ghi nhớ trong <strong>{memorizeSec} giây</strong>. {line}
                </p>
                {session.completionReason === 'timeout' && (
                    <p className="score__note" style={rise(4)}>
                        Đã hết giờ gõ lại nên bài được nộp tự động.
                    </p>
                )}
                <div className="score__actions" style={rise(5)}>
                    <button type="button" onClick={primary.run} disabled={busy} className="btn btn--sun">
                        {primary.label}
                        {primary.next ? <ArrowRight size={18} aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}
                    </button>
                    {secondary && (
                        <button type="button" onClick={secondary.run} disabled={busy} className="btn btn--on-table">
                            {secondary.label}
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                            reset();
                            navigate('/games');
                        }}
                        className="btn btn--on-table"
                    >
                        Chọn trò khác
                    </button>
                </div>
            </section>

            <section className="review" aria-labelledby="ncompare-title">
                <div className="review__head">
                    <h2 id="ncompare-title">Đối chiếu từng chữ số</h2>
                    <p>
                        Hàng trên: đáp án · Hàng dưới: bạn gõ · đúng {result.correctCount}, sai {result.wrongCount}, bỏ trống {result.blankCount}
                    </p>
                </div>
                <ol className="ncompare">
                    {comparison.map((item) => (
                        <li key={item.index} data-status={item.status}>
                            <span className="ncompare__no">{item.index + 1}</span>
                            <span className="ncompare__expected">{item.expected}</span>
                            <span className="ncompare__actual">{item.actual ?? '–'}</span>
                            <span className="sr-only">
                                {item.status === 'correct' ? 'đúng' : item.status === 'wrong' ? 'sai' : 'bỏ trống'}
                            </span>
                        </li>
                    ))}
                </ol>
            </section>
        </>
    );
};
