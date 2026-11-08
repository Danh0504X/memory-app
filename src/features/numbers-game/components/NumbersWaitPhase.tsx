import { mutedText, primaryButton } from '../styles';

interface NumbersWaitPhaseProps {
    title: string;
    description?: string;
    formattedTime: string;
    buttonLabel: string;
    disabled: boolean;
    onSkip: () => void;
}

// Màn chờ dùng cho cả đếm ngược trước khi ghi nhớ và trước khi nhập đáp án.
// Không hiển thị dãy số; chỉ có một hành động chính để bỏ qua thời gian chờ.
export const NumbersWaitPhase = ({ title, description, formattedTime, buttonLabel, disabled, onSkip }: NumbersWaitPhaseProps) => (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <h1 className="text-3xl font-extrabold text-[#0d631b]">{title}</h1>
        {description && <p className={`max-w-md text-lg leading-relaxed ${mutedText}`}>{description}</p>}
        <p role="timer" aria-label={`Còn ${formattedTime}`} className="rounded-[32px] border border-[#e0eee6] bg-white px-10 py-5 font-mono text-6xl font-bold text-[#202b39] shadow-sm">
            {formattedTime}
        </p>
        <button type="button" onClick={onSkip} disabled={disabled} className={primaryButton}>
            {disabled ? 'Đang xử lý…' : buttonLabel}
        </button>
    </main>
);

