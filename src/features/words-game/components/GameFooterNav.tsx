interface GameFooterNavProps {
    onFirst: () => void;
    onPrev: () => void;
    onNext: () => void;
    isFirst: boolean;
    isLast: boolean;
    firstLabel?: string;
    prevLabel?: string;
    nextLabel?: string;
}

export const GameFooterNav = ({
    onFirst,
    onPrev,
    onNext,
    isFirst,
    isLast,
    firstLabel = "Về đầu",
    prevLabel = "← Từ trước",
    nextLabel = "Từ sau →",
}: GameFooterNavProps) => {
    return (
        <footer className="flex flex-col items-center justify-center gap-3 border-t border-[#e0eee6] bg-white px-6 py-4">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onFirst}
                    disabled={isFirst}
                    className="rounded-xl border border-[#e0eee6] bg-white px-4 py-2 text-xs font-bold text-[#202b39] shadow-xs transition hover:border-[#1a7a4a] hover:text-[#1a7a4a] disabled:opacity-30 cursor-pointer"
                >
                    {firstLabel}
                </button>
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={isFirst}
                    className="rounded-xl border border-[#e0eee6] bg-white px-5 py-2 text-xs font-bold text-[#202b39] shadow-xs transition hover:border-[#1a7a4a] hover:text-[#1a7a4a] disabled:opacity-30 cursor-pointer"
                >
                    {prevLabel}
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={isLast}
                    className="rounded-xl border border-[#e0eee6] bg-white px-5 py-2 text-xs font-bold text-[#202b39] shadow-xs transition hover:border-[#1a7a4a] hover:text-[#1a7a4a] disabled:opacity-30 cursor-pointer"
                >
                    {nextLabel}
                </button>
            </div>

            <p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#77839a]">
                <kbd className="rounded border border-[#e0eee6] bg-[#f5faf7] px-1.5 py-0.5 font-mono text-[10px]">←</kbd>
                <kbd className="rounded border border-[#e0eee6] bg-[#f5faf7] px-1.5 py-0.5 font-mono text-[10px]">→</kbd>
                <span>để chuyển từ</span>
                <span className="mx-1 text-[#c8d8d0]">•</span>
                <kbd className="rounded border border-[#e0eee6] bg-[#f5faf7] px-1.5 py-0.5 font-mono text-[10px]">Space</kbd>
                <span>về đầu</span>
                <span className="mx-1 text-[#c8d8d0]">•</span>
                <kbd className="rounded border border-[#e0eee6] bg-[#f5faf7] px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
                <span>khi đã nhớ xong</span>
            </p>
        </footer>
    );
};

