// Phát sau khi nộp xong một ván để các trang đang mở (hồ sơ, xem trước hồ sơ) tải lại EXP và chuỗi ngày chơi
export const GAME_SESSION_RECORDED_EVENT = 'memio:game-session-recorded';

export const notifyGameSessionRecorded = () => {
    window.dispatchEvent(new Event(GAME_SESSION_RECORDED_EVENT));
};
