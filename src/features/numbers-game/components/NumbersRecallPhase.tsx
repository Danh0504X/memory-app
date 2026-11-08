import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Delete } from 'lucide-react';
import { PlayHints } from '@/features/shared-game/components/PlayHints';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { useAuthStore } from '@/features/auth/store/authStore';

const HINTS = [
    { keys: ['←', '→'], label: 'chọn ô' },
    { keys: ['Backspace'], label: 'xoá ô bên trái' },
    { keys: ['+'], label: 'chèn ô trống' },
    { keys: ['−'], label: 'xoá ô' },
];

// Bàn gõ lại: các ô số nằm trên bàn, mỗi hàng 10 ô; bàn phím số và công cụ ở dưới bàn
export const NumbersRecallPhase = ({ expired }: { expired: boolean }) => {
    const { session, answers, edit, busy, saving, dirty } = useNumbersGameStore();
    const isGuest = !useAuthStore((state) => state.isAuthenticated);
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

    // Lỡ thiếu một số: chèn ô trống, các số phía sau lùi một ô
    const insert = (index: number) => {
        const next = [...answers];
        next.splice(index, 0, null);
        next.pop();
        edit(next);
        focus(index);
    };

    // Lỡ thừa một số: xoá ô, các số phía sau tiến lên một ô
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

    const backspace = (index: number) => {
        const previous = Math.max(0, index - 1);
        const next = [...answers];
        next[previous] = null;
        edit(next);
        focus(previous);
    };

    const disabled = busy || expired;
    const totalDigits = session!.digitCount;
    const filled = answers.filter((answer) => answer !== null).length;

    // Mỗi hàng 10 ô (dãy ngắn từ 12 số trở xuống để một hàng)
    const rowSize = totalDigits <= 12 ? totalDigits : 10;
    const rows = Array.from({ length: Math.ceil(totalDigits / rowSize) }, (_, rowIndex) => {
        const start = rowIndex * rowSize;
        return { start, indices: Array.from({ length: Math.min(rowSize, totalDigits - start) }, (_, i) => start + i) };
    });

    return (
        <>
            <main className="play__table play__table--recall">
                <div className="answer__head">
                    <div>
                        <h2>Gõ lại dãy số theo đúng thứ tự</h2>
                        <p>{expired ? 'Đã hết giờ, đang chấm bài…' : `Đã điền ${filled} trên ${totalDigits}. Gõ số vào ô sáng màu.`}</p>
                    </div>
                    <p className="nsave" role="status" data-state={saving ? 'saving' : dirty ? 'dirty' : 'saved'}>
                        {saving ? 'Đang lưu…' : dirty ? 'Chưa lưu' : filled > 0 ? isGuest ? 'Nháp trong tab' : 'Đã lưu' : ''}
                    </p>
                </div>

                <div className="nrows">
                    {rows.map((row) => (
                        <div key={row.start} className="nrow">
                            <span className="nrow__no" aria-hidden="true">
                                {row.start + 1}
                            </span>
                            <div className="nrow__cells">
                                {row.indices.map((index) => (
                                    <label key={index} className="ncell" data-current={selected === index} data-filled={answers[index] !== null}>
                                        <input
                                            ref={(element) => {
                                                refs.current[index] = element;
                                            }}
                                            aria-label={`Chữ số ${index + 1}`}
                                            inputMode="numeric"
                                            type="text"
                                            pattern="[0-9]*"
                                            autoComplete="off"
                                            spellCheck={false}
                                            disabled={disabled}
                                            value={answers[index] ?? ''}
                                            onFocus={(event) => {
                                                setSelected(index);
                                                event.target.select();
                                            }}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                if (value === '') {
                                                    const next = [...answers];
                                                    next[index] = null;
                                                    edit(next);
                                                } else if (/^[0-9]+$/.test(value)) {
                                                    enterDigit(value.slice(-1), index);
                                                }
                                            }}
                                            onPaste={(event) => {
                                                event.preventDefault();
                                                const digits = event.clipboardData.getData('text').replace(/\s/g, '');
                                                if (!/^[0-9]+$/.test(digits)) return;
                                                const next = [...answers];
                                                [...digits].slice(0, next.length - index).forEach((digit, offset) => {
                                                    next[index + offset] = digit;
                                                });
                                                edit(next);
                                                focus(Math.min(next.length - 1, index + digits.length));
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return;
                                                if (/^[0-9]$/.test(event.key)) {
                                                    event.preventDefault();
                                                    enterDigit(event.key, index);
                                                } else if (event.key === 'ArrowLeft') {
                                                    event.preventDefault();
                                                    focus(index - 1);
                                                } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
                                                    event.preventDefault();
                                                    focus(index + 1);
                                                } else if (event.key === 'Backspace') {
                                                    event.preventDefault();
                                                    backspace(index);
                                                } else if (event.key === 'Delete') {
                                                    event.preventDefault();
                                                    const next = [...answers];
                                                    next[index] = null;
                                                    edit(next);
                                                } else if (event.key === '+' || event.key === 'Insert') {
                                                    event.preventDefault();
                                                    insert(index);
                                                } else if (event.key === '-') {
                                                    event.preventDefault();
                                                    remove(index);
                                                }
                                            }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <section className="deck nkeys" aria-labelledby="nkeys-title">
                <h2 id="nkeys-title" className="sr-only">
                    Bàn phím số
                </h2>
                <div className="nkeys__digits">
                    {'1234567890'.split('').map((digit) => (
                        <button key={digit} type="button" disabled={disabled} onClick={() => enterDigit(digit, selected)}>
                            {digit}
                        </button>
                    ))}
                </div>
                <div className="nkeys__tools">
                    <button type="button" disabled={disabled} onClick={() => focus(selected - 1)}>
                        <ChevronLeft size={18} aria-hidden="true" />
                        Ô trước
                    </button>
                    <button type="button" disabled={disabled} onClick={() => focus(selected + 1)}>
                        Ô sau
                        <ChevronRight size={18} aria-hidden="true" />
                    </button>
                    <button type="button" disabled={disabled} onClick={() => backspace(selected)}>
                        <Delete size={18} aria-hidden="true" />
                        Xoá
                    </button>
                    <button type="button" disabled={disabled} onClick={() => insert(selected)}>
                        Chèn ô trống
                    </button>
                    <button type="button" disabled={disabled} onClick={() => remove(selected)}>
                        Xoá ô
                    </button>
                </div>
            </section>

            <PlayHints hints={HINTS} />
        </>
    );
};
