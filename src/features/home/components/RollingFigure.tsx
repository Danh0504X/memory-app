import type { CSSProperties } from "react";

// Mỗi chữ số là một cột 0–9 lăn tới đúng giá trị khi phần tử [data-reveal] bao ngoài nhận .is-in (xem home.css).
// Dải 0–9 vẽ bằng CSS content nên không lẫn vào chữ khi copy; trình đọc màn hình đọc giá trị thật trong .sr-only.
export const RollingFigure = ({ value }: { value: string }) => {
    let column = 0;

    return (
        <>
            <span className="sr-only">{value}</span>
            <span className="roll" aria-hidden="true">
                {[...value].map((char, index) =>
                    /\d/.test(char) ? (
                        <span key={index} className="roll__col">
                            {/* Giữ cột rộng đúng bằng chữ số đích (font không có chữ số đều độ rộng) */}
                            <span className="roll__size">{char}</span>
                            <span className="roll__strip" style={{ "--n": char, "--i": column++ } as CSSProperties} />
                        </span>
                    ) : (
                        <span key={index}>{char}</span>
                    ),
                )}
            </span>
        </>
    );
};
