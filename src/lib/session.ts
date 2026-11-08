import * as SecureStore from 'expo-secure-store';

// Token đăng nhập và guestId của app. Bản web để trình duyệt giữ trong cookie httpOnly;
// app mobile nhận chúng trong body (header X-Client: mobile) và tự giữ ở SecureStore (Keychain/Keystore).
const ACCESS_TOKEN = 'memio.accessToken';
const REFRESH_TOKEN = 'memio.refreshToken';
const GUEST_ID = 'memio.guestId';

// Đọc đồng bộ một lần rồi giữ trong bộ nhớ: interceptor của axios cần token ngay, không chờ được.
const values = new Map<string, string | null>();
// Ghi xuống SecureStore theo đúng thứ tự gọi, để "lưu rồi xoá" không bị đảo thành "xoá rồi lưu"
let writes: Promise<unknown> = Promise.resolve();

const read = (key: string): string | null => {
    if (!values.has(key)) {
        let stored: string | null = null;
        try {
            stored = SecureStore.getItem(key);
        } catch {
            // Keychain chưa sẵn sàng (vd. máy vừa khởi động, chưa mở khoá): coi như chưa có
        }
        values.set(key, stored);
    }
    return values.get(key) ?? null;
};

const write = (key: string, value: string | null): void => {
    values.set(key, value);
    writes = writes
        .then(() => (value ? SecureStore.setItemAsync(key, value) : SecureStore.deleteItemAsync(key)))
        .catch(() => undefined);
};

export const sessionStore = {
    getAccessToken: () => read(ACCESS_TOKEN),
    getRefreshToken: () => read(REFRESH_TOKEN),
    setTokens: (tokens: { accessToken: string; refreshToken: string }) => {
        write(ACCESS_TOKEN, tokens.accessToken);
        write(REFRESH_TOKEN, tokens.refreshToken);
    },
    clearTokens: () => {
        write(ACCESS_TOKEN, null);
        write(REFRESH_TOKEN, null);
    },
    // Khách chơi không đăng nhập: backend cấp ở ván đầu, app gửi lại qua header X-Guest-Id
    getGuestId: () => read(GUEST_ID),
    setGuestId: (guestId: string) => write(GUEST_ID, guestId),
};
