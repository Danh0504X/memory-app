import { useLayoutEffect } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";

// Router không tự cuộn khi chuyển trang: trang mới hiện ở đúng vị trí cuộn của trang cũ.
// Không dùng <ScrollRestoration /> vì nó cuộn theo scroll-behavior: smooth của trang (trượt từ cuối lên đầu).
const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();

  // useLayoutEffect: cuộn trước khi trình duyệt vẽ trang mới (kể cả trong view transition), nên không thấy giật
  useLayoutEffect(() => {
    if (navigationType === "POP") return; // Back/Forward: trình duyệt tự đưa về chỗ cũ
    if (hash) return; // Có #… thì useHashScroll đưa tới đúng phần
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, key, navigationType]);

  return null;
};

// Khung chung bọc mọi trang
export const RootLayout = () => (
  <>
    <ScrollToTop />
    <Outlet />
  </>
);
