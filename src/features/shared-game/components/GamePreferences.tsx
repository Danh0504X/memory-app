import { ChoiceGroup, SettingRow, Stepper, Switch } from "./GameDialog";
import { formatSeconds } from "../utils/formatTime";

interface CustomCountPreference {
  unit: string;
  enabled: boolean;
  count: number;
  min: number;
  max: number;
  standardCount: number;
  onEnabledChange: (enabled: boolean) => void;
  onCountChange: (count: number) => void;
}

interface GamePreferencesProps {
  groupTitle: string;
  groupHint: string;
  groupCount: number;
  onGroupCountChange: (count: number) => void;
  customCount?: CustomCountPreference;
  memorizeSeconds: number;
  memorizeOptions: number[];
  onMemorizeSecondsChange: (seconds: number) => void;
  memorizeHint: string;
  recallHint: string;
  hideTimer: boolean;
  onHideTimerChange: (hide: boolean) => void;
}

export const GamePreferences = ({
  groupTitle,
  groupHint,
  groupCount,
  onGroupCountChange,
  customCount,
  memorizeSeconds,
  memorizeOptions,
  onMemorizeSecondsChange,
  memorizeHint,
  recallHint,
  hideTimer,
  onHideTimerChange,
}: GamePreferencesProps) => (
  <>
    <SettingRow title={groupTitle} hint={groupHint}>
      <Stepper
        value={groupCount}
        min={1}
        max={5}
        label={groupTitle}
        onChange={onGroupCountChange}
      />
    </SettingRow>

    {customCount && (
      <SettingRow
        title="Số lượng"
        hint={
          customCount.enabled
            ? `Từ ${customCount.min} đến ${customCount.max} ${customCount.unit}. Ván tự chọn không mở khoá cấp mới và không tính kỷ lục.`
            : `Đang dùng số lượng theo cấp độ hiện tại: ${customCount.standardCount} ${customCount.unit}.`
        }
      >
        <div className="setting__controls">
          <Switch
            checked={customCount.enabled}
            label="Số lượng"
            onToggle={() => customCount.onEnabledChange(!customCount.enabled)}
          />
          {customCount.enabled && (
            <Stepper
              value={customCount.count}
              min={customCount.min}
              max={customCount.max}
              label="Số lượng"
              onChange={customCount.onCountChange}
            />
          )}
        </div>
      </SettingRow>
    )}

    <SettingRow title="Thời gian ghi nhớ" hint={memorizeHint}>
      <ChoiceGroup
        options={memorizeOptions}
        value={memorizeSeconds}
        label="Thời gian ghi nhớ"
        format={formatSeconds}
        onChange={onMemorizeSecondsChange}
      />
    </SettingRow>

    <SettingRow title="Thời gian nhớ lại" hint={recallHint} />

    <SettingRow
      title="Ẩn đồng hồ"
      hint="Không hiện thời gian đếm ngược trong lúc ghi nhớ."
    >
      <Switch
        checked={hideTimer}
        label="Ẩn đồng hồ"
        onToggle={() => onHideTimerChange(!hideTimer)}
      />
    </SettingRow>
  </>
);
