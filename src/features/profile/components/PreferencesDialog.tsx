import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { GameDialog } from '@/features/shared-game/components/GameDialog';
import { PROFILE_KEY } from '@/features/dashboard/hooks/useOverview';
import { setQuery } from '@/lib/queryCache';
import { profileApi } from '../api/profile.api';
import { toDraft, toInput, type PreferencesDraft } from '../utils/preferences';
import { PreferencesFields } from './PreferencesFields';

const NO_GOAL = 'Chọn ít nhất một mục tiêu, hoặc bấm Bỏ qua.';

// Hỏi mục tiêu một lần cho tài khoản chưa trả lời. Bỏ qua (nút, Esc, dấu ×, bấm ra nền tối) cũng được lưu
// để không hỏi lại; người dùng vẫn đặt hoặc đổi được trong trang hồ sơ.
// onDone(true) khi vừa lưu mục tiêu: trang gọi nên tải lại hồ sơ để gợi ý đổi theo ngay
export const PreferencesDialog = ({ onDone }: { onDone: (saved: boolean) => void }) => {
    const [draft, setDraft] = useState(() => toDraft(undefined));
    const [isSaving, setIsSaving] = useState(false);
    const [goalsError, setGoalsError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const change = (next: PreferencesDraft) => {
        setDraft(next);
        if (next.goals.length > 0) setGoalsError(null);
    };

    const skip = () => {
        if (isSaving) return;
        onDone(false);
        // Lỗi thì thôi: lần sau mở trang sẽ hỏi lại, không cần làm phiền người dùng bây giờ
        profileApi
            .skipPreferences()
            .then(({ data }) => setQuery(PROFILE_KEY, data.profile))
            .catch(() => undefined);
    };

    const save = async () => {
        if (draft.goals.length === 0) {
            setGoalsError(NO_GOAL);
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const { data } = await profileApi.savePreferences(toInput(draft));
            setQuery(PROFILE_KEY, data.profile);
            onDone(true);
        } catch (saveError) {
            setError((saveError as { message?: string }).message ?? 'Chưa lưu được. Vui lòng thử lại.');
            setIsSaving(false);
        }
    };

    return (
        <GameDialog
            narrow
            title="Bạn luyện trí nhớ để làm gì?"
            onClose={skip}
            footer={
                <>
                    <button type="button" className="btn btn--quiet" onClick={skip} disabled={isSaving}>
                        Bỏ qua
                    </button>
                    <button type="button" className="btn btn--brand" onClick={save} disabled={isSaving} aria-busy={isSaving}>
                        {isSaving && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                        {isSaving ? 'Đang lưu…' : 'Lưu mục tiêu'}
                    </button>
                </>
            }
        >
            <p className="prefs-dialog__lead">
                Memio dựa vào câu trả lời để gợi ý trò chơi, mục tiêu mỗi ngày và độ khó hợp với bạn. Chỉ mình bạn
                thấy, và bạn có thể đổi bất cứ lúc nào trong Hồ sơ.
            </p>
            <PreferencesFields value={draft} onChange={change} goalsError={goalsError} />
            {error && (
                <p className="prefs__error prefs-dialog__error" role="alert">
                    {error}
                </p>
            )}
        </GameDialog>
    );
};
