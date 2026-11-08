import type { FC } from "react";
import { Check, Lock } from "lucide-react";
import { GameDialog } from "@/features/shared-game/components/GameDialog";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { DEFAULT_WORDS_LEVELS } from "../api/wordsApi";

interface WordsLevelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordsLevelsModal: FC<WordsLevelsModalProps> = ({ isOpen, onClose }) => {
  const { game } = useGameCatalog("word");
  const unlockedLevel = game?.player?.unlockedLevel ?? 1;

  if (!isOpen) return null;

  return (
    <GameDialog
      title="Bảng cấp độ"
      subtitle="Ghi nhớ từ (Words Levels)"
      onClose={onClose}
      wide
      footer={
        <button type="button" className="btn btn--brand" onClick={onClose}>
          Đã hiểu
        </button>
      }
    >
      <p className="gdlg__lead">
        Người mới thi đấu bắt đầu từ cấp 1 (New competitors start at level 1).
        <br />
        Ở mỗi cấp độ, bạn cần ghi nhớ nhiều từ vựng hơn. Cần nhớ đúng tối thiểu <strong>2/3 số từ</strong> để mở khóa cấp độ tiếp theo.
      </p>

      <table className="levels-table">
        <thead>
          <tr>
            <th scope="col">Cấp độ (Level)</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Số từ hiển thị (Words Presented)</th>
            <th scope="col">Điểm cần đạt để lên cấp (Score Required)</th>
          </tr>
        </thead>
        <tbody>
          {DEFAULT_WORDS_LEVELS.map(({ level, itemCount, requiredScore }) => {
            const state =
              level > unlockedLevel ? "locked" : level === unlockedLevel ? "current" : "done";

            return (
              <tr key={level} data-state={state}>
                <th scope="row">Cấp {level}</th>
                <td>
                  {state === "done" && (
                    <span className="levels-table__state">
                      <Check size={16} aria-hidden="true" /> Đã qua
                    </span>
                  )}
                  {state === "current" && (
                    <span className="levels-table__state">Đang chơi</span>
                  )}
                  {state === "locked" && (
                    <span className="levels-table__state">
                      <Lock size={14} aria-hidden="true" /> Chưa mở
                    </span>
                  )}
                </td>
                <td className="font-semibold">{itemCount} từ</td>
                <td>
                  {level === 10 ? (
                    <span className="text-slate-400">— (Mức cao nhất)</span>
                  ) : (
                    <span className="font-bold text-[#1a7a4a]">{requiredScore} / {itemCount}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="gdlg__tip">
        <strong>Mẹo:</strong> Nối các từ vựng thành một câu chuyện hành động kỳ thú hoặc đặt chúng tại từng điểm mốc trong Cung điện trí nhớ (Memory Palace) để ghi nhớ thứ tự chuẩn xác nhất.
      </p>
    </GameDialog>
  );
};

