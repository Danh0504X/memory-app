import { useAuthStore } from "@/features/auth/store/authStore";
import HomePage from "@/features/home/pages/HomePage";
import TodayPage from "@/features/today/pages/TodayPage";

// "/" có hai trang: khách thấy trang giới thiệu, người đã đăng nhập thấy việc hôm nay.
// Trong lúc chưa biết là ai thì để trống, tránh trang giới thiệu loé lên rồi mới đổi.
export const HomeRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <div className="min-h-svh" aria-busy="true" />;
  return isAuthenticated ? <TodayPage /> : <HomePage />;
};
