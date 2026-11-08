import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ChevronDown, Loader2, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { UserProfile } from "@/features/profile/api/profile.api";
import { PROFILE_KEY, loadProfileQuery, prefetchProfilePage } from "@/features/dashboard/hooks/useOverview";
import { prefetchDashboard } from "@/features/dashboard/hooks/useDashboardData";
import { fetchQuery, peekQuery } from "@/lib/queryCache";

// Câu ngắn về chuỗi ngày, theo đúng các cờ backend trả về
const streakLine = (profile: UserProfile) => {
  if (profile.playedToday) return `Chuỗi ${profile.streaks} ngày · hôm nay đã chơi`;
  if (profile.streakExpired) return "Chuỗi vừa bị gián đoạn · chơi để bắt đầu lại";
  if (profile.streaks > 0) return `Chuỗi ${profile.streaks} ngày · hôm nay chưa chơi`;
  return "Chưa có chuỗi ngày · chơi 1 ván để bắt đầu";
};

// Menu tài khoản trên header (máy tính): tên, email, cấp và chuỗi ngày hiện tại, rồi các lối đi
export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(() => peekQuery<UserProfile>(PROFILE_KEY) ?? null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    setLogoutError(null);
    if (returnFocus) trigger.current?.focus();
  };

  const focusItem = (index: number) => {
    const list = items.current.filter((item): item is HTMLElement => item !== null);
    list[(index + list.length) % list.length]?.focus();
  };

  // Mỗi lần mở thì lấy hồ sơ qua bộ nhớ đệm chung: có sẵn thì hiện ngay, cũ thì làm mới (sau mỗi ván EXP và chuỗi đổi)
  useEffect(() => {
    if (!open) return;
    let isCurrent = true;
    fetchQuery(PROFILE_KEY, loadProfileQuery)
      .then((data) => isCurrent && setProfile(data))
      .catch(() => undefined); // Không tải được thì menu vẫn dùng được, chỉ thiếu dòng cấp/chuỗi
    return () => {
      isCurrent = false;
    };
  }, [open]);

  // Bấm ra ngoài thì đóng; Esc thì đóng và trả con trỏ về nút
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openAt = (index: number) => {
    setOpen(true);
    requestAnimationFrame(() => focusItem(index));
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAt(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openAt(-1);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items.current.filter(Boolean);
    const index = list.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: -1 };
    if (event.key in moves) {
      event.preventDefault();
      focusItem(moves[event.key]);
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  const onLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      setOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError((error as { message?: string }).message || "Đăng xuất thất bại. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const name = user?.username || "Bạn";
  const initial = name.charAt(0).toUpperCase();
  const ratio = profile && profile.level.expForNextLevel > 0
    ? Math.min(profile.level.expIntoLevel / profile.level.expForNextLevel, 1)
    : 0;

  return (
    <div className="user-menu" ref={root} data-open={open}>
      <button
        ref={trigger}
        type="button"
        id="user-menu-button"
        className="user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu-panel"
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="user-menu__avatar" aria-hidden="true">{initial}</span>
        <span className="user-menu__name">{name}</span>
        <ChevronDown size={16} aria-hidden="true" className="user-menu__chevron" />
      </button>

      <div
        id="user-menu-panel"
        role="menu"
        aria-labelledby="user-menu-button"
        className="user-menu__panel"
        inert={!open}
        onKeyDown={onMenuKeyDown}
      >
        <div className="user-menu__who">
          <span className="user-menu__avatar user-menu__avatar--large" aria-hidden="true">{initial}</span>
          <span className="user-menu__id">
            <strong>{name}</strong>
            {user?.email && <span>{user.email}</span>}
          </span>
        </div>

        {/* Giữ chỗ cố định để menu không nhảy khi số liệu tải xong */}
        <div className="user-menu__stats" aria-live="polite">
          {profile ? (
            <>
              <p className="user-menu__level">
                <span>Cấp {profile.level.level}</span>
                <span>{profile.level.expIntoLevel}/{profile.level.expForNextLevel} EXP</span>
              </p>
              <span className="user-menu__meter" aria-hidden="true">
                <span style={{ width: `${ratio * 100}%` }} />
              </span>
              <p className="user-menu__streak" data-done={profile.playedToday}>{streakLine(profile)}</p>
            </>
          ) : (
            <p className="user-menu__loading">Đang tải cấp và chuỗi ngày…</p>
          )}
        </div>

        <Link
          ref={(element) => { items.current[0] = element; }}
          to="/profile"
          viewTransition
          role="menuitem"
          className="user-menu__item"
          onPointerEnter={prefetchProfilePage}
          onFocus={prefetchProfilePage}
          onClick={() => close(false)}
        >
          <User size={16} aria-hidden="true" />
          Hồ sơ của bạn
        </Link>
        <Link
          ref={(element) => { items.current[1] = element; }}
          to="/dashboard"
          viewTransition
          role="menuitem"
          className="user-menu__item"
          onPointerEnter={prefetchDashboard}
          onFocus={prefetchDashboard}
          onClick={() => close(false)}
        >
          <BarChart3 size={16} aria-hidden="true" />
          Tiến độ luyện tập
        </Link>
        <button
          ref={(element) => { items.current[2] = element; }}
          type="button"
          role="menuitem"
          className="user-menu__item user-menu__item--danger"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
          {isLoggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
        </button>

        {logoutError && (
          <p role="alert" className="user-menu__error">{logoutError}</p>
        )}
      </div>
    </div>
  );
};
