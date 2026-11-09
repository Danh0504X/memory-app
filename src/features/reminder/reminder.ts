import {
    AndroidImportance,
    SchedulableTriggerInputTypes,
    cancelAllScheduledNotificationsAsync,
    getPermissionsAsync,
    requestPermissionsAsync,
    scheduleNotificationAsync,
    setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';
import { appStorage } from '@/lib/storage';
import { reminderDates } from './reminderDates';

// Nhắc giữ chuỗi ngày bằng thông báo cục bộ: hẹn sẵn từng ngày trên máy, không cần server push.
// Hôm đã chơi thì không nhắc: mỗi lần mở màn Hôm nay / chơi xong một ván, refreshReminder hẹn lại từ ngày mai.

const KEY = 'memio.reminderHour';
const CHANNEL = 'reminder';
export const REMINDER_HOURS = [7, 12, 19, 21];

// Giờ nhắc đã lưu, null là đang tắt
export const getReminderHour = (): number | null => {
    const value = Number(appStorage.getItem(KEY));
    return REMINDER_HOURS.includes(value) ? value : null;
};

const schedule = async (hour: number, playedToday: boolean) => {
    await cancelAllScheduledNotificationsAsync();
    if (Platform.OS === 'android') {
        await setNotificationChannelAsync(CHANNEL, { name: 'Nhắc luyện tập', importance: AndroidImportance.DEFAULT });
    }
    for (const date of reminderDates(hour, playedToday)) {
        await scheduleNotificationAsync({
            content: { title: 'Giữ chuỗi ngày nhé 🔥', body: 'Hôm nay bạn chưa luyện tập. Chơi một ván ngắn để không mất chuỗi.' },
            trigger: { type: SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
        });
    }
};

// Bật (hour) hoặc tắt (null). Trả false khi người dùng không cho phép thông báo.
export const setReminder = async (hour: number | null, playedToday = false): Promise<boolean> => {
    if (hour === null) {
        await cancelAllScheduledNotificationsAsync();
        appStorage.removeItem(KEY);
        return true;
    }
    const permission = await requestPermissionsAsync();
    if (!permission.granted) {
        await cancelAllScheduledNotificationsAsync();
        appStorage.removeItem(KEY);
        return false;
    }
    await schedule(hour, playedToday);
    appStorage.setItem(KEY, String(hour));
    return true;
};

// Hẹn lại theo tình hình hôm nay; không hỏi quyền (chỉ chạy khi người dùng đã bật nhắc)
export const refreshReminder = async (playedToday: boolean): Promise<void> => {
    const hour = getReminderHour();
    if (hour === null) return;
    if (!(await getPermissionsAsync()).granted) return;
    await schedule(hour, playedToday);
};
