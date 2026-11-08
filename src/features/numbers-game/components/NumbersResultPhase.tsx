import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { numbersApi } from '../api/numbers.api';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { mutedText, primaryButton, quietButton, secondaryButton } from '../styles';
import type { NumberProgress } from '../types/numberTypes';

const MAX_LEVEL = 10;

export const NumbersResultPhase = () => {
    const { session, prepare, reset, busy } = useNumbersGameStore();
    const navigate = useNavigate();
    const [progress, setProgress] = useState<NumberProgress | null>(null);

    // Chỉ thông báo mở khóa khi máy chủ xác nhận qua API tiến độ.
    useEffect(() => {
        let active = true;
        numbersApi.progress().then((value) => {
            if (active) {
                setProgress(value);
                useNumbersGameStore.setState({ progress: value });
                useNumbersGameStore.getState().refresh();
            }
        }).catch(() => { /* Không thông báo mở khóa khi chưa xác nhận được. */ });
        return () => { active = false; };
    }, [session?.id, session?.level]);

    if (!session?.result) return null;
    const { result, comparison = [] } = session;
    const level = session.level;
    const isChallenge = session.mode === 'challenge';
    const passed = result.correctCount === result.total;
    const hasNext = passed && level !== null && level < MAX_LEVEL;
    const nextUnlocked = hasNext && progress !== null && progress.unlockedLevel > level;

    const play = (targetLevel: number | null) => prepare(session.mode === 'challenge' ? { mode: 'challenge', prepareRecall: true } : {
        mode: 'practice', prepareRecall: true,
        ...(targetLevel ? { level: targetLevel } : { digitCount: session.digitCount }),
        memorizeSeconds: session.memorizeSeconds, recallSeconds: session.recallSeconds,
    });

    const primaryLabel = isChallenge ? 'Về thiết lập' : hasNext ? 'Chơi cấp tiếp theo' : level !== null && !passed ? 'Thử lại cấp này' : 'Chơi lại';
    const onPrimary = isChallenge ? reset : () => play(hasNext ? level! + 1 : level);
    const secondary = !isChallenge && hasNext ? { label: 'Chơi lại cấp này', run: () => play(level) } : null;

    const message = isChallenge
        ? 'Bạn đã hoàn thành thử thách ngày hôm nay! Kết quả đã được ghi nhận.'
        : passed
            ? level === null ? 'Tuyệt vời! Bạn nhớ đúng tất cả.'
                : level >= MAX_LEVEL ? 'Tuyệt vời! Bạn đã đạt cấp cao nhất.'
                : nextUnlocked ? `Tuyệt vời! Cấp ${level + 1} đã mở khóa.` : 'Tuyệt vời! Bạn nhớ đúng tất cả.'
            : 'Cố gắng hơn ở lượt sau nhé!';

    // Chia bảng đối chiếu thành từng hàng (mỗi hàng tối đa 12 số để hiển thị cân đối hoàn hảo trên desktop & tablet)
    const totalDigits = comparison.length;
    const ROW_SIZE = totalDigits <= 12 ? totalDigits : 10;
    const rowCount = Math.ceil(totalDigits / ROW_SIZE);
    const rows = Array.from({ length: rowCount }, (_, rIdx) => {
        const start = rIdx * ROW_SIZE;
        const end = Math.min(start + ROW_SIZE, totalDigits);
        return { start, items: comparison.slice(start, end) };
    });

    return <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <section className="flex w-full flex-col items-center rounded-[32px] border border-[#e0eee6] bg-white p-6 sm:p-10 text-center shadow-md">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d631b]">Kết quả ghi nhớ số</h1>

            {/* Thanh tổng kết ngắn gọn dạng capsule cân đối */}
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 rounded-2xl bg-[#f5faf7] border border-[#e0eee6] px-6 py-2.5 text-sm sm:text-base font-semibold text-[#1f2937]">
                <span>Điểm: <strong className="text-[#0d631b] font-extrabold text-lg">{result.correctCount}</strong>/{result.total}</span>
                <span className="text-[#c8d8d0]">•</span>
                <span>Chính xác: <strong className="text-[#0d631b] font-extrabold text-lg">{result.accuracy}%</strong></span>
                <span className="text-[#c8d8d0]">•</span>
                <span>Thời gian nhớ: <strong className="text-[#0d631b] font-extrabold text-lg">{((session.memorizeUsedMs ?? 0) / 1000).toFixed(2)}s</strong></span>
            </div>

            <p className={`mt-3 text-base sm:text-lg font-bold ${passed ? 'text-[#0d631b]' : 'text-[#e45454]'}`}>
                {message}
            </p>

            {session.completionReason === 'timeout' && (
                <p className={`mt-1 text-sm ${mutedText}`}>Đã hết giờ làm bài.</p>
            )}

            {/* BẢNG ĐỐI CHIẾU 2 HÀNG CÂN ĐỐI Ở GIỮA CARD (Memory League Dual-Row Grid) */}
            <div className="mt-7 flex w-full flex-col items-center justify-center gap-5 overflow-x-auto pb-2">
                {rows.map((row, rIdx) => (
                    <div key={rIdx} className="mx-auto flex flex-col items-center min-w-max">
                        {/* Hàng nhãn vị trí */}
                        <div className="flex w-full justify-center">
                            {row.items.map((item) => (
                                <div key={item.index} className="w-9 sm:w-11 text-center text-xs pb-1 font-semibold text-[#77839a]">
                                    {item.index + 1}
                                </div>
                            ))}
                        </div>

                        {/* Hàng 1: Dãy số gốc (Original Digits) */}
                        <div className="inline-flex border-t border-l border-[#d7e5dd] rounded-t-lg overflow-hidden bg-[#f8faf9]">
                            {row.items.map((item) => (
                                <div
                                    key={item.index}
                                    className="w-9 h-11 sm:w-11 sm:h-12 border-r border-b border-[#d7e5dd] flex items-center justify-center font-mono text-xl sm:text-2xl font-bold text-[#1f2937]"
                                >
                                    {item.expected}
                                </div>
                            ))}
                        </div>

                        {/* Hàng 2: Đáp án của bạn (Your Answers) */}
                        <div className="inline-flex border-l border-b border-[#d7e5dd] rounded-b-lg overflow-hidden shadow-xs">
                            {row.items.map((item) => {
                                const isCorrect = item.status === 'correct';
                                const isWrong = item.status === 'wrong';
                                return (
                                    <div
                                        key={item.index}
                                        className={`w-9 h-11 sm:w-11 sm:h-12 border-r border-t border-[#d7e5dd] flex items-center justify-center font-mono text-xl sm:text-2xl font-bold ${
                                            isCorrect
                                                ? 'bg-[#1a7a4a] text-white'
                                                : isWrong
                                                ? 'bg-[#ef4444] text-white'
                                                : 'bg-[#f1f5f9] text-[#94a3b8]'
                                        }`}
                                    >
                                        {item.actual ?? '–'}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Chú thích màu sắc cân đối */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-[#586274]">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-xs bg-[#1a7a4a]" /> Đúng
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-xs bg-[#ef4444]" /> Sai
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-xs bg-[#f1f5f9] border border-[#d7e5dd]" /> Bỏ trống
                </span>
            </div>

            {/* Các nút hành động phong cách Memio */}
            <div className="mt-8 flex w-full flex-col items-center gap-3 border-t border-[#e0eee6] pt-6">
                <button
                    type="button"
                    onClick={onPrimary}
                    disabled={busy}
                    className={primaryButton + ' w-full sm:w-auto px-12'}
                >
                    {primaryLabel}
                </button>

                {secondary && (
                    <button
                        type="button"
                        onClick={secondary.run}
                        disabled={busy}
                        className={secondaryButton + ' w-full sm:w-auto px-12'}
                    >
                        {secondary.label}
                    </button>
                )}

                <div className="flex flex-wrap justify-center gap-3 mt-1">
                    {!isChallenge && (
                        <button type="button" disabled={busy} onClick={reset} className={quietButton}>
                            Về thiết lập
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => { reset(); navigate('/games'); }}
                        className={quietButton}
                    >
                        Chọn trò chơi khác
                    </button>
                </div>
            </div>
        </section>
    </main>;
};
