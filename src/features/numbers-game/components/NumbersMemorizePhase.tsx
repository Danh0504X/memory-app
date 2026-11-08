import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlayHints } from '@/features/shared-game/components/PlayHints';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { getDigitGroups } from '../utils/numberUtils';

const HINTS = [
    { keys: ['←', '→'], label: 'chuyển nhóm' },
    { keys: ['Space'], label: 'về nhóm đầu' },
    { keys: ['Enter'], label: 'đã nhớ xong' },
];

// Bàn ghi nhớ: nhóm số đang xem ở giữa, hai nút lật lớn hai bên, dải mọi nhóm bên dưới (nhóm chưa xem thì úp)
export const NumbersMemorizePhase = () => {
    const { session, preferences, hidden, recall, busy } = useNumbersGameStore();
    const [index, setIndex] = useState(0);
    const [seenTo, setSeenTo] = useState(0);
    const lastEndPress = useRef(0);
    const reel = useRef<HTMLOListElement>(null);
    const groups = getDigitGroups(session?.digits ?? [], preferences.groups);
    const last = groups.length - 1;
    const current = groups[Math.min(index, last)];

    // Nhóm xa nhất đã xem: các nhóm tới đó lật ngửa trên dải
    if (index > seenTo) setSeenTo(index);

    const go = (next: number) => setIndex(Math.max(0, Math.min(last, next)));

    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if (busy || hidden || event.repeat) return;
            if (event.target instanceof HTMLButtonElement && ['Enter', ' '].includes(event.key)) return;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Enter'].includes(event.key)) event.preventDefault();
            if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
            if (event.key === 'ArrowRight') {
                // Ở nhóm cuối, bấm → hai lần liền nhau là đã nhớ xong
                if (index === last) {
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
    }, [busy, hidden, index, last, recall]);

    // Giữ nhóm đang xem trong tầm nhìn của dải khi dãy dài
    useEffect(() => {
        reel.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [index]);

    if (hidden || !current) {
        return (
            <main className="play__table">
                <p role="status" className="nwait__lead">Đang chuyển bước…</p>
            </main>
        );
    }

    return (
        <>
            <main className="play__table">
                <div className="stage">
                    <button type="button" className="stage__arrow" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Nhóm trước">
                        <ChevronLeft size={30} aria-hidden="true" />
                    </button>

                    {/* key theo nhóm: mỗi lần chuyển, nhóm mới được chia ra lại */}
                    <div className="stage__group" key={index}>
                        <div className="stage__item deal-in">
                            <div className="ngroup" aria-label={`Nhóm ${index + 1}: ${current.digits.join(' ')}`}>
                                {current.digits.map((digit, offset) => (
                                    <span key={offset} className="ngroup__digit">
                                        {digit}
                                    </span>
                                ))}
                            </div>
                            <p className="stage__num">
                                Nhóm {index + 1} / {groups.length} · chữ số {current.start + 1}–{current.start + current.digits.length}
                            </p>
                        </div>
                    </div>

                    <button type="button" className="stage__arrow" onClick={() => go(index + 1)} disabled={index === last} aria-label="Nhóm sau">
                        <ChevronRight size={30} aria-hidden="true" />
                    </button>
                </div>

                <ol className="reel" ref={reel} aria-label={`Tất cả ${groups.length} nhóm`}>
                    {groups.map((group, groupIndex) => {
                        const seen = groupIndex <= seenTo;
                        return (
                            <li key={group.start}>
                                <button
                                    type="button"
                                    className="nchip"
                                    data-back={!seen}
                                    aria-current={groupIndex === index}
                                    aria-label={seen ? `Nhóm ${groupIndex + 1}: ${group.digits.join(' ')}` : `Nhóm ${groupIndex + 1}, chưa xem`}
                                    onClick={() => go(groupIndex)}
                                >
                                    {seen ? group.digits.join('') : ''}
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </main>
            <PlayHints hints={HINTS} />
        </>
    );
};
