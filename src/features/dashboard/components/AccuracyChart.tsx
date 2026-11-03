import type { CSSProperties } from 'react';
import { GAME_META } from '../constants';
import { formatPercent } from '../utils/format';
import type { GameId, PeriodBucket } from '../types';

const TICKS = [100, 75, 50, 25, 0];

interface AccuracyChartProps {
    buckets: PeriodBucket[];
    game: GameId;
    passAccuracy: number; // ngưỡng "đạt" của trò, lấy từ luật chơi ở backend
}

// Một trò, một chuỗi: cột độ chính xác từng kỳ; kỳ hiện tại mang màu thương hiệu, các kỳ trước màu xám.
// Kỳ không chơi để trống (dấu –) thay vì vẽ cột 0%, vì 0% nghĩa là có chơi nhưng nhớ sai hết.
export const AccuracyChart = ({ buckets, game, passAccuracy }: AccuracyChartProps) => {
    const meta = GAME_META[game];
    const current = buckets.length - 1;
    const played = buckets.filter((bucket) => bucket.byGame[game].played > 0);
    const summary = played.length
        ? `Độ chính xác trò ${meta.label} theo kỳ, ${played.length} trên ${buckets.length} kỳ có chơi`
        : `Chưa có ván ${meta.label} nào trong ${buckets.length} kỳ gần nhất`;

    return (
        <div className="chart">
            <div className="chart__plot" role="img" aria-label={summary}>
                <div className="chart__grid" aria-hidden="true">
                    {TICKS.map((tick) => (
                        <span key={tick} style={{ bottom: `${tick}%` }}>
                            <em>{tick}%</em>
                        </span>
                    ))}
                </div>
                <div className="chart__ref" style={{ '--ref': passAccuracy } as CSSProperties} aria-hidden="true">
                    <span>Đạt {Math.round(passAccuracy * 100)}%</span>
                </div>
                <ol className="chart__cols" aria-hidden="true">
                    {buckets.map((bucket, index) => {
                        const stats = bucket.byGame[game];
                        const accuracy = stats.played > 0 ? stats.accuracy : null;
                        return (
                            <li key={bucket.key} data-current={index === current}>
                                <div className="chart__track">
                                    {accuracy !== null ? (
                                        <span className="chart__bar" style={{ '--h': `${accuracy * 100}%` } as CSSProperties}>
                                            <em>{formatPercent(accuracy)}</em>
                                        </span>
                                    ) : (
                                        <span className="chart__none">–</span>
                                    )}
                                </div>
                                <span className="chart__label">{bucket.label}</span>
                                <span className="chart__count">{stats.played} ván</span>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <table className="sr-only">
                <caption>{summary}</caption>
                <thead>
                    <tr>
                        <th scope="col">Kỳ</th>
                        <th scope="col">Số ván</th>
                        <th scope="col">Độ chính xác</th>
                    </tr>
                </thead>
                <tbody>
                    {buckets.map((bucket) => (
                        <tr key={bucket.key}>
                            <th scope="row">{bucket.fullLabel}</th>
                            <td>{bucket.byGame[game].played}</td>
                            <td>{bucket.byGame[game].played > 0 ? formatPercent(bucket.byGame[game].accuracy) : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
