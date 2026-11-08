import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { UserProfile } from '@/features/profile/api/profile.api';
import { GAME_META } from '../constants';
import { useMonthSessions } from '../hooks/useMonthSessions';
import { intensity, monthGrid, summarizeDay, type MonthRef } from '../utils/calendar';
import { formatClock, formatPercent, formatWeekday } from '../utils/format';
import { BlockState } from './BlockState';
import { GradePill } from './GradePill';
import type { GameSession } from '../types';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface MonthViewProps {
    month: MonthRef;
    isCurrentMonth: boolean;
    todayKey: string;
    selected: string;
    onSelect: (key: string) => void;
    onMonth: (by: number) => void;
    profile: UserProfile | null;
    timeZone: string;
}

// Hai khối của một tháng: lịch luyện tập và các ván của ngày đang chọn. Trang đặt key theo tháng nên đổi tháng là tải mới.
export const MonthView = ({ month, isCurrentMonth, todayKey, selected, onSelect, onMonth, profile, timeZone }: MonthViewProps) => {
    const request = useMonthSessions(month);
    const sessions = request.state.status === 'ready' ? request.state.data : [];
    const cells = monthGrid(month, sessions, timeZone);
    const playedDays = cells.filter((cell) => cell && cell.sessions.length > 0).length;
    // Ngày đang chọn không thuộc tháng này (vừa đổi tháng): chọn ngày chơi gần nhất của tháng, không có thì ngày 1
    const days = cells.filter((cell) => cell !== null);
    const latestPlayed = [...days].reverse().find((cell) => cell.sessions.length > 0 && cell.key <= todayKey);
    const shown = days.some((cell) => cell.key === selected) ? selected : (latestPlayed?.key ?? days[0]?.key ?? selected);
    const selectedDay = days.find((cell) => cell.key === shown) ?? null;

    return (
        <>
            <section className="panel span-8 cal" aria-labelledby="cal-title">
                <div className="panel__head">
                    <h2 id="cal-title">Lịch luyện tập</h2>
                    <div className="cal__nav">
                        <button type="button" onClick={() => onMonth(-1)} aria-label="Tháng trước">
                            <ChevronLeft size={18} aria-hidden="true" />
                        </button>
                        <span className="cal__month">
                            Tháng {month.month}, {month.year}
                        </span>
                        <button type="button" onClick={() => onMonth(1)} disabled={isCurrentMonth} aria-label="Tháng sau">
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <BlockState request={request.state} onRetry={request.reload}>
                    {() => (
                        <>
                            <div className="cal__grid" role="group" aria-label={`Tháng ${month.month}: ${playedDays} ngày đã luyện`}>
                                {WEEKDAYS.map((weekday) => (
                                    <span key={weekday} className="cal__weekday" aria-hidden="true">
                                        {weekday}
                                    </span>
                                ))}
                                {cells.map((cell, index) => {
                                    if (!cell) return <span key={`blank-${index}`} aria-hidden="true" />;
                                    const count = cell.sessions.length;
                                    const future = cell.key > todayKey;
                                    // Nối hai ngày chơi liền nhau trong cùng một hàng tuần thành một dải
                                    const previous = cells[index - 1];
                                    const joined = index % 7 !== 0 && count > 0 && !!previous && previous.sessions.length > 0;
                                    return (
                                        <button
                                            key={cell.key}
                                            type="button"
                                            className="cal__day"
                                            data-level={intensity(count)}
                                            data-today={cell.key === todayKey}
                                            data-joined={joined}
                                            aria-pressed={cell.key === shown}
                                            aria-label={`Ngày ${cell.day}: ${count ? `${count} ván` : 'không chơi'}`}
                                            disabled={future}
                                            onClick={() => onSelect(cell.key)}
                                        >
                                            {cell.day}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="cal__foot">
                                <p>
                                    <strong>{playedDays} ngày</strong> đã luyện trong tháng {month.month}
                                    {profile && (
                                        <>
                                            {' '}
                                            · chuỗi hiện tại <strong>{profile.streaks} ngày</strong> · dài nhất {profile.longestStreak} ngày
                                        </>
                                    )}
                                </p>
                                <p className="cal__legend" aria-hidden="true">
                                    Ít
                                    {[0, 1, 2, 3].map((level) => (
                                        <span key={level} data-level={level} />
                                    ))}
                                    Nhiều
                                </p>
                            </div>
                        </>
                    )}
                </BlockState>
            </section>

            <section className="panel span-4 day" aria-labelledby="day-title">
                <div className="panel__head">
                    <h2 id="day-title">{dayTitle(shown, todayKey, timeZone)}</h2>
                </div>
                <BlockState request={request.state} onRetry={request.reload}>
                    {() => <DayDetail sessions={selectedDay?.sessions ?? []} isToday={shown === todayKey} timeZone={timeZone} />}
                </BlockState>
            </section>
        </>
    );
};

const dayTitle = (key: string, todayKey: string, timeZone: string) => {
    const label = formatWeekday(new Date(`${key}T12:00:00+07:00`), timeZone);
    const text = label.charAt(0).toUpperCase() + label.slice(1);
    return key === todayKey ? `Hôm nay · ${text}` : text;
};

// Các ván của một ngày, mới nhất trước
const DayDetail = ({ sessions, isToday, timeZone }: { sessions: GameSession[]; isToday: boolean; timeZone: string }) => {
    if (sessions.length === 0) {
        return (
            <div className="day__empty">
                <p>{isToday ? 'Hôm nay bạn chưa chơi ván nào.' : 'Không có ván nào trong ngày này.'}</p>
                {isToday && (
                    <Link to="/" viewTransition className="dash-link">
                        Xem việc hôm nay →
                    </Link>
                )}
            </div>
        );
    }

    const summary = summarizeDay(sessions);
    return (
        <>
            <p className="day__summary">
                <strong>{summary.played} ván</strong> · đúng {formatPercent(summary.accuracy)} · {summary.minutes} phút
            </p>
            <ul className="recent day__list">
                {sessions.map((session) => {
                    const meta = GAME_META[session.game];
                    const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone }).format(session.playedAt);
                    return (
                        <li key={session.id} className="recent__row">
                            <span className="recent__dot" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                            <span className="recent__main">
                                <span className="recent__title">
                                    {meta.label} · {session.daily ? 'Thử thách ngày' : session.level ? `Cấp ${session.level}` : 'Tự chọn'}
                                </span>
                                <span className="recent__sub">
                                    {session.correctItems}/{session.totalItems} {meta.unit} · {formatClock(session.durationSec)}
                                </span>
                            </span>
                            <span className="recent__side">
                                <GradePill grade={session.grade} />
                                <span className="recent__when">{time}</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </>
    );
};
