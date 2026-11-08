import { useEffect, useRef, useState } from 'react';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { mutedText, quietButton } from '../styles';

export const NumbersRecallPhase = ({ expired }: { expired: boolean }) => {
    const { session, answers, edit, busy } = useNumbersGameStore();
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const [selected, setSelected] = useState(0);

    useEffect(() => {
        refs.current[0]?.focus();
    }, []);

    const focus = (index: number) => {
        const next = Math.max(0, Math.min(answers.length - 1, index));
        setSelected(next);
        refs.current[next]?.focus();
    };

    const insert = (index: number) => {
        const next = [...answers];
        next.splice(index, 0, null);
        next.pop();
        edit(next);
        focus(index);
    };

    const remove = (index: number) => {
        const next = [...answers];
        next.splice(index, 1);
        next.push(null);
        edit(next);
        focus(index);
    };

    const enterDigit = (digit: string, index: number) => {
        const next = [...answers];
        next[index] = digit;
        edit(next);
        focus(index + 1);
    };

    const disabled = busy || expired;
    const totalDigits = session!.digitCount;

    // Chia dải ô thành từng hàng (mỗi hàng tối đa 10 số như Memory League để co giãn responsive hoàn hảo)
    const ROW_SIZE = totalDigits <= 12 ? totalDigits : 10;
    const rowCount = Math.ceil(totalDigits / ROW_SIZE);
    const rows = Array.from({ length: rowCount }, (_, rIdx) => {
        const start = rIdx * ROW_SIZE;
        const end = Math.min(start + ROW_SIZE, totalDigits);
        return { start, indices: Array.from({ length: end - start }, (_, i) => start + i) };
    });

    return <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-8">
        <section className="rounded-[32px] border border-[#e0eee6] bg-white p-6 shadow-md sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0eee6] pb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0d631b]">Nhập lại dãy số theo đúng thứ tự</h1>
                <span className={`text-sm font-bold ${mutedText}`}>
                    Đã điền: <strong className="text-[#0d631b]">{answers.filter((a) => a !== null).length}</strong>/{totalDigits}
                </span>
            </div>

            {expired && <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-base font-semibold text-amber-900">
                Đã hết giờ, đang chấm bài…
            </p>}

            {/* Băng chuyền ô nhập số nối liền (Connected Digit Strip - phong cách Memory League) */}
            <div className="mt-6 flex flex-col gap-6 overflow-x-auto pb-2">
                {rows.map((row, rIdx) => (
                    <div key={rIdx} className="flex flex-col items-start min-w-max">
                        {/* Hàng chỉ số thứ tự 1, 2, 3... */}
                        <div className="flex">
                            {row.indices.map((idx) => (
                                <div
                                    key={idx}
                                    className={`w-9 sm:w-11 text-center text-xs pb-1 font-semibold transition ${
                                        selected === idx ? 'text-[#0d631b] font-extrabold' : 'text-[#77839a]'
                                    }`}
                                >
                                    {idx + 1}
                                </div>
                            ))}
                        </div>

                        {/* Dải ô số liền kề nhau */}
                        <div className="inline-flex border-y border-l border-[#b9cfc3] rounded-lg overflow-hidden shadow-xs">
                            {row.indices.map((idx) => {
                                const isCurrent = selected === idx;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => focus(idx)}
                                        className={`relative w-9 h-11 sm:w-11 sm:h-12 border-r border-[#b9cfc3] flex items-center justify-center cursor-pointer transition ${
                                            isCurrent
                                                ? 'bg-[#fef08a] ring-2 ring-inset ring-[#ca8a04]'
                                                : answers[idx] !== null
                                                ? 'bg-[#f4fbf7]'
                                                : 'bg-white hover:bg-[#f8faf9]'
                                        }`}
                                    >
                                        <input
                                            ref={(el) => { refs.current[idx] = el; }}
                                            aria-label={`Chữ số ${idx + 1}`}
                                            inputMode="numeric"
                                            type="text"
                                            pattern="[0-9]*"
                                            autoComplete="off"
                                            spellCheck={false}
                                            disabled={disabled}
                                            value={answers[idx] ?? ''}
                                            onFocus={(e) => {
                                                setSelected(idx);
                                                e.target.select();
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    const next = [...answers];
                                                    next[idx] = null;
                                                    edit(next);
                                                } else if (/^[0-9]+$/.test(val)) {
                                                    enterDigit(val.slice(-1), idx);
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const digits = e.clipboardData.getData('text').replace(/\s/g, '');
                                                if (!/^[0-9]+$/.test(digits)) return;
                                                const next = [...answers];
                                                [...digits].slice(0, next.length - idx).forEach((digit, offset) => {
                                                    next[idx + offset] = digit;
                                                });
                                                edit(next);
                                                focus(Math.min(next.length - 1, idx + digits.length));
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.ctrlKey || e.metaKey || e.altKey || e.nativeEvent.isComposing) return;
                                                if (/^[0-9]$/.test(e.key)) {
                                                    e.preventDefault();
                                                    enterDigit(e.key, idx);
                                                } else if (e.key === 'ArrowLeft') {
                                                    e.preventDefault();
                                                    focus(idx - 1);
                                                } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                                                    e.preventDefault();
                                                    focus(idx + 1);
                                                } else if (e.key === 'Backspace') {
                                                    e.preventDefault();
                                                    const prev = Math.max(0, idx - 1);
                                                    const next = [...answers];
                                                    next[prev] = null;
                                                    edit(next);
                                                    focus(prev);
                                                } else if (e.key === 'Delete') {
                                                    e.preventDefault();
                                                    const next = [...answers];
                                                    next[idx] = null;
                                                    edit(next);
                                                } else if (e.key === '+' || e.key === 'Insert') {
                                                    e.preventDefault();
                                                    insert(idx);
                                                } else if (e.key === '-') {
                                                    e.preventDefault();
                                                    remove(idx);
                                                }
                                            }}
                                            className="w-full h-full text-center font-mono text-xl sm:text-2xl font-bold text-[#1f2937] bg-transparent outline-none cursor-pointer"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bàn phím số & Nút điều khiển (Memory League Style + Memio Colors) */}
            <div className="mt-8 pt-6 border-t border-[#e0eee6]">
                {/* Hàng phím số 1 đến 0 */}
                <div role="group" aria-label="Bàn phím số" className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {'1234567890'.split('').map((digit) => (
                        <button
                            type="button"
                            key={digit}
                            disabled={disabled}
                            onClick={() => enterDigit(digit, selected)}
                            className="min-h-12 cursor-pointer rounded-xl border border-[#b9cfc3] bg-[#e6f7ed] text-xl font-bold text-[#0d631b] hover:bg-[#d7f1e4] active:scale-95 transition disabled:opacity-40"
                        >
                            {digit}
                        </button>
                    ))}
                </div>

                {/* Nút điều hướng ô & Xóa lùi */}
                <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => focus(selected - 1)}
                        className={quietButton + ' min-h-11 px-5'}
                    >
                        ◀ Ô trước
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => focus(selected + 1)}
                        className={quietButton + ' min-h-11 px-5'}
                    >
                        Ô sau ▶
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            const index = Math.max(0, selected - 1);
                            const next = [...answers];
                            next[index] = null;
                            edit(next);
                            focus(index);
                        }}
                        className={quietButton + ' min-h-11 px-5'}
                    >
                        ⌫ Xóa
                    </button>
                </div>

                {/* Thao tác nâng cao: Chèn / Xóa ô */}
                <details className="mt-4 rounded-xl border border-[#e0eee6] p-3 text-center">
                    <summary className="min-h-8 cursor-pointer text-sm font-semibold text-[#586274] hover:text-[#0d631b]">
                        Chèn / Xóa ô
                    </summary>
                    <div className="mt-2 flex justify-center gap-3">
                        <button type="button" disabled={disabled} onClick={() => insert(selected)} className={quietButton}>
                            + Chèn ô trống
                        </button>
                        <button type="button" disabled={disabled} onClick={() => remove(selected)} className={quietButton}>
                            − Xóa ô
                        </button>
                    </div>
                </details>
            </div>
        </section>
    </main>;
};
