import { useState } from "react";
import type { GameCatalogItem } from "@/features/shared-game/api/games.api";
import { GameDialog } from "@/features/shared-game/components/GameDialog";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";
import { GamePreferences } from "@/features/shared-game/components/GamePreferences";
import { useGameStore } from "../store/gameStore";
import { clamp } from "../utils/cardUtils";

interface CardPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameCatalogItem; // Giới hạn số lá và thời gian lấy từ backend
}

export const CardPreferencesModal = ({
  isOpen,
  onClose,
  game,
}: CardPreferencesModalProps) => {
  const { preferences, setPreferences, memorizeTime, setMemorizeTime } =
    useGameStore();

  const range = game.customItems;
  const levelCardCount =
    game.levels[(game.player?.unlockedLevel ?? 1) - 1]?.itemCount ??
    range?.min ??
    1;
  const fitRange = (count: number) =>
    range ? clamp(count, range.min, range.max) : count;

  const [hideTimer, setHideTimer] = useState(preferences.hideTimer);
  // Tắt: số lá theo cấp độ hiện tại; bật: ván tự chọn số lá
  const [useCustomCount, setUseCustomCount] = useState(
    range !== null && preferences.cardCount !== null,
  );
  const [tempCardCount, setTempCardCount] = useState(
    fitRange(preferences.cardCount ?? levelCardCount),
  );
  const [tempGroups, setTempGroups] = useState(preferences.groups || 1);
  const [tempMemorizeTime, setTempMemorizeTime] = useState(
    game.memorizeSecOptions.includes(memorizeTime)
      ? memorizeTime
      : game.defaultMemorizeSec,
  );

  if (!isOpen) return null;

  const handleSave = () => {
    setMemorizeTime(tempMemorizeTime);
    setPreferences({
      hideTimer,
      cardCount: useCustomCount ? tempCardCount : null,
      groups: tempGroups,
    });
    onClose();
  };

  return (
    <GameDialog
      title="Tùy chọn"
      subtitle="Thẻ bài"
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
        groupTitle="Số lá mỗi lần xem"
        groupHint="Xem 1 đến 5 lá cùng lúc khi ghi nhớ."
        groupCount={tempGroups}
        onGroupCountChange={(count) => setTempGroups(clamp(count, 1, 5))}
        customCount={
          range
            ? {
                unit: "lá",
                enabled: useCustomCount,
                count: tempCardCount,
                min: range.min,
                max: range.max,
                standardCount: levelCardCount,
                onEnabledChange: setUseCustomCount,
                onCountChange: (count) => setTempCardCount(fitRange(count)),
              }
            : undefined
        }
        memorizeSeconds={tempMemorizeTime}
        memorizeOptions={game.memorizeSecOptions}
        onMemorizeSecondsChange={setTempMemorizeTime}
        memorizeHint="Thời gian xem và nhớ thứ tự các lá bài."
        recallHint={`${formatSeconds(game.recallSec)} để xếp lại các lá, giống nhau với mọi người chơi.`}
        hideTimer={hideTimer}
        onHideTimerChange={setHideTimer}
      />
    </GameDialog>
  );
};
