import { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';

// Khớp với EXP_RULES ở backend (memory-be/src/config/progression.ts); đổi ở đó thì sửa cả ở đây
const EXP_WAYS = [
    ['Mỗi lá hoặc hình nhớ đúng', '+3'],
    ['Ván hoàn hảo', '+10'],
    ['Ván đầu tiên trong ngày', '+10'],
    ['Lập kỷ lục mới', '+20'],
] as const;

// "Cách nhận EXP" là thông tin tra cứu, ít khi cần: nằm sau một nút nhỏ cạnh thanh EXP thay vì chiếm cả một khối
export const ExpHelp = () => {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const panelId = useId();

    // Bấm ra ngoài hoặc Esc thì đóng
    useEffect(() => {
        if (!open) return;
        const onPointer = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="exp-help" ref={root}>
            <button
                type="button"
                className="exp-help__toggle"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((value) => !value)}
            >
                <CircleHelp size={16} aria-hidden="true" />
                Cách nhận EXP
            </button>
            <div id={panelId} className="exp-help__panel" hidden={!open}>
                <dl>
                    {EXP_WAYS.map(([way, amount]) => (
                        <div key={way}>
                            <dt>{way}</dt>
                            <dd>{amount}</dd>
                        </div>
                    ))}
                </dl>
                <p>Ván chưa đạt vẫn nhận một nửa số EXP theo số đã nhớ đúng.</p>
            </div>
        </div>
    );
};
