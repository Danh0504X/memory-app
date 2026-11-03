import type { ResultGrade } from '../types';

const GRADE_LABEL: Record<ResultGrade, string> = {
    perfect: 'Hoàn hảo',
    pass: 'Đạt',
    fail: 'Chưa đạt',
};

// Nhãn kết quả: nền nhạt + chữ đậm cùng sắc độ, chữ luôn đọc được kể cả không phân biệt màu
export const GradePill = ({ grade }: { grade: ResultGrade }) => (
    <span className={`grade grade--${grade}`}>{GRADE_LABEL[grade]}</span>
);
