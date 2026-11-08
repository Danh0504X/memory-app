import { useId } from 'react';
import { Check } from 'lucide-react';
import { ChoiceGroup } from '@/features/shared-game/components/GameDialog';
import { DAILY_MINUTES_OPTIONS, TRAINING_GOALS, type TrainingGoal } from '../api/profile.api';
import { GOAL_LABELS, formatMinutes, targetDateRange, type PreferencesDraft } from '../utils/preferences';
import '@/features/shared-game/game.css';
import '../preferences.css';

interface PreferencesFieldsProps {
    value: PreferencesDraft;
    onChange: (value: PreferencesDraft) => void;
}

// Các ô chọn mục tiêu, dùng chung cho hộp thoại lần đầu và trang hồ sơ
export const PreferencesFields = ({ value, onChange }: PreferencesFieldsProps) => {
    const id = useId();
    const range = targetDateRange();

    const toggleGoal = (goal: TrainingGoal) => {
        const goals = value.goals.includes(goal) ? value.goals.filter((item) => item !== goal) : [...value.goals, goal];
        onChange({ ...value, goals });
    };

    return (
        <div className="prefs">
            <div className="prefs__field">
                <p className="prefs__label" id={`${id}-goals`}>
                    Bạn muốn nhớ tốt hơn để <span>chọn một hoặc nhiều</span>
                </p>
                <div className="prefs__goals" role="group" aria-labelledby={`${id}-goals`}>
                    {TRAINING_GOALS.map((goal) => {
                        const pressed = value.goals.includes(goal);
                        return (
                            <button key={goal} type="button" className="prefs__goal" aria-pressed={pressed} onClick={() => toggleGoal(goal)}>
                                {pressed && <Check size={16} aria-hidden="true" />}
                                {GOAL_LABELS[goal]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {value.goals.includes('exam') && (
                <div className="prefs__field">
                    <label className="prefs__label" htmlFor={`${id}-date`}>
                        Ngày thi <span>không bắt buộc</span>
                    </label>
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
            )}

            <div className="prefs__field">
                <p className="prefs__label">Mỗi ngày bạn có khoảng</p>
                <ChoiceGroup
                    options={[...DAILY_MINUTES_OPTIONS]}
                    value={value.dailyMinutes}
                    label="Thời gian luyện mỗi ngày"
                    format={formatMinutes}
                    onChange={(dailyMinutes) => onChange({ ...value, dailyMinutes })}
                />
            </div>
        </div>
    );
};
