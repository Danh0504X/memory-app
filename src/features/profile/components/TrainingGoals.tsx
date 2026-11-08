import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { profileApi, type UserProfile } from '../api/profile.api';
import { GOAL_LABELS, describeTargetDate, formatMinutes, toDraft, toInput } from '../utils/preferences';
import { PreferencesFields } from './PreferencesFields';

interface TrainingGoalsProps {
    profile: UserProfile;
    onSaved: (profile: UserProfile) => void;
}

// Mục tiêu luyện tập trong trang hồ sơ: xem dạng danh sách cài đặt, bấm "Sửa" để đổi tại chỗ, một nút Lưu cho cả khối
export const TrainingGoals = ({ profile, onSaved }: TrainingGoalsProps) => {
    const preferences = profile.preferences;
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(() => toDraft(preferences));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const editButton = useRef<HTMLButtonElement>(null);

    // Mở form thì con trỏ vào ô đầu tiên; đóng thì trở về nút đã mở nó
    const wasEditing = useRef(editing);
    useEffect(() => {
        if (editing) formRef.current?.querySelector<HTMLElement>('button, input')?.focus();
        else if (wasEditing.current) editButton.current?.focus();
        wasEditing.current = editing;
    }, [editing]);

    const open = () => {
        setDraft(toDraft(preferences));
        setError(null);
        setStatus(null);
        setEditing(true);
    };

    const close = () => {
        setEditing(false);
        setError(null);
    };

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            const { data } = await profileApi.savePreferences(toInput(draft));
            onSaved(data.profile);
            setEditing(false);
            setStatus('Đã lưu mục tiêu.');
        } catch (saveError) {
            setError((saveError as { message?: string }).message ?? 'Chưa lưu được. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    if (editing) {
        return (
            <form
                ref={formRef}
                className="prefs-panel__form"
                onSubmit={onSubmit}
                onKeyDown={(event) => event.key === 'Escape' && close()}
                noValidate
            >
                <PreferencesFields value={draft} onChange={setDraft} />
                <div className="prefs-panel__actions">
                    {error && (
                        <p className="prefs__error" role="alert">
                            {error}
                        </p>
                    )}
                    <button type="button" className="btn btn--quiet settings__btn" onClick={close}>
                        Huỷ
                    </button>
                    <button type="submit" className="btn btn--brand settings__btn" disabled={isSaving || draft.goals.length === 0}>
                        {isSaving && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                        {isSaving ? 'Đang lưu…' : 'Lưu'}
                    </button>
                </div>
            </form>
        );
    }

    if (preferences?.status !== 'answered') {
        return (
            <div className="prefs-panel__empty">
                <p>
                    Bạn chưa đặt mục tiêu. Memio dựa vào mục tiêu để gợi ý trò chơi, mục tiêu mỗi ngày và độ khó hợp với
                    bạn.
                </p>
                <button ref={editButton} type="button" className="settings__action" onClick={open}>
                    Đặt mục tiêu
                </button>
            </div>
        );
    }

    return (
        <dl className="settings">
            <div className="settings__row">
                <dt>Mục tiêu</dt>
                <dd>
                    <span className="settings__value">{preferences.goals.map((goal) => GOAL_LABELS[goal]).join(', ')}</span>
                    <span className="settings__status" role="status">
                        {status}
                    </span>
                    <button ref={editButton} type="button" className="settings__action" onClick={open}>
                        Sửa
                    </button>
                </dd>
            </div>

            {preferences.goals.includes('exam') && (
                <div className="settings__row">
                    <dt>Ngày thi</dt>
                    <dd>
                        {preferences.targetDate ? (
                            <span className="settings__value">{describeTargetDate(preferences.targetDate)}</span>
                        ) : (
                            <span className="settings__hint">Chưa đặt</span>
                        )}
                    </dd>
                </div>
            )}

            <div className="settings__row">
                <dt>Mỗi ngày</dt>
                <dd>
                    {preferences.dailyMinutes ? (
                        <span className="settings__value">{formatMinutes(preferences.dailyMinutes)}</span>
                    ) : (
                        <span className="settings__hint">Chưa chọn</span>
                    )}
                </dd>
            </div>
        </dl>
    );
};
