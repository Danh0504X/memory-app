import { useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useReveal } from "@/lib/useReveal";
import { StoryDemo } from "@/features/methods/components/MethodDemos";
import { METHODS } from "@/features/methods/methodsData";

const delay = (d: number) => ({ "--d": d }) as CSSProperties;

// Trên trang chủ chỉ giới thiệu ngắn ba cách và cho thử cách dễ nhất; học kỹ từng cách ở trang Phương pháp (/methods)
export const MethodsTeaser = () => {
    const root = useRef<HTMLElement>(null);
    useReveal(root);

    return (
        <section id="methods" ref={root} className="chapter chapter--mint" data-tint="mint" aria-labelledby="teaser-title">
            <div className="chapter__inner page-col">
                <div className="chapter__copy">
                    <h2 id="teaser-title" className="text-title">
                        <span data-reveal="line"><span>Ba cách nhớ,</span></span>
                        <span data-reveal="line" style={delay(1)}><span>ba hòn đảo</span></span>
                    </h2>
                    <p className="text-lead" data-reveal style={delay(2)}>
                        Mỗi cách hợp với một kiểu thông tin. Thử ngay cách dễ nhất bên cạnh, rồi khám phá hai cách còn lại.
                    </p>
                    <ul className="teaser" data-reveal style={delay(3)}>
                        {METHODS.map((method) => (
                            <li key={method.id}>
                                <Link to={`/methods#method-${method.id}`} viewTransition className="teaser__row">
                                    <span className={`teaser__dot teaser__dot--${method.tone}`} aria-hidden="true" />
                                    <span className="teaser__text">
                                        <strong>{method.name}</strong>
                                        <span>{method.summary}</span>
                                    </span>
                                    <ArrowRight size={18} aria-hidden="true" className="teaser__arrow" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="chapter__actions" data-reveal style={delay(4)}>
                        <Link to="/methods" viewTransition className="btn btn--brand">
                            Xem cả ba cách
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
                <div className="chapter__demo" data-reveal style={delay(2)}>
                    <StoryDemo />
                </div>
            </div>
        </section>
    );
};
