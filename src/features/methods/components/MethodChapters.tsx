import { useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useReveal } from "@/lib/useReveal";
import { METHODS, type MethodId } from "../methodsData";
import { LociDemo, NumbersDemo, StoryDemo } from "./MethodDemos";

const DEMOS: Record<MethodId, ReactNode> = {
    story: <StoryDemo />,
    numbers: <NumbersDemo />,
    loci: <LociDemo />,
};

const delay = (d: number) => ({ "--d": d }) as CSSProperties;

// Ba chương màu, mỗi chương một phương pháp kèm trò thử; dùng trên trang Phương pháp (/methods)
export const MethodChapters = () => {
    const root = useRef<HTMLDivElement>(null);
    useReveal(root);

    return (
        <div ref={root}>
            {METHODS.map((method) => (
                <section
                    key={method.id}
                    id={`method-${method.id}`}
                    className={`chapter chapter--${method.tone}`}
                    data-tint={method.tone}
                    data-chapter={method.id}
                    aria-labelledby={`method-${method.id}-title`}
                >
                    <div className="chapter__inner page-col">
                        <div className="chapter__copy">
                            <h2 id={`method-${method.id}-title`} className="text-title">
                                <span data-reveal="line"><span>{method.title[0]}</span></span>
                                <span data-reveal="line" style={delay(1)}><span>{method.title[1]}</span></span>
                            </h2>
                            <p className="text-lead" data-reveal style={delay(2)}>{method.lead}</p>
                            <ul className="chapter__steps" data-reveal style={delay(3)}>
                                {method.steps.map((step) => (
                                    <li key={step}>{step}</li>
                                ))}
                            </ul>
                            <div className="chapter__actions" data-reveal style={delay(4)}>
                                <Link to={method.practice.to} viewTransition className="btn btn--brand">
                                    {method.practice.label}
                                    <ArrowRight size={18} aria-hidden="true" />
                                </Link>
                                <Link to={method.guide} viewTransition className="text-link">
                                    Xem hướng dẫn chi tiết
                                </Link>
                            </div>
                        </div>
                        <div className="chapter__demo" data-reveal style={delay(2)}>
                            {DEMOS[method.id]}
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
};
