import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Mascot } from "@/components/ui/Mascot";
import { useReveal } from "@/lib/useReveal";
import { HeroSection } from "../components/HeroSection";
import { MethodsTeaser } from "../components/MethodsTeaser";
import { GameIntroSection } from "../components/GameIntroSection";
import { DailyTeaser } from "../components/DailyTeaser";
import { RollingFigure } from "../components/RollingFigure";
import "@/features/methods/methods.css";
import "../home.css";

const parentPoints = [
  ["Học cách tạo liên kết", "Tìm mối liên hệ giữa những điều cần nhớ."],
  ["Tập tự nhớ lại", "Thử nhắc lại hoặc sắp xếp thông tin khi gợi ý đã được giấu đi."],
  ["Tìm cách hợp với mình", "Thử lại, thay đổi liên kết và nhận ra cách nào giúp mình nhớ rõ hơn."],
];

// Số liệu lấy từ luật chơi ở backend (memory-be/src/config/games.ts): 10 cấp độ mỗi trò, đạt từ 70%, đúng hết mới mở cấp
const parentFacts = [
  ["6+", "Hợp nhất với các bé từ 6 tuổi, nhưng người lớn chơi cũng rèn được trí nhớ."],
  ["10 cấp độ", "Mỗi trò chơi đi từ dễ đến khó: từ 6 lên 24 hình, từ 5 lên 52 lá bài."],
  ["15 phút", "Mỗi ngày là đủ, tương đương 2 đến 3 ván ngắn."],
  ["70%", "Nhớ đúng từ 70% là đạt. Đúng hết mới mở cấp tiếp theo."],
];

const FAQ_GROUPS = [
  {
    id: "parents",
    label: "Cho bố mẹ",
    items: [
      [
        "Memio dành cho ai?",
        "Memio được làm chủ yếu cho các bé từ 6 tuổi, nhưng ai muốn rèn trí nhớ cũng chơi được, kể cả bố mẹ. Khi mới bắt đầu, con nên chọn ‘Nối thành câu chuyện’ và trò chơi hình ở cấp 1 (6 hình). Khi đã quen, con có thể thử thêm trò chơi lá bài và cách biến số thành hình.",
      ],
      [
        "Mỗi ngày con nên luyện bao lâu?",
        "Khoảng 10–15 phút, tức 2 đến 3 ván. Mỗi ván chỉ vài phút: trò chơi hình cho 1 phút để ghi nhớ, trò chơi lá bài cho 2 phút. Luyện đều mỗi ngày quan trọng hơn luyện lâu một lần.",
      ],
      [
        "Memio có mất phí không?",
        "Hiện tại Memio miễn phí. Con có thể chơi ngay mà không cần tài khoản, và tạo tài khoản cũng không mất phí.",
      ],
      [
        "Memio lưu những thông tin gì của con?",
        "Chỉ tên người dùng, email và mật khẩu (được mã hoá một chiều) để đăng nhập, cùng kết quả các ván chơi để tính tiến độ. Memio không hỏi họ tên thật, ngày sinh hay trường học của con.",
      ],
      [
        "Luyện tập có giúp con học tốt hơn không?",
        "Luyện tập giúp con quen với việc liên tưởng và sắp xếp thông tin có trật tự, nhờ đó việc học thuộc bài nhẹ nhàng hơn. Memio là bài tập rèn thói quen, không thay thế việc học trên lớp.",
      ],
    ],
  },
  {
    id: "play",
    label: "Về cách chơi",
    items: [
      [
        "Chưa biết phương pháp nào thì bắt đầu ở đâu?",
        "Hãy bắt đầu bằng ‘Nối thành câu chuyện’: làm quen với ví dụ rồi thử một dãy hình ngắn. Không cần học hết ba phương pháp trước khi chơi.",
      ],
      [
        "Nếu chưa nhớ đúng thì sao?",
        "Chưa nhớ hết là hoàn toàn bình thường. Sau mỗi ván, bạn thấy rõ chỗ mình quên để đổi câu chuyện hoặc hình ảnh, rồi chơi lại chính cấp độ đó.",
      ],
      [
        "Không đăng nhập thì tiến độ có được lưu không?",
        "Có, nhưng chỉ tạm thời: cấp độ đã mở được giữ 24 giờ kể từ ván gần nhất rồi tự xoá. Khi đăng nhập, Memio lưu lâu dài cấp độ, điểm kinh nghiệm, chuỗi ngày luyện tập và kỷ lục của từng trò chơi.",
      ],
    ],
  },
];

const delay = (d: number) => ({ "--d": d }) as CSSProperties;

// Tấm vé cuối trang mang cùng view-transition-name với tấm vé ở trang đăng nhập, nên khi bấm nó biến thành tấm vé đó
const morphTicket = (event: MouseEvent<HTMLElement>) => {
  event.currentTarget.closest(".ticket")?.setAttribute("style", "view-transition-name: auth-card");
};

export const HomePage = () => {
  const [faqGroup, setFaqGroup] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const showGroup = (index: number) => {
    setFaqGroup(index);
    setOpenFaq(0);
  };

  // Mũi tên trái/phải chuyển nhóm câu hỏi (chuẩn tablist)
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (faqGroup + (event.key === "ArrowRight" ? 1 : -1) + FAQ_GROUPS.length) % FAQ_GROUPS.length;
    showGroup(next);
    tabs.current[next]?.focus();
  };
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  // Link cũ từ trang hướng dẫn (/?method=story#methods) giờ trỏ tới chương tương ứng ở trang Phương pháp
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const method = new URLSearchParams(location.search).get("method");
    if (method) navigate(`/methods#method-${method}`, { replace: true });
  }, [location.search, navigate]);

  return (
    <div className="min-h-svh">
      <Header />
      <main ref={root}>
        <HeroSection />
        <MethodsTeaser />
        <GameIntroSection />
        <DailyTeaser />

        {/* Dành cho phụ huynh */}
        <section className="parents page-col" aria-labelledby="parents-title">
          <div className="parents__head">
            <h2 id="parents-title" className="text-title">
              <span data-reveal="line"><span>Con sẽ luyện</span></span>
              <span data-reveal="line" style={delay(1)}><span>những gì?</span></span>
            </h2>
            <p className="text-lead" data-reveal style={delay(2)}>
              Memio hướng dẫn con làm quen với các cách ghi nhớ qua hình ảnh, câu chuyện và vị trí. Sau mỗi ví dụ, con
              được tự thử một nhiệm vụ nhỏ.
            </p>
          </div>

          <ul className="parents__points">
            {parentPoints.map(([title, description], index) => (
              <li key={title} data-reveal style={delay(index)}>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ul>

          <div className="facts">
            <h3 className="facts__title" data-reveal>
              Vài con số bố mẹ cần biết
            </h3>
            <dl className="facts__list">
              {parentFacts.map(([figure, meaning], index) => (
                <div key={figure} data-reveal style={delay(index)}>
                  <dt>
                    <RollingFigure value={figure} />
                  </dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="parents__ask" data-reveal>
            <Mascot className="parents__mascot" />
            <blockquote>
              <p>“Con đã nghĩ ra câu chuyện gì để nhớ những hình này?”</p>
            </blockquote>
            <figcaption>
              Một câu hỏi nhỏ để bắt đầu: bố mẹ nghe con giải thích, cùng tạo một liên kết vui rồi để con tự thử lại.
            </figcaption>
          </figure>
        </section>

        {/* Câu hỏi thường gặp */}
        <section className="faq page-col" aria-labelledby="faq-title">
          <div className="faq__side">
            <h2 id="faq-title" className="text-title">
              <span data-reveal="line"><span>Bạn có thể</span></span>
              <span data-reveal="line" style={delay(1)}><span>đang thắc mắc</span></span>
            </h2>
            <div className="faq__tabs" role="tablist" aria-label="Nhóm câu hỏi" data-reveal style={delay(2)}>
              {FAQ_GROUPS.map((group, index) => (
                <button
                  key={group.id}
                  ref={(element) => {
                    tabs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`faq-tab-${group.id}`}
                  aria-selected={faqGroup === index}
                  aria-controls="faq-panel"
                  tabIndex={faqGroup === index ? 0 : -1}
                  className="faq__tab"
                  onClick={() => showGroup(index)}
                  onKeyDown={onTabKeyDown}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div className="faq__list" data-reveal style={delay(1)}>
            <div
              key={FAQ_GROUPS[faqGroup].id}
              id="faq-panel"
              role="tabpanel"
              aria-labelledby={`faq-tab-${FAQ_GROUPS[faqGroup].id}`}
              className="faq__panel"
            >
              {FAQ_GROUPS[faqGroup].items.map(([question, answer], index) => {
                const isOpen = openFaq === index;
                const answerId = `faq-answer-${FAQ_GROUPS[faqGroup].id}-${index}`;
                return (
                  <div key={question} className="faq__item" data-open={isOpen} style={delay(index)}>
                    <button
                      type="button"
                      className="faq__question"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      <span>{question}</span>
                      <Plus size={22} aria-hidden="true" className="faq__icon" />
                    </button>
                    <div id={answerId} className="faq__answer">
                      <div>
                        <p>{answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Lời mời cuối trang: tấm vé vào phòng nhớ */}
        <section className="closing page-col" aria-labelledby="closing-title">
          <div className="ticket" data-reveal>
            <Mascot className="ticket__mascot" />
            <div className="ticket__head">
              <h2 id="closing-title" className="text-title">
                Bắt đầu bằng
                <br />
                một câu chuyện
              </h2>
            </div>
            <div className="ticket__body">
              <p className="text-lead">Khám phá cách ghi nhớ đầu tiên và thử sức với những lá bài.</p>
              <div className="ticket__actions">
                <Link to="/games" viewTransition className="btn btn--sun">
                  Bắt đầu với Memio
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <p>
                  Đã có tài khoản?{" "}
                  <Link to="/login" viewTransition state={{ morph: true }} onClick={morphTicket} className="text-link ticket__link">
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="page-col">
          <div className="footer__row">
            <p>Học cách ghi nhớ qua những trò chơi nhỏ.</p>
            <nav className="footer__links" aria-label="Liên kết cuối trang">
              <a href="#methods" className="nav-link">
                Giới thiệu
              </a>
              <button type="button" className="nav-link" onClick={() => alert("Trang liên hệ đang được phát triển")}>
                Liên hệ
              </button>
              <button type="button" className="nav-link" onClick={() => alert("Điều khoản sử dụng đang được cập nhật")}>
                Điều khoản
              </button>
              <button
                type="button"
                className="nav-link"
                onClick={() => alert("Chính sách quyền riêng tư đang được cập nhật")}
              >
                Quyền riêng tư
              </button>
            </nav>
          </div>
          <p className="footer__mark" aria-hidden="true">
            Memio
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
