import { useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useReveal } from "@/lib/useReveal";
import { WOODCUT_CREDIT } from "./woodcuts";
import type { GuideContent } from "./types";
import "./guide.css";

const delay = (d: number) => ({ "--d": d }) as CSSProperties;

// Vị trí "rời rạc" cố định cho sơ đồ: trông ngẫu nhiên nhưng không đổi giữa các lần tải
const LOOSE_SPOTS = [
    { x: 6, y: 12, r: -14 },
    { x: 52, y: 4, r: 10 },
    { x: 30, y: 46, r: 18 },
    { x: 70, y: 54, r: -8 },
    { x: 4, y: 64, r: 6 },
    { x: 44, y: 78, r: -20 },
];

const SECTIONS = [
    { id: "cach-lam", label: "Cách làm" },
    { id: "bang-hinh", label: "Xem từng hình" },
    { id: "choi-thu", label: "Chơi thử" },
    { id: "ap-dung", label: "Áp dụng" },
];

// Trang hướng dẫn một phương pháp. Hình chủ đạo là cái đĩa tròn: trong sách của Romberch (1520) mỗi chữ cái
// được vẽ thành đồ vật nằm trong một vòng tròn; ở đây đĩa giữ hình của Memio, ảnh khắc gỗ, nút bấm và dấu đầu dòng.
export const GuidePage = ({ content }: { content: GuideContent }) => {
    const root = useRef<HTMLElement>(null);
    const [selected, setSelected] = useState(0);
    useReveal(root);

    const { hero, how, index, trial, history, apply, close } = content;
    const current = index.items[selected];

    return (
        <div className={`method-guide method-guide--${content.tone} min-h-svh`}>
            <Header />
            <main ref={root}>
                <section className="guide-hero" data-tint={content.tone} aria-labelledby="guide-title">
                    <div className="guide-hero__inner page-col">
                        <div className="guide-hero__copy">
                            <nav aria-label="Đường dẫn" className="guide-crumbs" data-reveal>
                                <Link to="/methods" viewTransition className="text-link">
                                    Phương pháp
                                </Link>
                                <span aria-hidden="true"> / </span>
                                <span>{content.crumb}</span>
                            </nav>
                            <h1 id="guide-title" className="text-display">
                                <span data-reveal="line" style={delay(1)}><span>{content.title}</span></span>
                            </h1>
                            <p className="text-lead guide-hero__lead" data-reveal style={delay(2)}>
                                {content.lead}
                            </p>
                            <div className="guide-hero__actions" data-reveal style={delay(3)}>
                                <a href="#choi-thu" className="btn btn--brand guide-btn">
                                    Chơi thử ngay
                                    <ArrowRight size={18} aria-hidden="true" />
                                </a>
                                <a href="#ap-dung" className="text-link">
                                    Dùng trong trò chơi nào?
                                </a>
                            </div>
                        </div>
                        <div className="guide-hero__art" aria-hidden="true">
                            <div className="guide-hero__disc">
                                <img src={hero.picture.src} alt="" className="shape is-live" data-motion={hero.picture.motion} />
                            </div>
                            <figure className="guide-hero__woodcut">
                                <img src={hero.woodcut.src} alt="" width="560" height="560" />
                            </figure>
                        </div>
                    </div>
                    <nav className="guide-tabs page-col" aria-label="Các phần của trang">
                        {SECTIONS.map((section, i) => (
                            <a key={section.id} href={`#${section.id}`} className="guide-tab" style={delay(4 + i)}>
                                {section.label}
                            </a>
                        ))}
                    </nav>
                </section>

                <section id="cach-lam" className="guide-how page-col" aria-labelledby="how-title">
                    <div className="guide-how__head">
                        <h2 id="how-title" className="text-title" data-reveal>{how.title}</h2>
                        <p className="text-body" data-reveal style={delay(1)}>{how.intro}</p>
                    </div>
                    <div className="guide-flow" aria-hidden="true" data-reveal style={delay(2)}>
                        <div className="guide-flow__zone guide-flow__zone--loose">
                            {how.loose.map((picture, i) => {
                                const spot = LOOSE_SPOTS[i % LOOSE_SPOTS.length];
                                return (
                                    <span
                                        key={`${picture.name}-${i}`}
                                        className="guide-flow__dot"
                                        style={{ "--x": `${spot.x}%`, "--y": `${spot.y}%`, "--r": `${spot.r}deg`, "--i": i } as CSSProperties}
                                    >
                                        <img src={picture.src} alt="" />
                                    </span>
                                );
                            })}
                        </div>
                        <div className="guide-flow__zone guide-flow__zone--ribbon">
                            {how.ordered.map(({ picture }, i) => (
                                <span key={`${picture.name}-${i}`} className="guide-flow__dot" style={{ "--i": i } as CSSProperties}>
                                    <img src={picture.src} alt="" />
                                </span>
                            ))}
                        </div>
                        <ol className="guide-flow__zone guide-flow__zone--ordered" style={{ "--count": how.ordered.length } as CSSProperties}>
                            {how.ordered.map(({ picture, label }, i) => (
                                <li key={`${label}-${i}`} style={{ "--i": i } as CSSProperties}>
                                    <span className="guide-flow__dot">
                                        <img src={picture.src} alt="" className="shape is-live" data-motion={picture.motion} />
                                    </span>
                                    <span className="guide-flow__label">{label}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <ol className="guide-steps">
                        {how.steps.map((step, i) => (
                            <li key={step.name} data-reveal style={delay(3 + i)}>
                                <h3>{step.name}</h3>
                                <p>{step.text}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section id="bang-hinh" className="guide-index page-col" aria-labelledby="index-title">
                    <div className="guide-index__stage" data-reveal>
                        <div className="guide-index__disc">
                            <div key={selected} className="guide-index__art">
                                {current.art}
                            </div>
                        </div>
                        <p className="guide-index__fact text-body" aria-live="polite">
                            <strong>{current.name}.</strong> {current.fact}
                        </p>
                    </div>
                    <div className="guide-index__list">
                        <h2 id="index-title" className="guide-index__title" data-reveal>{index.title}</h2>
                        <p className="text-small guide-index__hint" data-reveal style={delay(1)}>{index.hint}</p>
                        <ul className="guide-index__names" data-reveal style={delay(2)}>
                            {index.items.map((item, i) => (
                                <li key={item.name}>
                                    <button
                                        type="button"
                                        className="guide-index__name"
                                        aria-pressed={i === selected}
                                        onClick={() => setSelected(i)}
                                        onPointerEnter={(event) => {
                                            if (event.pointerType === "mouse") setSelected(i);
                                        }}
                                        onFocus={() => setSelected(i)}
                                    >
                                        {item.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section id="choi-thu" className="guide-trial" aria-labelledby="trial-title">
                    <div className="guide-trial__inner page-col">
                        <div className="guide-trial__head">
                            <h2 id="trial-title" className="text-title" data-reveal>{trial.title}</h2>
                            <p className="text-lead" data-reveal style={delay(1)}>{trial.intro}</p>
                        </div>
                        <div className="guide-trial__board" data-reveal style={delay(2)}>
                            {trial.game}
                        </div>
                    </div>
                </section>

                <section className="guide-history" aria-labelledby="history-title">
                    <div className="guide-history__inner page-col">
                        <div className="guide-history__copy">
                            <h2 id="history-title" className="text-title" data-reveal>{history.title}</h2>
                            <p className="text-body" data-reveal style={delay(1)}>{history.text}</p>
                        </div>
                        <ul className="guide-history__plates">
                            {history.woodcuts.map((woodcut, i) => (
                                <li key={woodcut.src} data-reveal style={delay(2 + i)}>
                                    <figure>
                                        <div className="guide-history__disc">
                                            <img src={woodcut.src} alt={woodcut.alt} width="560" height="560" loading="lazy" decoding="async" />
                                        </div>
                                        <figcaption>
                                            {woodcut.caption}
                                            <br />
                                            <a href={woodcut.source} target="_blank" rel="noreferrer">
                                                Ảnh gốc
                                            </a>
                                        </figcaption>
                                    </figure>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section id="ap-dung" className="guide-apply page-col" aria-labelledby="apply-title">
                    <h2 id="apply-title" className="text-title" data-reveal>{apply.title}</h2>
                    {apply.groups.map((group, g) => (
                        <div key={group.name} className="guide-apply__group">
                            <div className="guide-apply__groupname" data-reveal>
                                <h3>{group.name}</h3>
                                <span className="text-body">{group.items.length} cách dùng</span>
                            </div>
                            <ul className="guide-apply__items">
                                {group.items.map((item, i) => {
                                    const body = (
                                        <>
                                            <span className="guide-apply__bullet" style={{ "--c": item.art.color } as CSSProperties} aria-hidden="true">
                                                <img src={item.art.src} alt="" />
                                            </span>
                                            <span className="guide-apply__text">
                                                <span className="guide-apply__line">
                                                    <strong>{item.name}</strong>
                                                    <span className="guide-apply__fact">{item.fact}</span>
                                                </span>
                                                <span className="guide-apply__desc">{item.text}</span>
                                                {item.note && <span className="guide-apply__note">{item.note}</span>}
                                            </span>
                                        </>
                                    );
                                    return (
                                        <li key={item.name} data-reveal style={delay(g + i)}>
                                            {item.to ? (
                                                <Link to={item.to} viewTransition className="guide-apply__item guide-apply__item--link">
                                                    {body}
                                                </Link>
                                            ) : (
                                                <div className="guide-apply__item">{body}</div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </section>

                <section className="guide-close" data-tint={content.tone} aria-labelledby="close-title">
                    <div className="guide-close__art" aria-hidden="true">
                        <div className="guide-close__disc">
                            <img src={close.picture.src} alt="" className="shape is-live" data-motion={close.motion} />
                        </div>
                    </div>
                    <div className="guide-close__inner page-col">
                        <div className="guide-close__copy">
                            <h2 id="close-title" className="text-title" data-reveal>{close.line}</h2>
                            <p className="text-body" data-reveal style={delay(1)}>{close.text}</p>
                            <p className="guide-close__fact" data-reveal style={delay(2)}>{close.fact}</p>
                            <div className="guide-close__actions" data-reveal style={delay(3)}>
                                <Link to={close.action.to} viewTransition className="btn btn--brand guide-btn">
                                    {close.action.label}
                                    <ArrowRight size={18} aria-hidden="true" />
                                </Link>
                                <Link to={close.next.to} viewTransition className="text-link">
                                    {close.next.label}
                                </Link>
                            </div>
                        </div>
                    </div>
                    <p className="guide-credit page-col">{WOODCUT_CREDIT}</p>
                </section>
            </main>
        </div>
    );
};
