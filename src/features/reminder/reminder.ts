import {
    AndroidImportance,
    SchedulableTriggerInputTypes,
    cancelAllScheduledNotificationsAsync,
    requestPermissionsAsync,
    scheduleNotificationAsync,
    setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';
import { appStorage } from '@/lib/storage';

// Nhắc giữ chuỗi ngày bằng thông báo cục bộ: hẹn giờ ngay trên máy, không cần server push.
// shortcut: nhắc cả khi hôm nay đã chơi (thông báo hẹn sẵn không biết đã chơi chưa); muốn bỏ thì cần push từ backend.

const KEY = 'memio.reminderHour';
const CHANNEL = 'reminder';
export const REMINDER_HOURS = [7, 12, 19, 21];

// Giờ nhắc đã lưu, null là đang tắt
export const getReminderHour = (): number | null => {
    const value = Number(appStorage.getItem(KEY));
    return REMINDER_HOURS.includes(value) ? value : null;
};

// Bật (hour) hoặc tắt (null). Trả false khi người dùng không cho phép thông báo.
export const setReminder = async (hour: number | null): Promise<boolean> => {
    await cancelAllScheduledNotificationsAsync();
    if (hour === null) {
        appStorage.removeItem(KEY);
        return true;
    }
    const permission = await requestPermissionsAsync();
    if (!permission.granted) {
        appStorage.removeItem(KEY);
        return false;
    }
    if (Platform.OS === 'android') {
        await setNotificationChannelAsync(CHANNEL, { name: 'Nhắc luyện tập', importance: AndroidImportance.DEFAULT });
    }
    await scheduleNotificationAsync({
        content: { title: 'Giữ chuỗi ngày nhé 🔥', body: 'Chơi một ván ngắn để không mất chuỗi luyện tập hôm nay.' },
        trigger: { type: SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: CHANNEL },
    });
    appStorage.setItem(KEY, String(hour));
    return true;
};
