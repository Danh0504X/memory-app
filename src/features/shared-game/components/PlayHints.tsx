// Gợi ý phím tắt dưới bàn chơi; ẩn trên màn hình cảm ứng
export const PlayHints = ({ hints }: { hints: { keys: string[]; label: string }[] }) => (
    <ul className="play__hints" aria-label="Phím tắt">
        {hints.map((hint) => (
            <li key={hint.label}>
                {hint.keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                ))}
                <span>{hint.label}</span>
            </li>
        ))}
    </ul>
);
