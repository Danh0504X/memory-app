import { useEffect, useId, useRef, type ReactNode } from "react";
import { Minus, Plus, X } from "lucide-react";

interface GameDialogProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    footer: ReactNode;
    wide?: boolean;
    children: ReactNode;
}

// Khung hộp thoại chung của trang game: Esc hoặc bấm ra ngoài để đóng, nút đóng luôn ở góc
export const GameDialog = ({ title, subtitle, onClose, footer, wide = false, children }: GameDialogProps) => {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        panelRef.current?.focus();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div className="gdlg" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="gdlg__panel"
                data-wide={wide}
            >
                <header className="gdlg__head">
                    <div>
                        <h2 id={titleId}>{title}</h2>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <button type="button" className="gdlg__close" onClick={onClose} aria-label="Đóng">
                        <X size={20} aria-hidden="true" />
                    </button>
                </header>
                <div className="gdlg__body">{children}</div>
                <footer className="gdlg__foot">{footer}</footer>
            </div>
        </div>
    );
};

// Một dòng cài đặt: tên và mô tả bên trái, điều khiển bên phải
export const SettingRow = ({ title, hint, children }: { title: string; hint: ReactNode; children?: ReactNode }) => (
    <div className="setting">
        <div>
            <h3>{title}</h3>
            <p>{hint}</p>
        </div>
        {children}
    </div>
);

export const Stepper = ({
    value,
    min,
    max,
    label,
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    label: string;
    onChange: (value: number) => void;
}) => (
    <div className="stepper" role="group" aria-label={label}>
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Giảm ${label.toLowerCase()}`}>
            <Minus size={18} aria-hidden="true" />
        </button>
        <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={value}
            aria-label={label}
            onChange={(e) => onChange(Number(e.target.value))}
        />
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Tăng ${label.toLowerCase()}`}>
            <Plus size={18} aria-hidden="true" />
        </button>
    </div>
);

export const Switch = ({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) => (
    <button type="button" role="switch" aria-label={label} aria-checked={checked} onClick={onToggle} className="switch">
        <span aria-hidden="true" />
    </button>
);

// Chọn một trong vài giá trị, dạng nút liền nhau
export const ChoiceGroup = <T extends string | number>({
    options,
    value,
    label,
    format,
    onChange,
}: {
    options: T[];
    value: T;
    label: string;
    format: (option: T) => string;
    onChange: (value: T) => void;
}) => (
    <div className="choices" role="group" aria-label={label}>
        {options.map((option) => (
            <button key={option} type="button" aria-pressed={option === value} onClick={() => onChange(option)}>
                {format(option)}
            </button>
        ))}
    </div>
);
