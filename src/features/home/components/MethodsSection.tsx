import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useReveal } from "@/lib/useReveal";
import { LociDemo, NumbersDemo, StoryDemo } from "./MethodDemos";

type MethodId = "story" | "numbers" | "loci";

type Chapter = {
    id: MethodId;
    tone: "mint" | "sun" | "sky";
    title: [string, string];
    lead: string;
    steps: string[];
    practice: { to: string; label: string };
    guide: string;
    demo: ReactNode;
};

const CHAPTERS: Chapter[] = [
    {
        id: "story",
        tone: "mint",
        title: ["Nối thành", "câu chuyện"],
        lead: "Nối các hình ảnh bằng một câu chuyện của riêng bạn. Khi kể lại, từng hình sẽ tự hiện ra theo đúng thứ tự.",
        steps: [
            "Nhìn và gọi tên từng hình.",
            "Tưởng tượng một hành động nối hình trước với hình sau.",
            "Giấu các hình đi rồi kể lại câu chuyện.",
        ],
        practice: { to: "/practice/story", label: "Thử với 4 hình" },
        guide: "/methods/story-linking",
        demo: <StoryDemo />,
    },
    {
        id: "numbers",
        tone: "sun",
        title: ["Biến số", "thành hình"],
        lead: "Số 2 trông như thiên nga, số 8 giống người tuyết. Đổi số thành hình, rồi dùng hình để nhớ cả một dãy số.",
        steps: [
            "Làm quen với hình của từng số từ 0 đến 9.",
            "Nối các hình theo thứ tự của dãy số.",
            "Nhớ lại các hình rồi đổi chúng về số.",
        ],
        practice: { to: "/practice/numbers", label: "Thử nhớ một dãy số" },
        guide: "/methods/number-shape",
        demo: <NumbersDemo />,
    },
    {
        id: "loci",
        tone: "sky",
        title: ["Căn phòng", "trí nhớ"],
        lead: "Đặt mỗi điều cần nhớ vào một vị trí quen thuộc, rồi đi lại các vị trí ấy trong tưởng tượng để tìm lại chúng.",
        steps: [
            "Chọn vài vị trí quen và một lộ trình cố định.",
            "Đặt một hình ảnh cần nhớ vào mỗi vị trí.",
            "Đi lại đúng lộ trình để gọi tên từng hình.",
        ],
        practice: { to: "/practice/loci", label: "Khám phá căn phòng" },
        guide: "/methods/memory-palace",
        demo: <LociDemo />,
    },
];

const delay = (d: number) => ({ "--d": d }) as CSSProperties;

export const MethodsSection = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const root = useRef<HTMLDivElement>(null);
    useReveal(root);

    // Trang hướng dẫn quay về bằng /?method=...#methods: cuộn thẳng tới chương tương ứng
    useEffect(() => {
        if (location.hash !== "#methods") return;
        const method = searchParams.get("method");
        const target = document.getElementById(method ? `method-${method}` : "methods") ?? document.getElementById("methods");
        const timer = setTimeout(() => target?.scrollIntoView({ behavior: "smooth" }), 50);
        return () => clearTimeout(timer);
    }, [searchParams, location.hash]);

    return (
        <div id="methods" className="methods" ref={root} data-nav="/#methods">
            <header className="methods__intro page-col">
                <div>
                <h2 className="text-title">
                    <span data-reveal="line"><span>Ba cách nhớ,</span></span>
                    <span data-reveal="line" style={delay(1)}><span>ba hòn đảo</span></span>
                </h2>
                </div>
                <p className="methods__lead text-lead" data-reveal style={delay(2)}>
                    Mỗi cách đều có một trò thử nhỏ ngay bên dưới. Không cần đăng nhập, không cần học trước.
                </p>
            </header>

            {CHAPTERS.map((chapter) => (
                <section
                    key={chapter.id}
                    id={`method-${chapter.id}`}
                    className={`chapter chapter--${chapter.tone}`}
                    data-tint={chapter.tone}
                    aria-labelledby={`method-${chapter.id}-title`}
                >
                    <div className="chapter__inner page-col">
                        <div className="chapter__copy">
                            <h2 id={`method-${chapter.id}-title`} className="text-title">
                                <span data-reveal="line"><span>{chapter.title[0]}</span></span>
                                <span data-reveal="line" style={delay(1)}><span>{chapter.title[1]}</span></span>
                            </h2>
                            <p className="text-lead" data-reveal style={delay(2)}>{chapter.lead}</p>
                            <ul className="chapter__steps" data-reveal style={delay(3)}>
                                {chapter.steps.map((step) => (
                                    <li key={step}>{step}</li>
                                ))}
                            </ul>
                            <div className="chapter__actions" data-reveal style={delay(4)}>
                                <Link to={chapter.practice.to} viewTransition className="btn btn--brand">
                                    {chapter.practice.label}
                                    <ArrowRight size={18} aria-hidden="true" />
                                </Link>
                                <Link to={chapter.guide} viewTransition className="text-link">
                                    Xem hướng dẫn chi tiết
                                </Link>
                            </div>
                        </div>
                        <div className="chapter__demo" data-reveal style={delay(2)}>
                            {chapter.demo}
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
};
