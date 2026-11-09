// Hệ thống thiết kế Memio cho app: phong cách "vui, nhiều màu" (kiểu app học cho trẻ), giữ xanh thương hiệu
// và font Be Vietnam Pro của bản web. Nút và thẻ "dày": có gờ dưới đậm hơn, lún xuống khi bấm.
export const colors = {
    brand: '#2e7d32',
    brandDeep: '#1f5c23',
    ink: '#1f2937',
    inkSoft: '#4b5768',
    wall: '#f4f8f5',
    step: '#e3ebe6',
    line: '#dfe8e2',        // viền thẻ, nút phụ
    edge: '#cfdcd3',        // gờ dưới của thẻ trắng, nút phụ
    mint: '#cdebd6',
    sun: '#f4c95d',
    sunDeep: '#d9a521',
    sky: '#cfe7f3',
    danger: '#c92a2a',
    dangerTint: '#ffe8e8',
    white: '#ffffff',
} as const;

export const fonts = {
    regular: 'BeVietnamPro_400Regular',
    medium: 'BeVietnamPro_500Medium',
    semibold: 'BeVietnamPro_600SemiBold',
    bold: 'BeVietnamPro_700Bold',
    extrabold: 'BeVietnamPro_800ExtraBold',
} as const;

// Bo góc lớn, mềm: hợp với trẻ em; thẻ lớn dùng radius * 1.5
export const radius = 16;

// Độ dày gờ dưới của nút và thẻ "dày"
export const EDGE = 4;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;
