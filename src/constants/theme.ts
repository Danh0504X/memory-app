// Hệ thống thiết kế Memio, lấy từ bản web (src/index.css): cùng màu, cùng font Be Vietnam Pro
export const colors = {
    brand: '#2e7d32',
    brandDeep: '#1f5c23',
    ink: '#1f2937',
    inkSoft: '#3d4a5c',
    wall: '#f8fbf8',
    step: '#e6efe8',
    mint: '#cdebd6',
    sun: '#f4c95d',
    sky: '#cfe7f3',
    danger: '#b3261e',
    white: '#ffffff',
} as const;

export const fonts = {
    regular: 'BeVietnamPro_400Regular',
    medium: 'BeVietnamPro_500Medium',
    semibold: 'BeVietnamPro_600SemiBold',
    bold: 'BeVietnamPro_700Bold',
    extrabold: 'BeVietnamPro_800ExtraBold',
} as const;

export const radius = 12;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;
