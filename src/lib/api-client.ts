import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { sessionStore } from "@/lib/session";
import type {
  ApiErrorResponse,
  AuthSuccessResponse,
  User,
} from "@/types/auth.types";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    // Đánh dấu request đã được thử lại sau khi refresh, tránh lặp vô hạn
    _retry?: boolean;
  }
}

// baseURL lấy từ EXPO_PUBLIC_API_BASE_URL (file .env). Máy ảo Android gọi máy tính qua 10.0.2.2,
// điện thoại thật cần IP LAN của máy chạy backend: "localhost" trên điện thoại là chính điện thoại.
// X-Client: mobile báo backend trả token/guestId trong body thay vì set cookie (xem memory-be/docs/mobile-client.md).
export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5001/api",
  // Không có timeout thì server treo sẽ làm hydrate() chờ mãi và kẹt ở màn "Đang tải..."
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Client": "mobile",
  },
});

// Gắn access token (đã đăng nhập) hoặc guestId (khách) vào mọi request
apiClient.interceptors.request.use((config) => {
  const accessToken = sessionStore.getAccessToken();
  const guestId = sessionStore.getGuestId();
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  if (guestId) config.headers.set("X-Guest-Id", guestId);
  return config;
});

// Login, Google và refresh trả cặp token mới; ván đầu tiên của khách trả guestId: lưu lại ngay
const rememberSession = (body: unknown): void => {
  const data = (body as { data?: Record<string, unknown> } | undefined)?.data;
  if (typeof data?.accessToken === "string" && typeof data.refreshToken === "string") {
    sessionStore.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  }
  if (typeof data?.guestId === "string") {
    sessionStore.setGuestId(data.guestId);
  }
};

// Store đăng ký các handler này để api-client không phải import store (tránh vòng import)
interface SessionHandlers {
  onRefreshed: (user: User) => void;
  onExpired: () => void;
}

let sessionHandlers: SessionHandlers | null = null;

export const setSessionHandlers = (handlers: SessionHandlers): void => {
  sessionHandlers = handlers;
};

// Backend xoay vòng refresh token mỗi lần gọi /auth/refresh, nên nhiều request 401 cùng lúc
// phải dùng chung một lần refresh; nếu không, các lần sau sẽ dùng token cũ đã bị thu hồi.
let refreshPromise: Promise<User> | null = null;

export const refreshSession = (): Promise<User> => {
  const refreshToken = sessionStore.getRefreshToken();
  if (!refreshToken) {
    const noSession: ApiErrorResponse = { code: "NO_SESSION", message: "Chưa đăng nhập", status: 401 };
    return Promise.reject(noSession);
  }
  if (!refreshPromise) {
    refreshPromise = (
      apiClient.post("/auth/refresh", { refreshToken }) as unknown as Promise<AuthSuccessResponse>
    )
      .then((response) => response.data.userInfo)
      .catch((error: ApiErrorResponse) => {
        // Phiên hết hạn, bị thu hồi hoặc tài khoản bị khoá: bỏ token để lần sau không thử lại vô ích.
        // Lỗi mạng (status 0) thì giữ token, mở app khi có mạng vẫn khôi phục được phiên.
        if (error.status === 401 || error.status === 403) sessionStore.clearTokens();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const normalizeError = (error: AxiosError<ApiErrorResponse>): ApiErrorResponse => {
  if (error.response) {
    const data = error.response.data;
    return {
      code: data?.code || "UNKNOWN_ERROR",
      message: data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
      status: error.response.status,
      errors: data?.errors,
    };
  }

  return {
    code: "ERR_NETWORK",
    message:
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.",
    status: 0,
  };
};

// Các endpoint auth tự xử lý 401 (sai mật khẩu, refresh hết hạn...), không được kích hoạt refresh
const isAuthEndpoint = (url?: string): boolean =>
  !!url && url.replace(/^\/+/, "").startsWith("auth/");

// Response Interceptor: trả về body, tự refresh khi access token hết hạn và chuẩn hóa lỗi
apiClient.interceptors.response.use(
  (response) => {
    rememberSession(response.data);
    return response.data;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    // Access token hết hạn: refresh một lần rồi gọi lại request (interceptor request gắn token mới)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        const user = await refreshSession();
        sessionHandlers?.onRefreshed(user);
      } catch {
        sessionHandlers?.onExpired();
        return Promise.reject(normalizeError(error));
      }
      return apiClient(originalRequest);
    }

    return Promise.reject(normalizeError(error));
  },
);
