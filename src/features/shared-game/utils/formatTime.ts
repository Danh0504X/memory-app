// 30 → "30 giây", 120 → "2 phút", 90 → "1 phút 30 giây"
export const formatSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    if (minutes === 0) return `${rest} giây`;
    return rest === 0 ? `${minutes} phút` : `${minutes} phút ${rest} giây`;
};
