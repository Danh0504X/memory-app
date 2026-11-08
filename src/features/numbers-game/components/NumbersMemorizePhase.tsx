import { useEffect, useRef, useState } from 'react';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { getDigitGroups } from '../utils/numberUtils';

export const NumbersMemorizePhase = () => {
    const { session, preferences, hidden, recall, busy } = useNumbersGameStore();
    const [index, setIndex] = useState(0);
    const lastEndPress = useRef(0);
    const groups = getDigitGroups(session?.digits ?? [], preferences.groups);
    const current = groups[Math.min(index, groups.length - 1)];

    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if (busy || hidden || event.repeat) return;
            if (event.target instanceof HTMLButtonElement && ["Enter", " "].includes(event.key)) return;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Enter'].includes(event.key)) event.preventDefault();
            if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
            if (event.key === 'ArrowRight') {
                if (index === groups.length - 1) {
                    const now = Date.now();
                    if (lastEndPress.current && now - lastEndPress.current < 400) recall();
                    lastEndPress.current = now;
                } else {
                    lastEndPress.current = 0;
                    setIndex(index + 1);
                }
            }
            if (event.key === ' ' || event.key === 'ArrowUp') setIndex(0);
            if (event.key === 'Enter') recall();
        };
        window.addEventListener('keydown', keydown);
        return () => window.removeEventListener('keydown', keydown);
    }, [busy, hidden, index, groups.length, recall]);

    if (hidden || !current) return <p role="status" className="p-12 text-center text-lg text-[#586274]">Đang chuyển bước…</p>;

    const isFirst = index === 0;
    const isLast = index === groups.length - 1;

    // Không cuộn: Số sắp tới hiển thị bên phải. Khi next, số đã qua xếp sang bên trái.
    // Khi lùi lại, số gần nhất quay trở lại bên phải.
    const passedStart = Math.max(0, index - 5);
    const passedGroups = groups.slice(passedStart, index).map((group, offset) => ({
        group,
        groupIndex: passedStart + offset,
    }));

    const upcomingStart = index + 1;
    const upcomingGroups = groups.slice(upcomingStart, upcomingStart + 5).map((group, offset) => ({
        group,
        groupIndex: upcomingStart + offset,
    }));

    return <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-4 py-8 sm:py-12">
        {/* Stream 3 cột: [Đã qua (Trái)] - [Số hiện tại (Giữa)] - [Sắp tới (Phải)] */}
        <div className="flex w-full max-w-3xl items-center justify-center gap-3 sm:gap-6">
            {/* Cột các nhóm số đã đi qua (bên trái) */}
            <div
                aria-label="Các số đã qua"
                className="flex w-16 sm:w-24 shrink-0 flex-col items-center justify-center gap-2"
            >
                {passedGroups.map(({ group, groupIndex }) => (
                    <button
                        key={group.start}
                        type="button"
                        onClick={() => setIndex(groupIndex)}
                        title={`Về nhóm số ${group.digits.join('')}`}
                        className="w-full rounded-xl border border-[#d2e4db] bg-[#edf6f1] py-2 text-center font-mono text-sm sm:text-base font-bold text-[#2d5a3f] shadow-2xs transition hover:border-[#1a7a4a] hover:bg-[#e0f1e8] cursor-pointer select-none"
                    >
                        {group.digits.join('')}
                    </button>
                ))}
            </div>

            {/* Khung số chính ở trung tâm */}
            <div className="flex min-h-48 flex-1 max-w-sm sm:max-w-md items-center justify-center rounded-[32px] border border-[#e0eee6] bg-white px-6 py-10 shadow-md sm:min-h-56">
                <span className="break-all text-center font-mono text-6xl font-extrabold tracking-widest text-[#202b39] sm:text-7xl">
                    {current.digits.join('')}
                </span>
            </div>

            {/* Cột các nhóm số sắp tới (bên phải) */}
            <div
                aria-label="Các số sắp tới"
                className="flex w-16 sm:w-24 shrink-0 flex-col items-center justify-center gap-2"
            >
                {upcomingGroups.map(({ group, groupIndex }) => (
                    <button
                        key={group.start}
                        type="button"
                        onClick={() => setIndex(groupIndex)}
                        title={`Nhảy tới nhóm số ${group.digits.join('')}`}
                        className="w-full rounded-xl border border-[#e0eee6] bg-white py-2 text-center font-mono text-sm sm:text-base font-bold text-[#586274] shadow-2xs transition hover:border-[#1a7a4a] hover:text-[#0d631b] hover:bg-[#f6fcf8] cursor-pointer select-none"
                    >
                        {group.digits.join('')}
                    </button>
                ))}
            </div>
        </div>

        {/* 3 nút điều hướng: Về đầu | Trước | Tiếp */}
        <div className="flex items-center justify-center gap-3">
            <button
                type="button"
                disabled={isFirst}
                onClick={() => setIndex(0)}
                title="Về đầu (Space / ↑)"
                aria-label="Về đầu"
                className="flex h-12 w-14 cursor-pointer items-center justify-center rounded-xl border border-[#b9cfc3] bg-[#e6f7ed] text-lg font-bold text-[#1a7a4a] shadow-xs transition hover:bg-[#d7f1e4] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                |◀◀
            </button>
            <button
                type="button"
                disabled={isFirst}
                onClick={() => setIndex(Math.max(0, index - 1))}
                title="Trước (←)"
                aria-label="Trước"
                className="flex h-12 w-16 cursor-pointer items-center justify-center rounded-xl border border-[#b9cfc3] bg-[#e6f7ed] text-xl font-bold text-[#1a7a4a] shadow-xs transition hover:bg-[#d7f1e4] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                ◀
            </button>
            <button
                type="button"
                disabled={isLast}
                onClick={() => setIndex(Math.min(groups.length - 1, index + 1))}
                title="Tiếp (→)"
                aria-label="Tiếp"
                className="flex h-12 w-16 cursor-pointer items-center justify-center rounded-xl border border-[#1a7a4a] bg-[#1a7a4a] text-xl font-bold text-white shadow-sm transition hover:bg-[#15633b] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                ▶
            </button>
        </div>
    </main>;
};
