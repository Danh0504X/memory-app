import type { UserProfile } from '@/features/profile/api/profile.api';
import { STRIP_DAYS } from '../hooks/useOverview';
import { dayKey, formatWeekday, lastDays } from '../utils/format';
import type { GameSession } from '../types';

interface StreakPanelProps {
    profile: UserProfile;
    sessions: GameSession[] | null; // null khi lịch sử chưa tải được: vẫn hiện số chuỗi, ẩn dải ngày
    timeZone: string;
}

// Chuỗi ngày hiện tại (do backend tính) và dải 14 ngày gần nhất dựng từ lịch sử ván
export const StreakPanel = ({ profile, sessions, timeZone }: StreakPanelProps) => {
    const counts = new Map<string, number>();
    for (const session of sessions ?? []) {
        const key = dayKey(session.playedAt, timeZone);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const days = lastDays(STRIP_DAYS, timeZone);

    return (
        <>
            <p className="figure-lead">
                {profile.streaks}
                <span className="figure-unit"> ngày</span>
            </p>
            <p className="dash-muted">Dài nhất {profile.longestStreak} ngày</p>
            {sessions && (
                <>
                    <ol className="strip" aria-label={`${STRIP_DAYS} ngày gần nhất`}>
                        {days.map(({ key, date }, index) => {
                            const played = counts.get(key) ?? 0;
                            const label = `${formatWeekday(date, timeZone)}: ${played ? `${played} ván` : 'không chơi'}`;
                            return (
                                <li
                                    key={key}
                                    className="strip__day"
                                    data-played={played > 0}
                                    data-today={index === days.length - 1}
                                    title={label}
                                >
                                    <span className="sr-only">{label}</span>
                                </li>
                            );
                        })}
                    </ol>
                    <p className="strip__axis" aria-hidden="true">
                        <span>2 tuần trước</span>
                        <span>Hôm nay</span>
                    </p>
                </>
            )}
        </>
    );
};

export const AccountLevel = ({ profile }: { profile: UserProfile }) => {
    const { level, expIntoLevel, expForNextLevel } = profile.level;
    const ratio = expForNextLevel > 0 ? Math.min(expIntoLevel / expForNextLevel, 1) : 0;

    return (
        <>
            <p className="figure-mid">Cấp {level}</p>
            <div
                className="meter"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={expForNextLevel}
                aria-valuenow={expIntoLevel}
                aria-label={`EXP trong cấp ${level}`}
            >
                <span style={{ width: `${ratio * 100}%` }} />
            </div>
            <p className="dash-muted">
                {expIntoLevel}/{expForNextLevel} EXP · còn {Math.max(expForNextLevel - expIntoLevel, 0)} EXP để lên cấp {level + 1}
            </p>
        </>
    );
};
