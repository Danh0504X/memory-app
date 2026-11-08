// "learner@example.com" -> "l***r@example.com"; cùng quy tắc với backend (utils/password.ts)
export const maskEmail = (email: string): string => {
    const at = email.lastIndexOf('@');
    if (at < 1) return '***';
    const local = email.slice(0, at);
    const domain = email.slice(at);
    return local.length <= 2 ? `${local[0]}***${domain}` : `${local[0]}***${local[local.length - 1]}${domain}`;
};

