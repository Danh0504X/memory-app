import type { GameCatalogItem } from "../api/games.api";

interface LevelTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameTitle: string;
    itemUnit: string;
    game: GameCatalogItem;
}

// Bảng cấp độ lấy từ luật chơi của backend, đánh dấu các cấp người chơi đã mở
export const LevelTableModal = ({ isOpen, onClose, gameTitle, itemUnit, game }: LevelTableModalProps) => {
    if (!isOpen) return null;

    const unlockedLevel = game.player?.unlockedLevel ?? 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in">
            <div className="relative flex max-h-[90vh] w-full max-w-[540px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
                <div className="flex items-start justify-between p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d7f1e4] text-xl">
                            🎖️
                        </div>
                        <div>
                            <h2 className="text-[20px] font-extrabold text-[#1f2937]">Giải thích cấp độ</h2>
                            <p className="text-[12px] font-semibold text-[#667085]">Cấp độ {gameTitle}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f4f7] text-[#667085] transition hover:bg-[#e4e7ec] cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-4">
                    <p className="mb-4 text-[13px] leading-relaxed text-[#40493d]">
                        <span className="font-semibold text-[#1e5824]">Thành viên mới bắt đầu từ Cấp độ 1.</span>{" "}
                        Ở mỗi cấp độ, bé sẽ được thử thách ghi nhớ nhiều {itemUnit} hơn. Ghi nhớ đúng tất cả ở cấp cao nhất
                        đã mở để mở khoá cấp tiếp theo.
                    </p>

                    <div className="overflow-hidden rounded-2xl border border-[#e3ebe6] bg-[#f8faf9]">
                        <div className="flex bg-[#eff4ff] px-6 py-3 text-[13px] font-bold text-[#40493d]">
                            <span className="w-1/2">Cấp độ</span>
                            <span className="w-1/2 text-right">Số {itemUnit}</span>
                        </div>
                        <div className="divide-y divide-[#e3ebe6] bg-white">
                            {game.levels.map(({ level, itemCount }) => {
                                const isUnlocked = level <= unlockedLevel;
                                const isCurrent = level === unlockedLevel;
                                return (
                                    <div
                                        key={level}
                                        className={`flex items-center justify-between px-6 py-2.5 text-[14px] ${isCurrent ? "bg-[#eaf8ef]" : ""}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                aria-hidden="true"
                                                className={`h-3 w-3 rounded-full ${isUnlocked ? "bg-[#2e7d32]" : "bg-[#e0eee6]"}`}
                                            />
                                            <span className={`font-bold ${isUnlocked ? "text-[#1f2937]" : "text-[#98a2b3]"}`}>
                                                Cấp {level}
                                                {level === game.maxLevel && " 🎖️"}
                                            </span>
                                            {isCurrent && (
                                                <span className="rounded-full bg-[#2e7d32] px-2 py-0.5 text-[11px] font-bold text-white">
                                                    Hiện tại
                                                </span>
                                            )}
                                            {!isUnlocked && <span className="text-[12px] text-[#98a2b3]">🔒 Chưa mở</span>}
                                        </div>
                                        <span className="rounded-full bg-[#eff4ff] px-3 py-1 text-[12px] font-bold text-[#1f2937]">
                                            {itemCount} {itemUnit}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#eff4ff] p-3 text-[12px] text-[#40493d]">
                        <span>📍</span>
                        <p>
                            <strong className="font-bold">Mẹo luyện tập:</strong> Hãy nối các {itemUnit} thành một câu chuyện ngắn
                            theo đúng thứ tự để ghi nhớ dễ dàng hơn.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end border-t border-[#e3ebe6] bg-white p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-[#2e7d32] px-6 py-2.5 text-[14px] font-bold text-white shadow-md transition hover:bg-[#236527] cursor-pointer"
                    >
                        Đã hiểu & Bắt đầu luyện tập
                    </button>
                </div>
            </div>
        </div>
    );
};
