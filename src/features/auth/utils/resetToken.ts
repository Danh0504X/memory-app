// Token nằm ở fragment ("#token=..."): trình duyệt không gửi fragment lên server và không đưa nó vào Referer
export const parseResetTokenFromHash = (hash: string): string | null => {
    const token = new URLSearchParams(hash.replace(/^#/, '')).get('token');
    return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
};

