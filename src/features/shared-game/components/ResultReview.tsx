import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

interface ResultReviewProps<T> {
    items: { expected: T; answer: T | null; correct: boolean }[];
    unit: string;   // "lá" hoặc "hình"
    renderItem: (item: T) => ReactNode;
    emptySize: { width: number; height: number };
}

// Đối chiếu từng vị trí: trên là bạn xếp, dưới là đáp án; cột sai nền đỏ nhạt
export const ResultReview = <T,>({ items, unit, renderItem, emptySize }: ResultReviewProps<T>) => {
    const wrong = items.filter((item) => !item.correct).length;

    return (
        <section className="review" aria-labelledby="review-title">
            <div className="review__head">
                <h2 id="review-title">Đối chiếu từng vị trí</h2>
                <p>
                    Hàng trên: bạn xếp · Hàng dưới: đáp án ·{" "}
                    {wrong === 0 ? `đúng cả ${items.length} ${unit}` : `sai ${wrong} ${unit}`}
                </p>
            </div>
            <ol className="review__grid">
                {items.map((item, index) => (
                    <li key={index} className="review__col" data-correct={item.correct}>
                        <span className="review__no">{index + 1}</span>
                        {item.answer ? (
                            renderItem(item.answer)
                        ) : (
                            <span className="review__empty" style={emptySize}>
                                Trống
                            </span>
                        )}
                        {renderItem(item.expected)}
                        <span className="review__mark">
                            {item.correct ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                            {item.correct ? "Đúng" : "Sai"}
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    );
};
