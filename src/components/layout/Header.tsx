import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/authStore";
import memioLogo from "@/assets/memio/Logo/Memio.svg";

// Nút đăng nhập/đăng ký mang cùng view-transition-name với tấm vé xanh ở trang auth, nên khi chuyển trang nó "nở" thành tấm vé
const morphIntoAuthCard = (event: React.MouseEvent<HTMLElement>) => {
  event.currentTarget.style.setProperty("view-transition-name", "auth-card");
};

const NAV_LINKS = [
  { label: "Phương pháp", href: "/#methods" },
  { label: "Trò chơi", href: "/games" },
  { label: "Tiến độ", href: "/dashboard" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const profileItemRef = useRef<HTMLButtonElement>(null);
  const logoutItemRef = useRef<HTMLButtonElement>(null);

  const { user, isAuthenticated, logout } = useAuthStore();

  // Trang có các vùng data-tint / data-nav (hiện chỉ trang chủ): header lấy màu chương đang nằm ngay dưới nó
  // và gạch chân link của vùng đó. Trang không có các vùng này thì header giữ nguyên.
  const [tint, setTint] = useState<string | null>(null);
  const [currentNav, setCurrentNav] = useState<string | null>(null);

  useEffect(() => {
    const zones = [...document.querySelectorAll<HTMLElement>("[data-tint], [data-nav]")];
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
        const lowest = (key: "tint" | "nav") =>
          [...visible]
            .filter((zone) => zone.dataset[key])
            .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0]?.dataset[key] ?? null;
        setTint(lowest("tint"));
        setCurrentNav(lowest("nav"));
      },
      // Một dải mỏng ngay dưới header (84px)
      { rootMargin: "-84px 0px -75% 0px" },
    );
    zones.forEach((zone) => observer.observe(zone));
    return () => observer.disconnect();
  }, []);
  const navigate = useNavigate();

  // Đóng dropdown khi click bên ngoài hoặc bấm phím Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
        setLogoutError(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isUserMenuOpen) {
        setIsUserMenuOpen(false);
        setLogoutError(null);
        userButtonRef.current?.focus();
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  // Điều hướng bằng bàn phím trên trigger button
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      if (!isUserMenuOpen) {
        e.preventDefault();
        setIsUserMenuOpen(true);
        setLogoutError(null);
        setTimeout(() => {
          profileItemRef.current?.focus();
        }, 0);
      }
    }
  };

  // Điều hướng bằng bàn phím giữa các mục trong dropdown
  const handleItemKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index === 0) {
        logoutItemRef.current?.focus();
      } else {
        profileItemRef.current?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 1) {
        profileItemRef.current?.focus();
      } else {
        logoutItemRef.current?.focus();
      }
    } else if (e.key === "Tab") {
      setIsUserMenuOpen(false);
      setLogoutError(null);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      setIsUserMenuOpen(false);
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
        <Link to="/" viewTransition className="flex items-center gap-3 z-50">
          <img
            src={memioLogo}
            alt="Memio Logo"
            className="h-[40px] w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav & Actions */}
        <div className="hidden items-center gap-10 md:flex">
          <nav className="flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                viewTransition
                aria-current={currentNav === link.href ? "location" : undefined}
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
              <div className="relative" ref={userMenuRef}>
                <button
                  ref={userButtonRef}
                  type="button"
                  id="user-menu-button"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-controls="user-menu-dropdown"
                  onClick={() => {
                    setIsUserMenuOpen((prev) => !prev);
                    setLogoutError(null);
                  }}
                  onKeyDown={handleTriggerKeyDown}
                  className={cn(
                    "flex items-center gap-3 rounded-[16px] border border-[#E3EBE6] bg-white px-5 py-3 text-[15px] font-semibold text-[#1F2937] transition-all cursor-pointer select-none",
                    "hover:border-[#2E7D32]/50 hover:bg-[#FDFEFE] hover:shadow-xs",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2",
                    isUserMenuOpen && "border-[#2E7D32]/50 bg-[#FDFEFE] shadow-xs"
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF8EF] text-sm font-bold text-[#2E7D32]">
                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className="max-w-[150px] truncate">
                    {user?.username || "User"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-[#667085] transition-transform duration-200",
                      isUserMenuOpen && "rotate-180 text-[#2E7D32]"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    id="user-menu-dropdown"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    className="absolute right-0 top-[calc(100%+8px)] w-[240px] rounded-[18px] border border-[#E3EBE6] bg-white p-2 shadow-[0px_8px_24px_rgba(31,77,51,0.08)] z-50 animate-in fade-in-50 zoom-in-95 duration-100"
                  >
                    {/* User Info Header */}
                    <div className="px-3 py-2">
                      <p className="text-[14px] font-bold text-[#1F2937] truncate">
                        {user?.username || "Người dùng"}
                      </p>
                      {user?.email && (
                        <p className="text-[12px] text-[#667085] truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                    </div>

                    <div className="my-1 h-px bg-[#E3EBE6]" role="separator" />

                    {/* Thông báo lỗi nếu đăng xuất thất bại */}
                    {logoutError && (
                      <div
                        role="alert"
                        className="mb-1.5 rounded-[10px] bg-[#FEF2F2] border border-[#FCA5A5] p-2 text-[12px] text-[#DC2626] leading-tight"
                      >
                        {logoutError}
                      </div>
                    )}

                    {/* Mục 1: Hồ sơ của bạn */}
                    <button
                      ref={profileItemRef}
                      role="menuitem"
                      type="button"
                      tabIndex={0}
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setLogoutError(null);
                        navigate("/profile");
                      }}
                      onKeyDown={(e) => handleItemKeyDown(e, 0)}
                      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium text-[#1F2937] hover:bg-[#EAF8EF] hover:text-[#2E7D32] focus:bg-[#EAF8EF] focus:text-[#2E7D32] focus-visible:outline-none transition-colors cursor-pointer text-left"
                    >
                      <User size={16} className="text-[#2E7D32] shrink-0" aria-hidden="true" />
                      <span>Hồ sơ của bạn</span>
                    </button>

                    <div className="my-1 h-px bg-[#E3EBE6]" role="separator" />

                    {/* Mục 2: Đăng xuất */}
                    <button
                      ref={logoutItemRef}
                      role="menuitem"
                      type="button"
                      tabIndex={0}
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      onKeyDown={(e) => handleItemKeyDown(e, 1)}
                      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] focus:bg-[#FEF2F2] focus-visible:outline-none transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? (
                        <Loader2 size={16} className="animate-spin text-[#DC2626] shrink-0" />
                      ) : (
                        <LogOut size={16} className="shrink-0" aria-hidden="true" />
                      )}
                      <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Right Buttons */}
        <div className="flex items-center gap-3 md:hidden">
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
            "fixed inset-0 top-[84px] z-40 bg-wall px-6 py-8 transition-[transform,visibility] duration-300 ease-in-out md:hidden",
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
                className="text-[18px] font-medium text-[#1F2937]"
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
                <div className="flex items-center gap-3 rounded-[16px] border border-[#E3EBE6] bg-white p-3.5">
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
                    className="rounded-[12px] bg-[#FEF2F2] border border-[#FCA5A5] p-3 text-[13px] text-[#DC2626]"
                  >
                    {logoutError}
                  </div>
                )}

                {/* Mobile Mục: Hồ sơ của bạn */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#E3EBE6] bg-white text-[15px] font-semibold text-[#1F2937] hover:border-[#2E7D32]/40 hover:text-[#2E7D32] transition-colors cursor-pointer"
                >
                  <User size={18} className="text-[#2E7D32]" aria-hidden="true" />
                  <span>Hồ sơ của bạn</span>
                </button>

                {/* Mobile Mục: Đăng xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#FCA5A5] bg-[#FEF2F2] text-[15px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
