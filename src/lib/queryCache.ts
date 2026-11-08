// Bộ nhớ đệm nhỏ cho các truy vấn của trang ứng dụng (tiến độ, hồ sơ, menu tài khoản):
// - hai nơi cùng hỏi một khoá trong lúc đang tải thì dùng chung một request;
// - dữ liệu đã có thì hiện ngay khi quay lại trang, rồi làm mới ở nền;
// - vừa tải trong FRESH_MS (vd. đã tải trước lúc rê chuột lên link) thì không gọi lại.
// Xoá hết khi đăng xuất và sau mỗi ván chơi (GAME_SESSION_RECORDED_EVENT).

import { GAME_SESSION_RECORDED_EVENT } from '@/features/shared-game/events';

type Entry = { data?: unknown; updatedAt: number; promise?: Promise<unknown> };

const FRESH_MS = 10_000;
const entries = new Map<string, Entry>();

export const peekQuery = <T>(key: string): T | undefined => entries.get(key)?.data as T | undefined;

export const fetchQuery = <T>(key: string, loader: () => Promise<T>, { force = false } = {}): Promise<T> => {
    const entry = entries.get(key);
    if (entry?.promise) return entry.promise as Promise<T>;
    if (!force && entry && entry.data !== undefined && Date.now() - entry.updatedAt < FRESH_MS) {
        return Promise.resolve(entry.data as T);
    }

    const promise = loader().then(
        (data) => {
            entries.set(key, { data, updatedAt: Date.now() });
            return data;
        },
        (error) => {
            // Lỗi thì giữ lại dữ liệu cũ (nếu có) để trang vẫn hiện được
            const previous = entries.get(key);
            if (previous) entries.set(key, { data: previous.data, updatedAt: previous.updatedAt });
            else entries.delete(key);
            throw error;
        },
    );
    entries.set(key, { ...entry, updatedAt: entry?.updatedAt ?? 0, promise });
    return promise;
};

// Tải trước khi người dùng sắp vào trang; lỗi bỏ qua, trang sẽ tự tải lại và báo lỗi khi mở
export const prefetchQuery = (key: string, loader: () => Promise<unknown>) => {
    void fetchQuery(key, loader).catch(() => undefined);
};

// Ghi đè bằng dữ liệu vừa nhận từ một thao tác (vd. đổi tên), để nơi khác đọc ra đúng ngay
export const setQuery = <T>(key: string, data: T) => {
    entries.set(key, { data, updatedAt: Date.now() });
};

export const clearQueries = () => entries.clear();

// Sau mỗi ván, EXP, chuỗi ngày, cấp đã mở và lịch sử đều đổi: bỏ hết để lần sau tải mới
if (typeof window !== 'undefined') {
    window.addEventListener(GAME_SESSION_RECORDED_EVENT, clearQueries);
}
