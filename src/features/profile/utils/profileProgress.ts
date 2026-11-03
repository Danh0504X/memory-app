import type { UserLevel } from '../api/profile.api';

export const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

// Tiến độ trong cấp hiện tại; cấp và số EXP do backend tính từ tổng EXP
export const getLevelProgress = ({ level, expIntoLevel, expForNextLevel }: UserLevel) => ({
    nextLevel: level + 1,
    remaining: Math.max(expForNextLevel - expIntoLevel, 0),
    percentage: expForNextLevel > 0 ? Math.min((expIntoLevel / expForNextLevel) * 100, 100) : 0,
});
