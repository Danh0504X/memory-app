import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface GameResultCardProps {
    correctCount: number;
    totalCount: number;
    level: number;
    maxLevel?: number;
    onPlayAgain: () => void;
    onReset: () => void;
}

export const GameResultCard = ({
    correctCount,
    totalCount,
    level,
    maxLevel = 10,
    onPlayAgain,
    onReset,
}: GameResultCardProps) => {
    const navigate = useNavigate();
    const isPerfect = correctCount === totalCount;
    const percentage = Math.round((correctCount / totalCount) * 100);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") onPlayAgain();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onPlayAgain]);

    return (
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 text-center shadow-sm border border-[#e0eee6]">
            {/* Blob màu nền trang trí */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full opacity-40 blur-2xl"
                style={{
                    background: isPerfect
                        ? "radial-gradient(circle, #a8e0c4, #d4f0e0)"
                        : "radial-gradient(circle, #fca5a5, #fee2e2)",
                }}
            />

            {/* Điểm số */}
            <div
                className="mb-1 text-6xl font-extrabold"
                style={{ color: isPerfect ? "#1a7a4a" : "#e45454" }}
            >
                {correctCount}
                <span className="text-2xl font-medium text-[#77839a]">
                    /{totalCount}
                </span>
            </div>

            <div className="mb-4 text-sm font-semibold text-[#77839a]">
                Độ chính xác:{" "}
                <span
                    className="font-extrabold"
                    style={{ color: isPerfect ? "#1a7a4a" : "#e45454" }}
                >
                    {percentage}%
                </span>
            </div>

            {/* Thanh phần trăm tiến trình */}
            <div className="mb-6 h-2.5 w-full overflow-hidden rounded-full bg-[#e6f7ed]">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: isPerfect ? "#1a7a4a" : "#e45454",
                    }}
                />
            </div>

            {/* Thông báo kết quả */}
            {isPerfect && level < maxLevel && (
                <p className="mb-4 text-sm font-semibold text-[#1a7a4a]">
                    🎉 Tuyệt vời! Bạn đã mở khoá <strong>Cấp độ {level + 1}</strong>
                </p>
            )}
            {isPerfect && level === maxLevel && (
                <p className="mb-4 text-sm font-semibold text-[#1a7a4a]">
                    🏆 Chúc mừng! Bạn đã chinh phục cấp độ cao nhất!
                </p>
            )}
            {!isPerfect && (
                <p className="mb-4 text-sm text-[#77839a]">
                    Hãy cố gắng hơn ở lần tiếp theo nhé!
                </p>
            )}

            {/* Các nút hành động */}
            <div className="flex flex-col gap-2.5">
                <button
                    type="button"
                    onClick={onPlayAgain}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-bold text-white shadow-md transition hover:shadow-lg active:scale-95 cursor-pointer"
                    style={{ backgroundColor: "#1a7a4a" }}
                >
                    {isPerfect && level < maxLevel ? "Chơi Cấp độ tiếp theo" : "Chơi lại cấp độ này"}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onReset();
                        navigate("/games");
                    }}
                    className="w-full rounded-xl border border-[#e0eee6] bg-white py-2.5 text-sm font-bold text-[#77839a] transition hover:border-[#1a7a4a] hover:text-[#1a7a4a] cursor-pointer"
                >
                    Trang chọn trò chơi
                </button>
            </div>

            <p className="mt-3 text-xs text-[#c8d8d0]">
                hoặc nhấn{" "}
                <kbd className="rounded border border-[#e0eee6] bg-[#f5faf7] px-1 py-0.5 font-mono text-[10px] text-[#77839a]">
                    Enter
                </kbd>
            </p>
        </div>
    );
};
