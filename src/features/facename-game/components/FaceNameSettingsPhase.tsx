import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, Lock, Play, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/features/auth/store/authStore";
import { GameDialog } from "@/features/shared-game/components/GameDialog";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceNameFreeConfigModal } from "./FaceNameFreeConfigModal";

export const FaceNameSettingsPhase = () => {
    const { levels, stats, selectedLevel, setSelectedLevel, startLevelGame, isLoading, errorMessage, initialize } = useFaceNameStore();
    const [modal, setModal] = useState<"guide" | "free" | null>(null);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const unlocked = Math.min(levels.length || 10, stats.unlockedLevel);
    const level = Math.min(selectedLevel ?? unlocked, unlocked);
    const config = levels.find((item) => item.levelId === level);

    return <>
        <Header />
        <main className="round page-col facename-settings">
            <Link to="/games" className="round__back"><ArrowLeft size={18} aria-hidden="true" />Chọn trò chơi</Link>
            <div className="round__head">
                <div><h1>Gương mặt &amp; Tên</h1><p>Nhớ gương mặt, gắn tên gọi. Gặp lại, bạn có nhận ra?</p></div>
                <div className="round__tools">
                    <button className="tool" onClick={() => setModal("guide")}><BookOpen size={18} aria-hidden="true" />Cách chơi</button>
                    <button className="tool" onClick={() => setModal("free")}><SlidersHorizontal size={18} aria-hidden="true" />Ván tự chọn</button>
                </div>
            </div>
            <div className="round__grid">
                <section className="levels" aria-labelledby="face-levels">
                    <h2 id="face-levels">Cấp độ</h2>
                    <p>Đã mở {unlocked} trên {levels.length || 10} cấp. Chọn lại cấp đã mở để luyện tập.</p>
                    <ol className="levels__grid">
                        {levels.map((item) => <li key={item.levelId}>
                            <button className="lvl" data-state={item.levelId > unlocked ? "locked" : item.levelId === unlocked ? "current" : "done"}
                                disabled={item.levelId > unlocked} aria-pressed={item.levelId === level}
                                aria-label={`Cấp ${item.levelId}, ${item.faceCount} người${item.levelId > unlocked ? ", chưa mở" : ""}`}
                                onClick={() => setSelectedLevel(item.levelId)}>
                                {item.levelId > unlocked ? <Lock size={14} aria-hidden="true" /> : item.levelId < unlocked ? <Check size={14} aria-hidden="true" /> : null}
                                <strong>{item.levelId}</strong><span>{item.faceCount} người</span>
                            </button>
                        </li>)}
                    </ol>
                    <p className="levels__note">{isAuthenticated ? "Tiến độ và lịch sử được lưu theo tài khoản. Mỗi ván nhận EXP và góp vào chuỗi ngày luyện tập." : "Bạn đang chơi với tư cách khách. Tiến độ được giữ tạm theo phiên khách; đăng nhập để lưu lịch sử và nhận EXP."}</p>
                    <dl className="face-local-stats">
                        <div><dt>Đã luyện</dt><dd>{stats.totalRounds} ván</dd></div>
                        <div><dt>Cấp đang mở</dt><dd>{stats.unlockedLevel}/{levels.length || 10}</dd></div>
                    </dl>
                </section>
                <section className="deal" aria-labelledby="face-round">
                    <div className="deal__title"><h2 id="face-round">Cấp {level}</h2><span>{config?.nameType ?? "Đang tải cấp độ"}</span></div>
                    {config && <>
                        <p className="deal__count"><strong>{config.faceCount}</strong><span>gương mặt cần nhớ</span></p>
                        <div className="face-preview" aria-hidden="true">
                            {["Anna", "Claire", "Bryan"].map((name) => (
                                <div key={name}>
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt="" />
                                    <span>{name}</span>
                                </div>
                            ))}
                        </div>
                        <ul className="deal__facts">
                            <li>Ghi nhớ {formatSeconds(config.memorizeSeconds)}</li>
                            <li>Nhớ lại {formatSeconds(config.recallSeconds)}</li>
                            <li>Đạt từ {config.requiredScore}/{config.faceCount} điểm</li>
                        </ul>
                        <p className="deal__goal">Đúng +1 điểm, sai −0,5 điểm, bỏ trống 0 điểm. Đạt điểm yêu cầu để mở cấp tiếp theo.</p>
                    </>}
                    {errorMessage && <p className="deal__error" role="alert">{errorMessage}</p>}
                    {!config ? <button className="tool" onClick={() => void initialize()} disabled={isLoading}>
                        <RefreshCw size={18} aria-hidden="true" />{isLoading ? "Đang tải cấp độ..." : "Tải lại cấp độ"}
                    </button> : <button className="btn btn--sun deal__start" onClick={() => void startLevelGame(level)} disabled={isLoading}>
                        <Play size={20} aria-hidden="true" />Bắt đầu
                    </button>}
                </section>
            </div>
        </main>
        {modal === "guide" && <GameDialog title="Nhớ người, nhớ tên" onClose={() => setModal(null)} footer={<button className="btn btn--brand" onClick={() => setModal(null)}>Đã hiểu</button>}>
            <div className="guide">
                <section><h3>Quan sát</h3><p>Xem từng gương mặt và tên. Tìm một nét riêng để liên kết với tên gọi; thứ tự không cần nhớ.</p></section>
                <section><h3>Nhớ lại</h3><p>Gương mặt được xáo trộn. Gõ tên dưới mỗi người, dùng Enter để sang ô tiếp theo. Hết giờ, bài được nộp tự động.</p></section>
                <section><h3>Tính điểm</h3><p>Đúng +1, sai −0,5, bỏ trống 0. Không phân biệt chữ hoa và khoảng trắng ở hai đầu; cần giữ đúng dấu tiếng Việt. Điểm qua cấp hiển thị trước mỗi ván.</p></section>
            </div>
        </GameDialog>}
        {modal === "free" && <FaceNameFreeConfigModal isOpen onClose={() => setModal(null)} />}
    </>;
};
