import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, LoaderCircle, Lock, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/features/auth/store/authStore";
import { GameGuideModal } from "@/features/cards-game/components/GameGuideModal";
import type { GameCatalogItem } from "../api/games.api";
import { formatSeconds } from "../utils/formatTime";
import { LevelTableModal } from "./LevelTableModal";

const getLevelLabel = (level: number) => {
    if (level <= 3) return "Mức căn bản";
    if (level <= 6) return "Mức trung cấp";
    return "Mức nâng cao";
};

interface RoundSettingsProps {
    title: string;
    itemUnit: string;               // ví dụ: "thẻ bài" hoặc "hình ảnh"
    game: GameCatalogItem;          // Luật chơi và level đã mở, lấy từ backend
    customItemCount: number | null; // null: chơi theo cấp độ; số: ván tự chọn với số lượng này
    selectedLevel: number | null;   // null: cấp cao nhất đã mở
    onSelectLevel: (level: number | null) => void;
    memorizeSec: number;
    onMemorizeSecChange: (seconds: number) => void;
    onStart: (gameLevel: number) => void;
    isStarting: boolean;
    error: string | null;
    onOpenPreferences?: () => void;
}

export const RoundSettings = ({
    title,
    itemUnit,
    game,
    customItemCount,
    selectedLevel,
    onSelectLevel,
    memorizeSec,
    onMemorizeSecChange,
    onStart,
    isStarting,
    error,
    onOpenPreferences,
}: RoundSettingsProps) => {
    const [activeTab, setActiveTab] = useState("Tiêu chuẩn");
    const [showLevels, setShowLevels] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const isGuest = !useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    const unlockedLevel = game.player?.unlockedLevel ?? 1;
    // Cấp đã chọn có thể không còn mở (đổi tài khoản, tiến độ khách hết hạn): quay về cấp cao nhất đã mở
    const level = selectedLevel !== null && selectedLevel <= unlockedLevel ? selectedLevel : unlockedLevel;
    const isCustom = customItemCount !== null;
    const isReplay = !isCustom && level < unlockedLevel;
    const itemCount = customItemCount ?? game.levels[level - 1]?.itemCount ?? 0;
    const passPercent = Math.round(game.passAccuracy * 100);

    let goal = `Ghi nhớ và chọn đúng tất cả để mở khóa cấp độ ${level + 1} nhé!`;
    if (isCustom) goal = "Đây là ván tự chọn số lượng nên không mở khoá cấp độ mới và không tính kỷ lục.";
    else if (isReplay) goal = `Bạn đang chơi lại cấp độ đã mở để luyện tập. Chỉ ván ở cấp độ ${unlockedLevel} mới mở khoá cấp tiếp theo.`;
    else if (level >= game.maxLevel) goal = "Bạn đang ở cấp độ cao nhất, hãy thử ghi nhớ nhanh hơn để phá kỷ lục!";

    return (
        <>
            <Header />
            <main className="min-h-screen bg-[#f6fcf8] px-4 py-8 font-sans text-[#121c2a]">
                <div className="mx-auto flex max-w-4xl flex-col items-start gap-6">
                    <header className="flex w-full items-center justify-between">
                        <h1 className="text-[40px] font-extrabold tracking-[-1px] text-[#0d631b]">{title}</h1>
                        <button
                            type="button"
                            onClick={() => setShowLevels(true)}
                            className="flex items-center gap-1.5 rounded-full bg-[#eff4ff] px-4 py-1.5 text-[13px] font-bold text-[#40493d] shadow-sm transition hover:bg-[#dfe9fb] cursor-pointer"
                        >
                            <span>💡</span>
                            <span>Giải thích cấp độ</span>
                        </button>
                    </header>

                    <LevelTableModal
                        isOpen={showLevels}
                        onClose={() => setShowLevels(false)}
                        gameTitle={title}
                        itemUnit={itemUnit}
                        game={game}
                    />
                    <GameGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

                    <div className="flex w-full flex-wrap items-center justify-between gap-4">
                        <nav className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowGuide(true)}
                                className="flex items-center gap-1.5 rounded-full bg-[#dee9fc] px-5 py-2 text-[14px] font-bold text-[#121c2a] shadow-sm hover:bg-[#d0e0fb] cursor-pointer"
                            >
                                📖 Hướng dẫn
                            </button>
                            {onOpenPreferences && (
                                <button
                                    type="button"
                                    onClick={onOpenPreferences}
                                    className="flex items-center gap-1.5 rounded-full bg-[#dee9fc] px-5 py-2 text-[14px] font-bold text-[#121c2a] shadow-sm hover:bg-[#d0e0fb] cursor-pointer"
                                >
                                    ⚙️ Tùy chọn
                                </button>
                            )}
                        </nav>

                        <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-[0px_8px_30px_rgba(0,0,0,0.05)]">
                            {["Tiêu chuẩn", "Thử thách ngày"].map((tab) => {
                                const isActive = activeTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex items-center gap-1.5 rounded-[48px] px-5 py-2 text-[14px] font-bold transition-all cursor-pointer ${isActive
                                            ? "bg-[#2e7d32] text-[#cbffc2] shadow-sm"
                                            : "text-[#40493d] hover:bg-[#f3f8f4]"
                                            }`}
                                    >
                                        <span>{tab === "Tiêu chuẩn" ? "★" : "🏆"}</span>
                                        <span>{tab}</span>
                                        {tab === "Thử thách ngày" && (
                                            <span className="rounded-full bg-[#ffdf97] px-2 py-0.5 text-[11px] font-bold text-[#251a00]">
                                                Mới
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <section className="relative w-full overflow-hidden rounded-[32px] bg-white p-8 shadow-[0px_2px_6px_rgba(0,0,0,0.05),0px_8px_30px_rgba(0,0,0,0.0a)]">
                        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#80f7d833] blur-[32px]" />

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-[28px] font-extrabold tracking-[-0.3px] text-[#121c2a]">
                                    {isCustom ? "Ván tự chọn" : `Cấp độ ${level}`}
                                </h2>
                                <span className="flex items-center gap-1.5 rounded-full bg-[#a3f69c] px-4 py-1 text-[13px] font-bold text-[#002204]">
                                    {isCustom ? `Đang mở cấp ${unlockedLevel}` : getLevelLabel(level)}
                                </span>

                                <div className="flex items-center gap-1 rounded-full bg-[#dee9fc] px-3 py-1 text-[13px] font-bold text-[#121c2a]">
                                    ⏱️
                                    {game.memorizeSecOptions.map((seconds) => (
                                        <button
                                            key={seconds}
                                            type="button"
                                            onClick={() => onMemorizeSecChange(seconds)}
                                            aria-pressed={memorizeSec === seconds}
                                            className={`rounded-full px-2 py-0.5 text-[12px] transition cursor-pointer ${memorizeSec === seconds
                                                ? "bg-[#2e7d32] text-white"
                                                : "hover:bg-[#cbffc2]"
                                                }`}
                                        >
                                            {formatSeconds(seconds)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chọn lại được mọi cấp đã mở; cấp chưa mở bị khoá cho tới khi vượt qua cấp trước */}
                            {!isCustom && (
                                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Chọn cấp độ">
                                    <span className="text-[13px] font-bold text-[#40493d]">Chọn cấp độ:</span>
                                    {game.levels.map(({ level: option }) => {
                                        const locked = option > unlockedLevel;
                                        const active = option === level;
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                disabled={locked}
                                                aria-pressed={active}
                                                aria-label={locked ? `Cấp độ ${option}, chưa mở khoá` : `Cấp độ ${option}`}
                                                onClick={() => onSelectLevel(option === unlockedLevel ? null : option)}
                                                className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-3 text-[13px] font-bold transition ${active
                                                    ? "bg-[#2e7d32] text-white shadow-sm"
                                                    : locked
                                                        ? "cursor-not-allowed bg-[#f2f4f7] text-[#98a2b3]"
                                                        : "cursor-pointer bg-[#eaf8ef] text-[#1a7a4a] hover:bg-[#cbffc2]"
                                                    }`}
                                            >
                                                {locked && <Lock size={12} aria-hidden="true" />}
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <p className="max-w-xl text-[18px] leading-[29px] text-[#40493d]">
                                Bạn có <strong className="font-bold text-[#0d631b]">{itemCount} {itemUnit}</strong> cần ghi nhớ.{" "}
                                {goal}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-bold text-[#40493d]">
                                <span>Mở khoá cấp mới: đúng 100%</span>
                                <span>Đạt: từ {passPercent}%</span>
                                <span>Thời gian nhớ lại: {formatSeconds(game.recallSec)}</span>
                                {game.player?.bestLevel && <span>Cấp cao nhất đã hoàn hảo: {game.player.bestLevel}</span>}
                            </div>

                            {isGuest && (
                                <p className="max-w-xl rounded-2xl bg-[#eff4ff] px-4 py-3 text-[14px] leading-relaxed text-[#40493d]">
                                    Bạn đang chơi với tư cách khách: cấp độ đã mở chỉ được giữ tạm trên trình duyệt này, không
                                    nhận EXP và không lưu lịch sử.{" "}
                                    {/* Truyền trang hiện tại để đăng nhập xong quay lại đúng trò chơi */}
                                    <Link to="/login" state={{ from: location }} className="font-bold text-[#2e7d32] hover:underline">
                                        Đăng nhập
                                    </Link>{" "}
                                    để lưu tiến độ.
                                </p>
                            )}

                            {error && (
                                <p role="alert" className="flex items-center gap-2 text-[14px] font-semibold text-[#b42318]">
                                    <AlertCircle size={16} aria-hidden="true" />
                                    {error}
                                </p>
                            )}

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => onStart(level)}
                                    disabled={isStarting}
                                    className="flex items-center justify-center gap-2 rounded-full bg-[#2e7d32] px-8 py-4 text-[18px] font-bold text-white shadow-[0px_8px_20px_rgba(46,125,50,0.3),0px_4px_0px_#1b5e20] transition hover:bg-[#236527] active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-80 cursor-pointer"
                                >
                                    {isStarting && <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />}
                                    <span>{isStarting ? "Đang chuẩn bị..." : "Bắt đầu"}</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
};

interface RoundSettingsStatusProps {
    title: string;
    status: "idle" | "loading" | "ready" | "error";
    error: string | null;
    onRetry: () => void;
}

// Hiện trong lúc chưa có luật chơi từ backend
export const RoundSettingsStatus = ({ title, status, error, onRetry }: RoundSettingsStatusProps) => (
    <>
        <Header />
        <main className="min-h-screen bg-[#f6fcf8] px-4 py-8 font-sans text-[#121c2a]">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-6">
                <h1 className="text-[40px] font-extrabold tracking-[-1px] text-[#0d631b]">{title}</h1>
                <section className="w-full rounded-[32px] bg-white p-10 text-center shadow-[0px_8px_30px_rgba(0,0,0,0.05)]">
                    {status === "error" ? (
                        <div role="alert">
                            <p className="flex items-center justify-center gap-2 text-[15px] font-semibold text-[#b42318]">
                                <AlertCircle size={18} aria-hidden="true" />
                                {error ?? "Không thể tải thông tin trò chơi."}
                            </p>
                            <button
                                type="button"
                                onClick={onRetry}
                                className="mx-auto mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-[#e3ebe6] px-5 text-[14px] font-bold text-[#2e7d32] transition hover:bg-[#f3f8f4] cursor-pointer"
                            >
                                <RefreshCw size={15} aria-hidden="true" />
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        <p className="flex items-center justify-center gap-2 text-[15px] text-[#667085]">
                            <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                            Đang tải thông tin trò chơi...
                        </p>
                    )}
                </section>
            </div>
        </main>
    </>
);
