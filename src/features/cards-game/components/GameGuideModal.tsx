import { Link } from "react-router-dom";
import { GameDialog } from "@/features/shared-game/components/GameDialog";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";

interface GameGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemUnit: string;       // "thẻ bài" hoặc "hình ảnh"
    recallSec: number;
    passPercent: number;
}

// Cách chơi, dùng chung cho cả hai trò; phím tắt khớp với các pha đang chơi
export const GameGuideModal = ({ isOpen, onClose, itemUnit, recallSec, passPercent }: GameGuideModalProps) => {
    if (!isOpen) return null;

    return (
        <GameDialog
            title="Cách chơi"
            subtitle={`Nhớ thứ tự các ${itemUnit}, rồi xếp lại cho đúng`}
            onClose={onClose}
            wide
            footer={
                <button type="button" className="btn btn--brand" onClick={onClose}>
                    Đã hiểu
                </button>
            }
        >
            <ol className="guide">
                <li>
                    <h3>Ghi nhớ</h3>
                    <p>
                        Xem lần lượt từng {itemUnit} bằng hai nút lớn hai bên, hoặc phím <kbd>←</kbd> <kbd>→</kbd>. Dải bên
                        dưới cho bạn nhảy tới vị trí bất kỳ, <kbd>Space</kbd> quay về đầu.
                    </p>
                    <p>
                        Nhớ xong thì bấm <strong>Đã nhớ xong</strong> hoặc <kbd>Enter</kbd>. Hết giờ, ván tự chuyển sang phần
                        nhớ lại.
                    </p>
                </li>
                <li>
                    <h3>Nhớ lại</h3>
                    <p>
                        Chọn {itemUnit} trong bộ bên dưới, nó sẽ vào ô đang sáng vàng. Muốn điền một ô khác thì bấm vào ô
                        trống đó trước.
                    </p>
                    <p>
                        Bấm vào ô đã điền để gỡ ra, hoặc nhấn <kbd>Backspace</kbd> để gỡ {itemUnit} vừa đặt. Bạn có{" "}
                        {formatSeconds(recallSec)} cho phần này.
                    </p>
                </li>
                <li>
                    <h3>Nộp bài</h3>
                    <p>
                        Bấm <strong>Nộp bài</strong> hoặc <kbd>Enter</kbd>. Mỗi vị trí đúng được tính một điểm. Đúng từ{" "}
                        {passPercent}% là đạt, đúng tất cả thì mở khoá cấp tiếp theo.
                    </p>
                </li>
            </ol>

            <p className="gdlg__tip">
                <strong>Mẹo:</strong> độ chính xác quan trọng hơn tốc độ. Thử{" "}
                <Link to="/methods/story-linking" className="text-link">
                    nối các {itemUnit} thành câu chuyện
                </Link>{" "}
                để nhớ dãy dài.
            </p>
        </GameDialog>
    );
};
