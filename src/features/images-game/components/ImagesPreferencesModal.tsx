import { useState } from "react";
import type { GameCatalogItem } from "@/features/shared-game/api/games.api";
import { GameDialog } from "@/features/shared-game/components/GameDialog";
import { GamePreferences } from "@/features/shared-game/components/GamePreferences";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";
import { useImagesGameStore } from "../store/imagesGameStore";

interface ImagesPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameCatalogItem; // Các lựa chọn thời gian lấy từ backend
}

export const ImagesPreferencesModal = ({
  isOpen,
  onClose,
  game,
}: ImagesPreferencesModalProps) => {
  const { preferences, setPreferences, memorizeTime, setMemorizeTime } =
    useImagesGameStore();
  const range = game.customItems;
  const levelImageCount =
    game.levels[(game.player?.unlockedLevel ?? 1) - 1]?.itemCount ??
    range?.min ??
    1;
  const fitRange = (count: number) =>
    range ? Math.max(range.min, Math.min(range.max, Math.round(count))) : count;

  // Modal chỉ được render khi mở, nên state luôn khởi tạo từ giá trị hiện tại của store
  const [groups, setGroups] = useState(preferences.groups);
  const [useCustomCount, setUseCustomCount] = useState(
    range !== null && preferences.imageCount !== null,
  );
  const [tempImageCount, setTempImageCount] = useState(
    fitRange(preferences.imageCount ?? levelImageCount),
  );
  const [hideTimer, setHideTimer] = useState(preferences.hideTimer);
  const [tempMemorizeTime, setTempMemorizeTime] = useState(
    game.memorizeSecOptions.includes(memorizeTime)
      ? memorizeTime
      : game.defaultMemorizeSec,
  );

  if (!isOpen) return null;

  const handleSave = () => {
    setMemorizeTime(tempMemorizeTime);
    setPreferences({
      groups: Math.max(1, Math.min(5, groups)),
      hideTimer,
      prepTime: preferences.prepTime,
      imageCount: range && useCustomCount ? fitRange(tempImageCount) : null,
    });
    onClose();
  };

  return (
    <GameDialog
      title="Tùy chọn"
      subtitle="Hình ảnh"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="btn btn--brand" onClick={handleSave}>
            Lưu tùy chọn
          </button>
        </>
      }
    >
      <GamePreferences
        groupTitle="Số hình mỗi lần xem"
        groupHint="Xem 1 đến 5 hình cùng lúc khi ghi nhớ."
        groupCount={groups}
        onGroupCountChange={(count) =>
          setGroups(Math.max(1, Math.min(5, count)))
        }
        customCount={
          range
            ? {
                unit: "hình",
                enabled: useCustomCount,
                count: tempImageCount,
                min: range.min,
                max: range.max,
                standardCount: levelImageCount,
                onEnabledChange: setUseCustomCount,
                onCountChange: (count) => setTempImageCount(fitRange(count)),
              }
            : undefined
        }
        memorizeSeconds={tempMemorizeTime}
        memorizeOptions={game.memorizeSecOptions}
        onMemorizeSecondsChange={setTempMemorizeTime}
        memorizeHint="Thời gian xem và nhớ thứ tự các hình."
        recallHint={`${formatSeconds(game.recallSec)} để xếp lại các hình, giống nhau với mọi người chơi.`}
        hideTimer={hideTimer}
        onHideTimerChange={setHideTimer}
      />
    </GameDialog>
  );
};
