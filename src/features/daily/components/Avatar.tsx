import type { CSSProperties } from 'react';

// Màu nền nhạt cố định theo tên: cùng một người luôn cùng một màu
const hueOf = (name: string) => {
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return hash % 360;
};

export const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => (
    <span
        className="avatar"
        aria-hidden="true"
        style={{ '--hue': hueOf(name), width: size, height: size, fontSize: size * 0.42 } as CSSProperties}
    >
        {name.charAt(0).toUpperCase()}
    </span>
);
