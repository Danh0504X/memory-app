import { useId } from 'react';
import { Check } from 'lucide-react';
import { DAILY_MINUTES_OPTIONS, TRAINING_GOALS, type TrainingGoal } from '../api/profile.api';
import {
    GOAL_HINTS,
    GOAL_LABELS,
    MINUTES_HINTS,
    formatMinutes,
    targetDateRange,
    type PreferencesDraft,
} from '../utils/preferences';
import '../preferences.css';

interface PreferencesFieldsProps {
    value: PreferencesDraft;
    onChange: (value: PreferencesDraft) => void;
    // stacked: nhãn trên ô (hộp thoại); rows: nhãn bên trái như danh sách cài đặt (trang hồ sơ)
    layout?: 'stacked' | 'rows';
    // Báo lỗi dưới nhóm mục tiêu, vd. bấm Lưu khi chưa chọn gì
    goalsError?: string | null;
}

// Các ô chọn mục tiêu, dùng chung cho hộp thoại lần đầu và trang hồ sơ.
// Dùng checkbox/radio thật bọc trong <label>: bấm vào chữ, mép ô hay dùng bàn phím đều ăn.
export const PreferencesFields = ({ value, onChange, layout = 'stacked', goalsError = null }: PreferencesFieldsProps) => {
    const id = useId();
    const range = targetDateRange();

    const toggleGoal = (goal: TrainingGoal) => {
        const goals = value.goals.includes(goal) ? value.goals.filter((item) => item !== goal) : [...value.goals, goal];
        onChange({ ...value, goals });
    };

    return (
        <div className="prefs" data-layout={layout}>
            <div className="prefs__field" role="group" aria-labelledby={`${id}-goals`} aria-describedby={goalsError ? `${id}-goals-error` : undefined}>
                <div className="prefs__label">
                    <span id={`${id}-goals`}>Mục tiêu của bạn</span>
                    <small>Chọn một hoặc nhiều</small>
                </div>
                <div className="prefs__control">
                    <div className="prefs__goals" data-invalid={Boolean(goalsError)}>
                        {TRAINING_GOALS.map((goal) => (
                            <label key={goal} className="prefs__goal">
                                <input
                                    type="checkbox"
                                    name={`${id}-goal`}
                                    checked={value.goals.includes(goal)}
                                    onChange={() => toggleGoal(goal)}
                                />
                                <span className="prefs__tick" aria-hidden="true">
                                    <Check size={14} strokeWidth={3} />
                                </span>
                                <span className="prefs__goal-text">
                                    <strong>{GOAL_LABELS[goal]}</strong>
                                    <small>{GOAL_HINTS[goal]}</small>
                                </span>
                            </label>
                        ))}
                    </div>
                    {goalsError && (
                        <p id={`${id}-goals-error`} className="prefs__error" role="alert">
                            {goalsError}
                        </p>
                    )}
                </div>
            </div>

            {value.goals.includes('exam') && (
                <div className="prefs__field">
                    <div className="prefs__label">
                        <label htmlFor={`${id}-date`}>Ngày thi</label>
                        <small>Không bắt buộc</small>
                    </div>
                    <div className="prefs__control">
                        <input
                            id={`${id}-date`}
                            type="date"
                            className="prefs__date"
                            min={range.min}
                            max={range.max}
                            value={value.targetDate}
                            onChange={(event) => onChange({ ...value, targetDate: event.target.value })}
                        />
                    </div>
                </div>
            )}

            <div className="prefs__field" role="radiogroup" aria-labelledby={`${id}-minutes`}>
                <div className="prefs__label">
                    <span id={`${id}-minutes`}>Mỗi ngày bạn có khoảng</span>
                </div>
                <div className="prefs__control">
                    <div className="prefs__minutes">
                        {DAILY_MINUTES_OPTIONS.map((minutes) => (
                            <label key={minutes} className="prefs__minute">
                                <input
                                    type="radio"
                                    name={`${id}-minutes`}
                                    checked={value.dailyMinutes === minutes}
                                    onChange={() => onChange({ ...value, dailyMinutes: minutes })}
                                />
                                <strong>{formatMinutes(minutes)}</strong>
                                <small>{MINUTES_HINTS[minutes]}</small>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
