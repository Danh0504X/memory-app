import { formatPercent, formatTotalDuration } from '../utils/format';
import type { DashboardSummary } from '../types';

type Tone = 'good' | 'bad' | 'neutral';
type Delta = { text: string; tone: Tone };

// Đếm (ván, ván hoàn hảo): tăng là tốt; giảm chỉ ghi nhận, không tô đỏ vì chơi ít hơn không phải là lỗi
const countDelta = (current: number, previous: number, unit: string, compare: string): Delta => {
    if (previous === 0 && current === 0) return { text: '—', tone: 'neutral' };
    if (previous === 0) return { text: `+${current} ${unit} (mới)`, tone: 'neutral' };
    const change = current - previous;
    if (change === 0) return { text: `Không đổi ${compare}`, tone: 'neutral' };
    return { text: `${change > 0 ? '+' : '−'}${Math.abs(change)} ${unit} ${compare}`, tone: change > 0 ? 'good' : 'neutral' };
};

// Độ chính xác: so bằng điểm phần trăm của hai giá trị đang hiện (82% và 76% là +6 điểm); giảm là xấu
const accuracyDelta = (current: number | null, previous: number | null, compare: string): Delta => {
    if (current === null || previous === null) return { text: '—', tone: 'neutral' };
    const change = Math.round(current * 100) - Math.round(previous * 100);
    if (change === 0) return { text: `Không đổi ${compare}`, tone: 'neutral' };
    return { text: `${change > 0 ? '+' : '−'}${Math.abs(change)} điểm ${compare}`, tone: change > 0 ? 'good' : 'bad' };
};

interface PeriodStatsProps {
    summary: DashboardSummary;
    previousSummary: DashboardSummary;
    compareLabel: string;
}

export const PeriodStats = ({ summary, previousSummary, compareLabel }: PeriodStatsProps) => {
    // Thời gian so theo số phút đang hiện, không theo số giây gốc
    const minutes = Math.round(summary.durationSec / 60);
    const previousMinutes = Math.round(previousSummary.durationSec / 60);

    const cells: { label: string; value: string; delta: Delta }[] = [
        {
            label: 'Ván đã chơi',
            value: String(summary.played),
            delta: countDelta(summary.played, previousSummary.played, 'ván', compareLabel),
        },
        {
            label: 'Độ chính xác',
            value: formatPercent(summary.accuracy),
            delta: accuracyDelta(summary.accuracy, previousSummary.accuracy, compareLabel),
        },
        {
            label: 'Thời gian luyện',
            value: formatTotalDuration(summary.durationSec),
            delta: countDelta(minutes, previousMinutes, 'phút', compareLabel),
        },
        {
            label: 'Ván hoàn hảo',
            value: String(summary.perfectCount),
            delta: countDelta(summary.perfectCount, previousSummary.perfectCount, 'ván', compareLabel),
        },
    ];

    return (
        <dl className="stats">
            {cells.map((cell) => (
                <div key={cell.label} className="stats__cell">
                    <dt>{cell.label}</dt>
                    <dd className="stats__value">{cell.value}</dd>
                    <dd className={`stats__delta stats__delta--${cell.delta.tone}`}>{cell.delta.text}</dd>
                </div>
            ))}
        </dl>
    );
};
