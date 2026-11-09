// Các lần nhắc giữ chuỗi ngày sắp tới, theo giờ của máy: mỗi ngày một lần lúc `hour`:00.
// Hôm nay đã chơi, hoặc đã quá giờ nhắc, thì bắt đầu từ ngày mai. Chỉ hẹn `days` ngày:
// người dùng mở app hay chơi một ván là được hẹn lại, bỏ app lâu thì thôi nhắc.
export const reminderDates = (hour: number, playedToday: boolean, now = new Date(), days = 14): Date[] => {
    const first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0);
    if (playedToday || first.getTime() <= now.getTime()) first.setDate(first.getDate() + 1);
    return Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i, hour, 0, 0, 0));
};
