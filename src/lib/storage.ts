import Storage from 'expo-sqlite/kv-store';

// Thay localStorage/sessionStorage của bản web: lưu bền trên máy và đọc/ghi đồng bộ,
// nên các store cũ (zustand persist, tiến độ game số) giữ nguyên logic.
// Token đăng nhập KHÔNG để ở đây mà ở SecureStore (src/lib/session.ts).
export interface SyncStorage {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
}

export const appStorage: SyncStorage = {
    getItem: (key) => Storage.getItemSync(key),
    setItem: (key, value) => Storage.setItemSync(key, value),
    removeItem: (key) => {
        Storage.removeItemSync(key);
    },
};
