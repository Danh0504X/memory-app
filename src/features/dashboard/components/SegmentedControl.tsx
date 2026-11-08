interface SegmentedOption<T extends string> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string> {
    label: string;
    options: readonly SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
}

// Nút chuyển đoạn đặt ở đầu khối mà nó điều khiển (không có bộ lọc chung cho cả trang)
export const SegmentedControl = <T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) => (
    <div role="group" aria-label={label} className="seg">
        {options.map((option) => (
            <button
                key={option.value}
                type="button"
                aria-pressed={option.value === value}
                onClick={() => onChange(option.value)}
                className="seg__option"
            >
                {option.label}
            </button>
        ))}
    </div>
);
