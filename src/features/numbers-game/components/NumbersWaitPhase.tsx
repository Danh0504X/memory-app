import { LoaderCircle, Play } from 'lucide-react';

interface NumbersWaitPhaseProps {
    title: string;
    description?: string;
    formattedTime: string;
    buttonLabel: string;
    disabled: boolean;
    onSkip: () => void;
}

// Màn chờ trên bàn xanh, dùng cho đếm ngược trước khi ghi nhớ và trước khi gõ lại.
// Không hiện dãy số; chỉ có một nút để bỏ qua thời gian chờ.
export const NumbersWaitPhase = ({ title, description, formattedTime, buttonLabel, disabled, onSkip }: NumbersWaitPhaseProps) => (
    <main className="play__table nwait">
        <h1>{title}</h1>
        {description && <p className="nwait__lead">{description}</p>}
        <p role="timer" aria-label={`Còn ${formattedTime}`} className="nwait__clock">
            {formattedTime}
        </p>
        <button type="button" onClick={onSkip} disabled={disabled} className="btn btn--sun">
            {disabled ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {disabled ? 'Đang xử lý…' : buttonLabel}
        </button>
    </main>
);
