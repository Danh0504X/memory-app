// Mẫu nhóm được lặp lại: "3" → 3,3,3; "2 2 2" → 2,2,2; "3 2" → 3,2,3,2.
export const isValidGroups = (value: string) => /^\s*[1-9](?:\s+[1-9])*\s*$/.test(value);
export const getDigitGroups = (digits: string[], pattern: string): { start: number; digits: string[] }[] => {
    const sizes = isValidGroups(pattern) ? pattern.trim().split(/\s+/).map(Number) : [3];
    const groups: { start: number; digits: string[] }[] = [];
    for (let start = 0, group = 0; start < digits.length; group++) {
        const size = sizes[group % sizes.length];
        groups.push({ start, digits: digits.slice(start, start + size) });
        start += size;
    }
    return groups;
};
