import { useState, useEffect } from "react";
import { useWordsGameStore } from "../store/wordsGameStore";
import type { WordLanguage } from "../types/wordTypes";
import {
  clampWordCount,
  getWordCountForLevel,
  MAX_WORD_COUNT,
  MIN_WORD_COUNT,
} from "../utils/wordUtils";
import {
  ChoiceGroup,
  GameDialog,
  SettingRow,
  Stepper,
  Switch,
} from "@/features/shared-game/components/GameDialog";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";

interface WordsPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordsPreferencesModal = ({
  isOpen,
  onClose,
}: WordsPreferencesModalProps) => {
  const {
    preferences,
    setPreferences,
    memorizeTime,
    setMemorizeTime,
    recallTime,
    setRecallTime,
    level,
  } = useWordsGameStore();

  const [language, setLanguage] = useState<WordLanguage>(preferences.language);
  const [groups, setGroups] = useState<number>(preferences.groups);
  const [wordCount, setWordCount] = useState(
    preferences.wordCount ?? getWordCountForLevel(level),
  );
  const [hideTimer, setHideTimer] = useState<boolean>(preferences.hideTimer);
  const [prepTime, setPrepTime] = useState<number>(preferences.prepTime);
  const [tempMemorizeTime, setTempMemorizeTime] =
    useState<number>(memorizeTime);
  const [tempRecallTime, setTempRecallTime] = useState<number>(recallTime);

  // Đồng bộ trạng thái khi mở modal
  useEffect(() => {
    if (isOpen) {
      setLanguage(preferences.language);
      setGroups(preferences.groups);
      setWordCount(preferences.wordCount ?? getWordCountForLevel(level));
      setHideTimer(preferences.hideTimer);
      setPrepTime(preferences.prepTime);
      setTempMemorizeTime(memorizeTime);
      setTempRecallTime(recallTime);
    }
  }, [isOpen, preferences, memorizeTime, recallTime, level]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Cập nhật cấu hình vào store
    setMemorizeTime(tempMemorizeTime);
    setRecallTime(tempRecallTime);
    setPreferences({
      language,
      groups: Math.max(1, Math.min(5, Number(groups) || 1)),
      hideTimer,
      prepTime,
      wordCount: clampWordCount(wordCount),
    });
    onClose();
  };

  return (
    <GameDialog
      title="Tùy chọn"
      subtitle="Từ vựng"
      onClose={onClose}
      wide
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
      <SettingRow
        title="Ngôn ngữ"
        hint="Ngôn ngữ cho danh sách từ vựng cần ghi nhớ."
      >
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as WordLanguage)}
          aria-label="Ngôn ngữ"
        >
          <option value="vi">🇻🇳 Tiếng Việt</option>
          <option value="en">🇬🇧 English (Tiếng Anh)</option>
          <option value="ko">🇰🇷 한국어 (Tiếng Hàn)</option>
          <option value="ja">🇯🇵 日本語 (Tiếng Nhật)</option>
          <option value="zh">🇨🇳 中文 (Tiếng Trung)</option>
          <option value="th">🇹🇭 ภาษาไทย (Tiếng Thái)</option>
        </select>
      </SettingRow>

      <SettingRow
        title="Số từ mỗi lần xem"
        hint="Số từ hiển thị trong một nhóm khi ghi nhớ."
      >
        <Stepper
          value={groups}
          min={1}
          max={5}
          label="Số từ mỗi lần xem"
          onChange={(value) => setGroups(Math.max(1, Math.min(5, value)))}
        />
      </SettingRow>

      <SettingRow
        title="Số lượng"
        hint={`Chọn từ ${MIN_WORD_COUNT} đến ${MAX_WORD_COUNT} từ.`}
      >
        <Stepper
          value={wordCount}
          min={MIN_WORD_COUNT}
          max={MAX_WORD_COUNT}
          label="Số lượng từ"
          onChange={(value) => setWordCount(clampWordCount(value))}
        />
      </SettingRow>

      <SettingRow
        title="Thời gian ghi nhớ"
        hint="Thời gian tối đa để xem và ghi nhớ dãy từ."
      >
        <ChoiceGroup
          options={[30, 60, 120, 300]}
          value={tempMemorizeTime}
          label="Thời gian ghi nhớ"
          format={formatSeconds}
          onChange={setTempMemorizeTime}
        />
      </SettingRow>

      <SettingRow
        title="Thời gian hoàn thành"
        hint="Thời gian tối đa để nhớ lại và nhập các từ."
      >
        <ChoiceGroup
          options={[60, 120, 240, 300]}
          value={tempRecallTime}
          label="Thời gian hoàn thành"
          format={formatSeconds}
          onChange={setTempRecallTime}
        />
      </SettingRow>

      <SettingRow
        title="Ẩn đồng hồ"
        hint="Không hiện thời gian đếm ngược trong lúc ghi nhớ."
      >
        <Switch
          checked={hideTimer}
          label="Ẩn đồng hồ"
          onToggle={() => setHideTimer(!hideTimer)}
        />
      </SettingRow>
    </GameDialog>
  );
};
