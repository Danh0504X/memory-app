import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Menu, X, User, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/authStore";
import memioLogo from "@/assets/memio/Logo/Memio.svg";
import { UserMenu } from "./UserMenu";
import { prefetchDashboard } from "@/features/dashboard/hooks/useDashboardData";

// Nút đăng nhập/đăng ký mang cùng view-transition-name với tấm vé xanh ở trang auth, nên khi chuyển trang nó "nở" thành tấm vé
const morphIntoAuthCard = (event: React.MouseEvent<HTMLElement>) => {
  event.currentTarget.style.setProperty("view-transition-name", "auth-card");
};

// "Trang chủ" đứng đầu cho người chưa quen quy ước bấm logo để về trang chủ.
// Trang Tiến độ nằm trong menu tài khoản (UserMenu) và phần tài khoản của menu điện thoại, không đứng trên thanh này.
const NAV_LINKS = [
  { label: "Trang chủ", href: "/" },
  { label: "Phương pháp", href: "/methods" },
  { label: "Trò chơi", href: "/games" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const { user, isAuthenticated, logout } = useAuthStore();

  // Mục đang mở: trang hiện tại hoặc trang con của nó (/methods/story-linking thuộc "Phương pháp")
  const { pathname } = useLocation();
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Trang có các chương màu (data-tint: trang chủ, trang Phương pháp): header lấy màu chương đang nằm ngay dưới nó
  const [tint, setTint] = useState<string | null>(null);

  useEffect(() => {
    const zones = [...document.querySelectorAll<HTMLElement>("[data-tint]")];
    if (!zones.length) return;

    const visible = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const zone = entry.target as HTMLElement;
          if (entry.isIntersecting) visible.add(zone);
          else visible.delete(zone);
        }
        // Lúc nhảy tới neo, chương cũ chỉ còn chạm mép dải nên vẫn bị tính là đang hiện: luôn lấy vùng nằm thấp hơn
        const lowest = [...visible].sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];
        setTint(lowest?.dataset.tint ?? null);
      },
      // Một dải mỏng ngay dưới header (84px)
      { rootMargin: "-84px 0px -75% 0px" },
    );
    zones.forEach((zone) => observer.observe(zone));
    return () => observer.disconnect();
  }, []);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      setIsMenuOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      const apiError = error as { message?: string };
      const errorMessage =
        apiError?.message ||
        "Đăng xuất thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.";
      setLogoutError(errorMessage);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="site-header sticky top-0 z-50 bg-wall" data-tint={tint ?? undefined}>
      <div className="page-col flex h-[84px] items-center justify-between">
        {/* Logo */}
        <Link to="/" viewTransition aria-label="Memio, về trang chủ" className="flex items-center gap-3 z-50">
          <img
            src={memioLogo}
            alt=""
            className="h-[40px] w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav & Actions */}
        {/* Từ 1024px mới đủ chỗ cho 4 mục cùng nút tài khoản trên một hàng; nhỏ hơn dùng menu thu gọn */}
        <div className="hidden items-center gap-10 lg:flex">
          <nav className="flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                viewTransition
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className="nav-link text-body font-medium text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  viewTransition
                  state={{ morph: true }}
                  onClick={morphIntoAuthCard}
                  className="nav-link text-body font-medium text-ink"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  viewTransition
                  state={{ morph: true }}
                  onClick={morphIntoAuthCard}
                  className="btn btn--brand h-12"
                >
                  Đăng ký
                </Link>
              </>
            ) : (
              <UserMenu />
            )}
          </div>
        </div>

        {/* Mobile Right Buttons */}
        <div className="flex items-center gap-3 lg:hidden">
          <Link
            to="/games"
            viewTransition
            className="btn btn--brand h-11 px-5"
          >
            Bắt đầu
          </Link>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-ui bg-step text-ink transition-transform active:scale-95"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <div
          className={cn(
            "fixed inset-0 top-[84px] z-40 bg-wall px-6 py-8 transition-[transform,visibility] duration-300 ease-in-out lg:hidden",
            isMenuOpen ? "visible translate-x-0" : "invisible translate-x-full",
          )}
        >
          <nav className="flex flex-col gap-6 text-left">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                viewTransition
                onClick={() => setIsMenuOpen(false)}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className="text-[18px] font-medium text-ink aria-[current=page]:font-bold aria-[current=page]:text-brand-deep"
              >
                {link.label}
              </Link>
            ))}
            <div className="h-2" />
            {!isAuthenticated ? (
              <div className="flex flex-col gap-4 mt-2">
                <Link
                  to="/login"
                  viewTransition
                  onClick={() => setIsMenuOpen(false)}
                  className="btn btn--quiet w-full"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  viewTransition
                  onClick={() => setIsMenuOpen(false)}
                  className="btn btn--brand w-full"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                {/* Mobile User Card */}
                <div className="flex items-center gap-3 rounded-ui bg-step p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF8EF] text-sm font-bold text-[#2E7D32]">
                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[15px] font-bold text-[#1F2937] truncate">
                      {user?.username || "User"}
                    </span>
                    {user?.email && (
                      <span className="text-[12px] text-[#667085] truncate">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Thông báo lỗi mobile nếu đăng xuất thất bại */}
                {logoutError && (
                  <div
                    role="alert"
                    className="rounded-ui bg-[#ffe4df] p-3 text-[14px] text-[#8f1d14]"
                  >
                    {logoutError}
                  </div>
                )}

                {/* Mobile Mục: Tiến độ luyện tập (tải trước khi chạm / focus) */}
                <Link
                  to="/dashboard"
                  viewTransition
                  onPointerEnter={prefetchDashboard}
                  onFocus={prefetchDashboard}
                  onClick={() => setIsMenuOpen(false)}
                  className="btn btn--quiet w-full"
                >
                  <BarChart3 size={18} className="text-[#2E7D32]" aria-hidden="true" />
                  <span>Tiến độ luyện tập</span>
                </Link>

                {/* Mobile Mục: Hồ sơ của bạn */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="btn btn--quiet w-full"
                >
                  <User size={18} className="text-[#2E7D32]" aria-hidden="true" />
                  <span>Hồ sơ của bạn</span>
                </button>

                {/* Mobile Mục: Đăng xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="btn btn--quiet w-full text-[#b42318] disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 size={18} className="animate-spin text-[#DC2626]" />
                  ) : (
                    <LogOut size={18} aria-hidden="true" />
                  )}
                  <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
