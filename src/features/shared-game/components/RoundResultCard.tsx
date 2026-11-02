import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { CompletedRound, RecordKey, RoundResult } from "../api/games.api";
import { formatSeconds } from "../utils/formatTime";

const RESULT_META: Record<RoundResult, { label: string; color: string; glow: string }> = {
    perfect: { label: "Hoàn hảo!", color: "#1a7a4a", glow: "radial-gradient(circle, #a8e0c4, #d4f0e0)" },
    pass: { label: "Đạt", color: "#2a78d6", glow: "radial-gradient(circle, #bfdbfe, #e0efff)" },
    fail: { label: "Chưa đạt", color: "#e45454", glow: "radial-gradient(circle, #fca5a5, #fee2e2)" },
};

const RECORD_LABELS: Record<RecordKey, string> = {
    bestLevel: "Cấp cao nhất mới",
    fastestMemorize: "Ghi nhớ nhanh nhất ở cấp này",
};

interface RoundResultCardProps {
    round: CompletedRound;
    maxLevel: number;
    onPlayAgain: () => void;
    onReset: () => void;
}

// Kết quả và phần thưởng đều do backend chấm, thẻ này chỉ hiển thị
export const RoundResultCard = ({ round, maxLevel, onPlayAgain, onReset }: RoundResultCardProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    // rewards null: ván của khách, không có EXP, kỷ lục hay chuỗi ngày chơi
    const { result, rewards, rules, unlockedLevel } = round;
    const meta = RESULT_META[result.result];
    const percentage = Math.round(result.accuracy * 100);
    const unlocked = unlockedLevel.after > unlockedLevel.before;
    // Chơi lại cấp đã vượt qua thì không mở thêm cấp nào
    const isReplay = rules.mode === "level" && rules.gameLevel !== null && rules.gameLevel < unlockedLevel.before;
    const leveledUp = rewards !== null && rewards.userLevel.after > rewards.userLevel.before;
    const conqueredMax = result.result === "perfect" && rules.mode === "level" && rules.gameLevel === maxLevel;
    const breakdown = rewards?.exp.breakdown;
    const expLines = breakdown
        ? [
              { label: "Kết quả ván", value: breakdown.round },
              { label: "Hoàn hảo", value: breakdown.perfectBonus },
              { label: "Ván đầu tiên hôm nay", value: breakdown.firstGameOfDayBonus },
              { label: "Phá kỷ lục", value: breakdown.newRecordBonus },
          ].filter((line) => line.value > 0)
        : [];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") onPlayAgain();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onPlayAgain]);

    return (
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#e0eee6] bg-white p-8 text-center shadow-sm">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full opacity-40 blur-2xl"
                style={{ background: meta.glow }}
            />

            <p className="mb-1 text-sm font-extrabold uppercase tracking-wide" style={{ color: meta.color }}>
                {meta.label}
            </p>
            <div className="mb-1 text-6xl font-extrabold" style={{ color: meta.color }}>
                {result.correctItems}
                <span className="text-2xl font-medium text-[#77839a]">/{result.totalItems}</span>
            </div>
            <div className="mb-4 text-sm font-semibold text-[#77839a]">
                Độ chính xác:{" "}
                <span className="font-extrabold" style={{ color: meta.color }}>
                    {percentage}%
                </span>
            </div>
            <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-[#e6f7ed]">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%`, backgroundColor: meta.color }}
                />
            </div>

            {/* Phần thưởng */}
            {rewards ? (
                <div className="mb-5 rounded-xl bg-[#fff7df] p-4 text-left">
                    <p className="text-center text-2xl font-extrabold text-[#92400e]">+{rewards.exp.total} EXP</p>
                    {expLines.length > 1 && (
                        <ul className="mt-2 space-y-0.5 text-[12px] text-[#78716c]">
                            {expLines.map((line) => (
                                <li key={line.label} className="flex justify-between">
                                    <span>{line.label}</span>
                                    <span className="font-bold">+{line.value}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[12px] font-bold">
                        {rewards.newRecords.map((record) => (
                            <span key={record} className="rounded-full bg-[#fef3c7] px-2.5 py-1 text-[#92400e]">
                                🏅 {RECORD_LABELS[record]}
                            </span>
                        ))}
                        {leveledUp && (
                            <span className="rounded-full bg-[#eaf8ef] px-2.5 py-1 text-[#1a7a4a]">
                                ⭐ Lên cấp tài khoản {rewards.userLevel.after}
                            </span>
                        )}
                        {rewards.streak.currentStreak > 0 && (
                            <span className="rounded-full bg-[#ffedd5] px-2.5 py-1 text-[#c2410c]">
                                🔥 Chuỗi {rewards.streak.currentStreak} ngày
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <p className="mb-5 rounded-xl bg-[#eff4ff] p-4 text-[13px] leading-relaxed text-[#40493d]">
                    Bạn đang chơi với tư cách khách nên ván này không tính EXP, kỷ lục hay chuỗi ngày chơi.{" "}
                    {/* Thoát ván trước khi rời trang, để đăng nhập xong quay lại màn chọn cấp độ */}
                    <Link
                        to="/login"
                        state={{ from: location }}
                        onClick={onReset}
                        className="font-bold text-[#2e7d32] hover:underline"
                    >
                        Đăng nhập
                    </Link>{" "}
                    để lưu tiến độ.
                </p>
            )}

            {unlocked && (
                <p className="mb-4 text-sm font-semibold text-[#1a7a4a]">
                    🎉 Tuyệt vời! Bạn đã mở khoá <strong>Cấp độ {unlockedLevel.after}</strong>
                </p>
            )}
            {!unlocked && conqueredMax && (
                <p className="mb-4 text-sm font-semibold text-[#1a7a4a]">🏆 Chúc mừng! Bạn đã chinh phục cấp độ cao nhất!</p>
            )}
            {result.result !== "perfect" && !isReplay && (
                <p className="mb-4 text-sm text-[#77839a]">Nhớ đúng tất cả để mở khoá cấp độ mới. Cố lên nhé!</p>
            )}

            <p className="mb-5 text-[12px] text-[#77839a]">
                Ghi nhớ {formatSeconds(result.memorizeSec)} · Nhớ lại {formatSeconds(result.recallSec)}
            </p>

            <div className="flex flex-col gap-2.5">
                <button
                    type="button"
                    onClick={onPlayAgain}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-bold text-white shadow-md transition hover:shadow-lg active:scale-95 cursor-pointer"
                    style={{ backgroundColor: "#1a7a4a" }}
                >
                    {unlocked ? `Chơi Cấp độ ${unlockedLevel.after}` : "Chơi ván mới"}
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
