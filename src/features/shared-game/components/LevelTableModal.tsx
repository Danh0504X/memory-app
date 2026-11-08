import { Check, Lock } from "lucide-react";
import type { GameCatalogItem } from "../api/games.api";
import { GameDialog } from "./GameDialog";

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
        <GameDialog
            title="Bảng cấp độ"
            subtitle={gameTitle}
            onClose={onClose}
            footer={
                <button type="button" className="btn btn--brand" onClick={onClose}>
                    Đã hiểu
                </button>
            }
        >
            <p className="gdlg__lead">
                Ai cũng bắt đầu từ cấp 1. Mỗi cấp có nhiều {itemUnit} hơn cấp trước. Nhớ đúng tất cả ở cấp cao nhất đã mở
                để mở khoá cấp tiếp theo.
            </p>

            <table className="levels-table">
                <thead>
                    <tr>
                        <th scope="col">Cấp</th>
                        <th scope="col">Trạng thái</th>
                        <th scope="col">Số {itemUnit}</th>
                    </tr>
                </thead>
                <tbody>
                    {game.levels.map(({ level, itemCount }) => {
                        const state = level > unlockedLevel ? "locked" : level === unlockedLevel ? "current" : "done";
                        return (
                            <tr key={level} data-state={state}>
                                <th scope="row">Cấp {level}</th>
                                <td>
                                    {state === "done" && (
                                        <span className="levels-table__state">
                                            <Check size={16} aria-hidden="true" /> Đã qua
                                        </span>
                                    )}
                                    {state === "current" && <span className="levels-table__state">Đang chơi</span>}
                                    {state === "locked" && (
                                        <span className="levels-table__state">
                                            <Lock size={14} aria-hidden="true" /> Chưa mở
                                        </span>
                                    )}
                                </td>
                                <td>{itemCount}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <p className="gdlg__tip">
                <strong>Mẹo:</strong> nối các {itemUnit} thành một câu chuyện ngắn theo đúng thứ tự, bạn sẽ nhớ lâu hơn.
            </p>
        </GameDialog>
    );
};
