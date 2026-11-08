import { useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, ArrowLeft, BookOpen, Check, Info, LoaderCircle, Lock, Play, RefreshCw, SlidersHorizontal } from "lucide-react";
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

const FAN_MAX = 9;

// Quay về trang chọn trò chơi
const BackToGames = () => (
    <Link to="/games" viewTransition className="round__back">
        <ArrowLeft size={18} aria-hidden="true" />
        Chọn trò chơi
    </Link>
);

interface RoundSettingsProps {
    title: string;
    itemUnit: string;               // ví dụ: "thẻ bài" hoặc "hình ảnh"
    shortUnit: string;              // ví dụ: "lá" hoặc "hình", dùng trên ô cấp độ
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
    renderBack: () => ReactNode;    // mặt úp của một lá/hình, xoè ra cho biết số lượng cần nhớ
}

export const RoundSettings = ({
    title,
    itemUnit,
    shortUnit,
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
    renderBack,
}: RoundSettingsProps) => {
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
    const fanCount = Math.min(itemCount, FAN_MAX);

    let goal = `Nhớ đúng tất cả để mở khoá cấp độ ${level + 1}.`;
    if (isCustom) goal = "Ván tự chọn số lượng: không mở khoá cấp mới và không tính kỷ lục.";
    else if (isReplay) goal = `Chơi lại để luyện tập. Chỉ ván ở cấp độ ${unlockedLevel} mới mở khoá cấp tiếp theo.`;
    else if (level >= game.maxLevel) goal = "Đây là cấp cao nhất. Thử ghi nhớ nhanh hơn để phá kỷ lục!";

    return (
        <>
            <Header />
            <main className="round page-col">
                <BackToGames />
                <div className="round__head">
                    <div>
                        <h1>{title}</h1>
                        <p>Chọn cấp độ và thời gian ghi nhớ, rồi bắt đầu.</p>
                    </div>
                    <div className="round__tools">
                        <button type="button" className="tool" onClick={() => setShowGuide(true)}>
                            <BookOpen size={18} aria-hidden="true" />
                            Cách chơi
                        </button>
                        {onOpenPreferences && (
                            <button type="button" className="tool" onClick={onOpenPreferences}>
                                <SlidersHorizontal size={18} aria-hidden="true" />
                                Tùy chọn
                            </button>
                        )}
                        <button type="button" className="tool" onClick={() => setShowLevels(true)}>
                            <Info size={18} aria-hidden="true" />
                            Bảng cấp độ
                        </button>
                    </div>
                </div>

                <LevelTableModal
                    isOpen={showLevels}
                    onClose={() => setShowLevels(false)}
                    gameTitle={title}
                    itemUnit={itemUnit}
                    game={game}
                />
                <GameGuideModal
                    isOpen={showGuide}
                    onClose={() => setShowGuide(false)}
                    itemUnit={itemUnit}
                    recallSec={game.recallSec}
                    passPercent={passPercent}
                />

                <div className="round__grid">
                    <section className="levels" aria-labelledby="ladder-title">
                        <h2 id="ladder-title">Cấp độ</h2>
                        <p>
                            Đã mở {unlockedLevel} trên {game.maxLevel} cấp. Chọn lại cấp đã mở để luyện tập.
                        </p>

                        {isCustom ? (
                            <p className="levels__custom">
                                Bạn đang chơi ván tự chọn {itemCount} {itemUnit}. Đổi về chơi theo cấp độ trong{" "}
                                <strong>Tùy chọn</strong>.
                            </p>
                        ) : (
                            // Chọn lại được mọi cấp đã mở; cấp chưa mở bị khoá cho tới khi vượt qua cấp trước
                            <ol className="levels__grid">
                                {game.levels.map(({ level: option, itemCount: count }) => {
                                    const locked = option > unlockedLevel;
                                    const state = locked ? "locked" : option === unlockedLevel ? "current" : "done";
                                    return (
                                        <li key={option}>
                                            <button
                                                type="button"
                                                className="lvl"
                                                data-state={state}
                                                disabled={locked}
                                                aria-pressed={option === level}
                                                aria-label={`Cấp độ ${option}, ${count} ${shortUnit}${locked ? ", chưa mở khoá" : state === "done" ? ", đã qua" : ""}`}
                                                onClick={() => onSelectLevel(option === unlockedLevel ? null : option)}
                                            >
                                                {locked && <Lock size={14} aria-hidden="true" />}
                                                {state === "done" && <Check size={14} aria-hidden="true" />}
                                                <strong>{option}</strong>
                                                <span>
                                                    {count} {shortUnit}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}

                        {isGuest && (
                            <p className="levels__note">
                                Bạn đang chơi với tư cách khách: cấp đã mở chỉ giữ tạm trên trình duyệt này, không nhận EXP
                                và không lưu lịch sử.{" "}
                                {/* Truyền trang hiện tại để đăng nhập xong quay lại đúng trò chơi */}
                                <Link to="/login" state={{ from: location }} className="text-link">
                                    Đăng nhập
                                </Link>{" "}
                                để lưu tiến độ.
                            </p>
                        )}
                    </section>

                    <section className="deal" aria-labelledby="deal-title">
                        <div className="deal__title">
                            <h2 id="deal-title">{isCustom ? "Ván tự chọn" : `Cấp độ ${level}`}</h2>
                            {!isCustom && <span>{getLevelLabel(level)}</span>}
                        </div>

                        <p className="deal__count">
                            <strong>{itemCount}</strong>
                            <span>{itemUnit} cần nhớ</span>
                        </p>

                        {/* key theo số lượng: đổi cấp thì xấp bài được chia lại */}
                        <div className="deal__fan" key={itemCount} aria-hidden="true">
                            {Array.from({ length: fanCount }, (_, i) => (
                                <span key={i} style={{ "--o": i - (fanCount - 1) / 2, "--i": i } as CSSProperties}>
                                    {renderBack()}
                                </span>
                            ))}
                        </div>

                        <div className="timepick-field">
                            <p id="memorize-time">Thời gian ghi nhớ</p>
                            <div className="timepick" role="group" aria-labelledby="memorize-time">
                                {game.memorizeSecOptions.map((seconds) => (
                                    <button
                                        key={seconds}
                                        type="button"
                                        onClick={() => onMemorizeSecChange(seconds)}
                                        aria-pressed={memorizeSec === seconds}
                                    >
                                        {formatSeconds(seconds)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <ul className="deal__facts">
                            <li>Nhớ lại trong {formatSeconds(game.recallSec)}</li>
                            <li>Đạt từ {passPercent}%</li>
                            {game.player?.bestLevel && <li>Hoàn hảo cao nhất: cấp {game.player.bestLevel}</li>}
                        </ul>

                        <p className="deal__goal">{goal}</p>

                        {error && (
                            <p role="alert" className="deal__error">
                                <AlertCircle size={18} aria-hidden="true" />
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => onStart(level)}
                            disabled={isStarting}
                            className="btn btn--sun deal__start"
                        >
                            {isStarting ? (
                                <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
                            ) : (
                                <Play size={20} aria-hidden="true" />
                            )}
                            {isStarting ? "Đang chia bài..." : "Bắt đầu"}
                        </button>
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
        <main className="round page-col">
            <BackToGames />
            <div className="round__head">
                <h1>{title}</h1>
            </div>
            <section className="round__status">
                {status === "error" ? (
                    <div role="alert">
                        <p className="text-[#b42318]">
                            <AlertCircle size={18} aria-hidden="true" />
                            {error ?? "Không thể tải thông tin trò chơi."}
                        </p>
                        <div className="mt-4">
                            <button type="button" onClick={onRetry} className="tool">
                                <RefreshCw size={16} aria-hidden="true" />
                                Thử lại
                            </button>
                        </div>
                    </div>
                ) : (
                    <p>
                        <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                        Đang tải thông tin trò chơi...
                    </p>
                )}
            </section>
        </main>
    </>
);
