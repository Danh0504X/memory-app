import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useHashScroll } from '@/lib/useHashScroll';
import { useReveal } from '@/lib/useReveal';
import { MethodChapters } from '../components/MethodChapters';
import { MethodDoors } from '../components/MethodDoors';
import { METHODS, type MethodId } from '../methodsData';
import '../methods.css';

const delay = (d: number) => ({ '--d': d }) as CSSProperties;

// Trang Phương pháp: chọn cách theo điều muốn nhớ, ba chương có trò thử, rồi bảng so sánh nhanh
export const MethodsPage = () => {
    const root = useRef<HTMLElement>(null);
    const [current, setCurrent] = useState<MethodId | null>(null);
    useReveal(root);
    useHashScroll();

    // Thanh mục lục đứng yên dưới header, sáng theo chương đang nằm ngay dưới nó
    useEffect(() => {
        const chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
        const visible = new Set<HTMLElement>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
                    else visible.delete(entry.target as HTMLElement);
                }
                const lowest = [...visible].sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];
                setCurrent((lowest?.dataset.chapter as MethodId | undefined) ?? null);
            },
            // Dải ngay dưới header (84px) và thanh mục lục (56px)
            { rootMargin: '-140px 0px -70% 0px' },
        );
        chapters.forEach((chapter) => observer.observe(chapter));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-svh">
            <Header />
            <main ref={root}>
                <section className="methods-hero page-col" aria-labelledby="methods-title">
                    <div className="methods-hero__top">
                        <h1 id="methods-title" className="text-display">
                            <span data-reveal="line"><span>Ba cách</span></span>
                            <span data-reveal="line" style={delay(1)}><span>để nhớ</span></span>
                        </h1>
                        <p className="text-lead" data-reveal style={delay(2)}>
                            Mỗi cách hợp với một kiểu thông tin. Chọn một việc bạn hay phải nhớ, Memio chỉ cách hợp nhất
                            và gợi ý dùng ngay.
                        </p>
                    </div>
                    <div data-reveal style={delay(3)}>
                        <MethodDoors />
                    </div>
                </section>

                {/* Mục lục chỉ dính trên đầu trong phạm vi ba chương, hết chương thì cuộn đi cùng */}
                <div>
                <nav className="method-nav" aria-label="Các phương pháp" data-current={current ?? undefined}>
                    <div className="method-nav__inner page-col">
                        {METHODS.map((method) => (
                            <Link
                                key={method.id}
                                to={`#method-${method.id}`}
                                className={`method-nav__link method-nav__link--${method.tone}`}
                                aria-current={current === method.id ? 'location' : undefined}
                            >
                                {method.island}
                            </Link>
                        ))}
                    </div>
                </nav>

                <MethodChapters />
                </div>

                <section className="compare page-col" aria-labelledby="compare-title">
                    <h2 id="compare-title" className="text-title" data-reveal>
                        So sánh nhanh
                    </h2>
                    <div className="compare__scroll" data-reveal style={delay(1)}>
                        <table className="compare__table">
                            <thead>
                                <tr>
                                    <th scope="col">Phương pháp</th>
                                    <th scope="col">Hợp để nhớ</th>
                                    <th scope="col">Bắt đầu với</th>
                                    <th scope="col">Độ khó</th>
                                </tr>
                            </thead>
                            <tbody>
                                {METHODS.map((method) => (
                                    <tr key={method.id}>
                                        <th scope="row">
                                            <Link to={`#method-${method.id}`} className="compare__name">
                                                <span className={`compare__dot compare__dot--${method.tone}`} aria-hidden="true" />
                                                {method.name}
                                            </Link>
                                        </th>
                                        <td>{method.goodFor}</td>
                                        <td>{method.startWith}</td>
                                        <td>{method.level}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="compare__next" data-reveal style={delay(2)}>
                        <p className="text-lead">Đã chọn được cách? Thử dùng nó trong một ván bài hoặc ván hình.</p>
                        <Link to="/games" viewTransition className="btn btn--brand">
                            Chọn trò chơi
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MethodsPage;
