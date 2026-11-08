import type { ReactNode } from "react";
import { LoaderCircle, X } from "lucide-react";

interface GameHeaderProps {
    gameName: string;
    level: number | null;   // null với ván tự chọn số lượng
    status: string;         // việc đang làm, ví dụ "Ghi nhớ · lá 2 trên 9"
    progress?: number;      // 0..1, thanh tiến độ dưới dòng trạng thái
    timeLeft?: number;      // giây còn lại; bỏ trống để ẩn đồng hồ
    timeLimit?: number;
    actionLabel?: ReactNode;
    onAction?: () => void;
    actionBusy?: boolean;
    onReset: () => void;
}

const RING = 2 * Math.PI * 15;

const formatClock = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

// Thanh trên cùng khi đang chơi: ai, đang làm gì, còn bao lâu, và một nút để đi tiếp
export const GameHeader = ({
    gameName,
    level,
    status,
    progress,
    timeLeft,
    timeLimit,
    actionLabel,
    onAction,
    actionBusy = false,
    onReset,
}: GameHeaderProps) => {
    const share = timeLeft !== undefined && timeLimit ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 1;

    return (
        <header className="play__bar">
            <div className="play__who">
                <strong>{gameName}</strong>
                <span className="play__level">{level === null ? "Tự chọn" : `Cấp ${level}`}</span>
            </div>

            <div className="play__progress">
                <p aria-live="polite">{status}</p>
                {progress !== undefined && (
                    <div className="play__meter" aria-hidden="true">
                        <span style={{ transform: `scaleX(${progress})` }} />
                    </div>
                )}
            </div>

            <div className="play__actions">
                {timeLeft !== undefined && (
                    <div className="play__timer" data-urgent={timeLeft <= 10} aria-label={`Còn ${formatClock(timeLeft)}`}>
                        <svg viewBox="0 0 36 36" aria-hidden="true">
                            <circle cx="18" cy="18" r="15" />
                            <circle cx="18" cy="18" r="15" strokeDasharray={RING} strokeDashoffset={RING * (1 - share)} />
                        </svg>
                        <span aria-hidden="true">{formatClock(timeLeft)}</span>
                    </div>
                )}

                {actionLabel && onAction && (
                    <button type="button" onClick={onAction} disabled={actionBusy} className="btn btn--brand play__go">
                        {actionBusy && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
                        {actionLabel}
                    </button>
                )}

                <button type="button" onClick={onReset} className="play__quit" aria-label="Thoát ván">
                    <X size={18} aria-hidden="true" />
                    <span>Thoát</span>
                </button>
            </div>
        </header>
    );
};
