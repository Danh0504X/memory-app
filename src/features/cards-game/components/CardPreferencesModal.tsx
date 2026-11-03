import { useState } from "react";
import type { GameCatalogItem } from "@/features/shared-game/api/games.api";
import { ChoiceGroup, GameDialog, SettingRow, Stepper, Switch } from "@/features/shared-game/components/GameDialog";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";
import { useGameStore } from "../store/gameStore";
import { clamp } from "../utils/cardUtils";

interface CardPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameCatalogItem; // Giới hạn số lá và thời gian lấy từ backend
}

export const CardPreferencesModal = ({ isOpen, onClose, game }: CardPreferencesModalProps) => {
  const { preferences, setPreferences, memorizeTime, setMemorizeTime } = useGameStore();

  const range = game.customItems;
  const levelCardCount = game.levels[(game.player?.unlockedLevel ?? 1) - 1]?.itemCount ?? range?.min ?? 1;
  const fitRange = (count: number) => (range ? clamp(count, range.min, range.max) : count);

  const [hideTimer, setHideTimer] = useState(preferences.hideTimer);
  // Tắt: số lá theo cấp độ hiện tại; bật: ván tự chọn số lá
  const [useCustomCount, setUseCustomCount] = useState(range !== null && preferences.cardCount !== null);
  const [tempCardCount, setTempCardCount] = useState(fitRange(preferences.cardCount ?? levelCardCount));
  const [tempGroups, setTempGroups] = useState(preferences.groups || 1);
  const [tempMemorizeTime, setTempMemorizeTime] = useState(
    game.memorizeSecOptions.includes(memorizeTime) ? memorizeTime : game.defaultMemorizeSec,
  );

  if (!isOpen) return null;

  const handleSave = () => {
    setMemorizeTime(tempMemorizeTime);
    setPreferences({ hideTimer, cardCount: useCustomCount ? tempCardCount : null, groups: tempGroups });
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
      <SettingRow title="Số lá mỗi lần xem" hint="Xem 1 đến 5 lá cùng lúc khi ghi nhớ.">
        <Stepper
          value={tempGroups}
          min={1}
          max={5}
          label="Số lá mỗi lần xem"
          onChange={(value) => setTempGroups(clamp(value, 1, 5))}
        />
      </SettingRow>

      {range && (
        <SettingRow
          title="Tự chọn số lá"
          hint={
            useCustomCount
              ? `Từ ${range.min} đến ${range.max} lá. Ván tự chọn vẫn được cộng EXP và tính chuỗi ngày, nhưng không mở khoá cấp mới và không tính kỷ lục.`
              : `Đang dùng số lá theo cấp độ hiện tại: ${levelCardCount} lá.`
          }
        >
          <div className="setting__controls">
            <Switch checked={useCustomCount} label="Tự chọn số lá" onToggle={() => setUseCustomCount(!useCustomCount)} />
            {useCustomCount && (
              <Stepper
                value={tempCardCount}
                min={range.min}
                max={range.max}
                label="Số lá"
                onChange={(value) => setTempCardCount(fitRange(value))}
              />
            )}
          </div>
        </SettingRow>
      )}

      <SettingRow title="Thời gian ghi nhớ" hint="Thời gian xem và nhớ thứ tự các lá bài.">
        <ChoiceGroup
          options={game.memorizeSecOptions}
          value={tempMemorizeTime}
          label="Thời gian ghi nhớ"
          format={formatSeconds}
          onChange={setTempMemorizeTime}
        />
      </SettingRow>

      <SettingRow
        title="Thời gian nhớ lại"
        hint={`${formatSeconds(game.recallSec)} để xếp lại các lá, giống nhau với mọi người chơi.`}
      />

      <SettingRow title="Ẩn đồng hồ" hint="Không hiện thời gian đếm ngược trong lúc ghi nhớ.">
        <Switch checked={hideTimer} label="Ẩn đồng hồ" onToggle={() => setHideTimer(!hideTimer)} />
      </SettingRow>
    </GameDialog>
  );
};
