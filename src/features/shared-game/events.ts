// Phát sau khi nộp xong một ván để các màn đang mở (hồ sơ, Today) tải lại EXP và chuỗi ngày chơi.
// Bản web dùng window.dispatchEvent; React Native không có window event nên dùng danh sách listener.
const listeners = new Set<() => void>();

export const onGameSessionRecorded = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const notifyGameSessionRecorded = () => {
    listeners.forEach((listener) => listener());
};
