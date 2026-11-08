import { useState, type FC } from "react";
import { GameDialog, SettingRow, Stepper, Switch } from "@/features/shared-game/components/GameDialog";
import { SUPPORTED_LANGUAGES } from "../api/wordsApi";
import { useWordsGameStore } from "../store/wordsGameStore";
import type { SupportedLanguageCode } from "../types/wordsTypes";

interface WordsPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordsPreferencesModal: FC<WordsPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { preferences, setPreferences } = useWordsGameStore();

  const [tempLang, setTempLang] = useState<SupportedLanguageCode>(preferences.language);
  const [tempGroups, setTempGroups] = useState(preferences.groups);
  const [tempHideTimer, setTempHideTimer] = useState(preferences.hideTimer);
  const [tempPrepTime, setTempPrepTime] = useState(preferences.prepTime);

  if (!isOpen) return null;

  const handleSave = () => {
    setPreferences({
      language: tempLang,
      groups: Math.max(1, Math.min(3, tempGroups)),
      hideTimer: tempHideTimer,
      prepTime: tempPrepTime,
    });
    onClose();
  };

  return (
    <GameDialog
      title="Tùy chọn"
      subtitle="Ghi nhớ từ (Words Preferences)"
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
      {/* 1. Ngôn ngữ từ vựng (Language) */}
      <SettingRow
        title="Ngôn ngữ (Language)"
        hint="Chọn ngôn ngữ của các từ vựng cần ghi nhớ (Specify the language for the words to be memorized)."
      >
        <select
          value={tempLang}
          onChange={(e) => setTempLang(e.target.value as SupportedLanguageCode)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-xs outline-hidden focus:border-[#1a7a4a] focus:ring-2 focus:ring-[#1a7a4a]/20"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label} ({lang.nativeName})
            </option>
          ))}
        </select>
      </SettingRow>

      {/* 2. Số từ mỗi cụm (Groups) */}
      <SettingRow
        title="Nhóm từ (Groups)"
        hint="Số từ hiển thị cùng lúc khi ghi nhớ - ví dụ: '1', '2' hoặc '3' từ."
      >
        <Stepper
          value={tempGroups}
          min={1}
          max={3}
          label="Số từ mỗi nhóm"
          onChange={(val) => setTempGroups(Math.max(1, Math.min(3, val)))}
        />
      </SettingRow>

      {/* 3. Ẩn đồng hồ (Hide Timer) */}
      <SettingRow
        title="Ẩn đồng hồ (Hide Timer)"
        hint="Ẩn thời gian đếm ngược trong suốt giai đoạn ghi nhớ."
      >
        <Switch
          checked={tempHideTimer}
          label="Ẩn đồng hồ"
          onToggle={() => setTempHideTimer(!tempHideTimer)}
        />
      </SettingRow>

      {/* 4. Thời gian chuẩn bị (Preparation Time) */}
      <SettingRow
        title="Thời gian chuẩn bị (Preparation Time)"
        hint="Thời gian đếm ngược trước khi bước vào ván đấu tập luyện."
      >
        <select
          value={tempPrepTime}
          onChange={(e) => setTempPrepTime(Number(e.target.value))}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-xs outline-hidden focus:border-[#1a7a4a] focus:ring-2 focus:ring-[#1a7a4a]/20"
        >
          <option value={0}>Không chuẩn bị (None)</option>
          <option value={3}>3 giây (3 seconds)</option>
          <option value={5}>5 giây (5 seconds)</option>
          <option value={10}>10 giây (10 seconds)</option>
        </select>
      </SettingRow>
    </GameDialog>
  );
};

