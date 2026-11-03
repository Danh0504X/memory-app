import type { ReactNode } from "react";

interface GameHeaderProps {
    gameName: string;
    level: number | null;   // null với ván tự chọn số lượng
    subtitle: string;
    formattedTime?: string;
    actionButtonText?: ReactNode;
    onAction?: () => void;
    onReset: () => void;
    actionButtonColor?: string;
}

export const GameHeader = ({
    gameName,
    level,
    subtitle,
    formattedTime,
    actionButtonText,
    onAction,
    onReset,
    actionButtonColor = "#1a7a4a",
}: GameHeaderProps) => {
    return (
        <header className="flex items-center justify-between gap-4 border-b border-[#e0eee6] bg-white px-6 py-3">
            <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-[#1a7a4a]">{gameName}</span>
                    <span className="text-[#c8d8d0]">•</span>
                    <span className="rounded-full bg-[#e6f7ed] px-2.5 py-0.5 text-xs font-semibold text-[#1a7a4a]">
                        {level === null ? "Tự chọn" : `Cấp độ ${level}`}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#77839a]">{subtitle}</p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
                {actionButtonText && onAction && (
                    <button
                        type="button"
                        onClick={onAction}
                        style={{ backgroundColor: actionButtonColor }}
                        className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95 cursor-pointer"
                    >
                        {actionButtonText}
                    </button>
                )}

                {formattedTime !== undefined && (
                    <div className="flex items-center gap-1.5 rounded-full border border-[#e0eee6] bg-white px-4 py-1.5 font-mono text-sm font-semibold">
                        ⏱ <span className="text-[#1a7a4a]">{formattedTime}</span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onReset}
                    className="rounded-full border border-[#e0eee6] bg-white px-4 py-1.5 text-sm font-medium text-[#77839a] transition hover:border-[#1a7a4a] hover:text-[#1a7a4a] cursor-pointer"
                >
                    Thoát
                </button>
            </div>
        </header>
    );
};
