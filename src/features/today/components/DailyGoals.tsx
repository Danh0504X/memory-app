import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { DailyGoal } from '../utils/today';

const RING = 2 * Math.PI * 22;

// Ba mục tiêu nhỏ của hôm nay, vòng tròn đầy dần khi làm xong
export const DailyGoals = ({ goals }: { goals: DailyGoal[] }) => {
    const done = goals.filter((goal) => goal.done).length;
    const allDone = done === goals.length;

    return (
        <>
            <div className="goals__head">
                <div className="goals__ring" aria-hidden="true">
                    <svg viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r="22" />
                        <circle cx="26" cy="26" r="22" strokeDasharray={RING} strokeDashoffset={RING * (1 - done / goals.length)} />
                    </svg>
                    <span>
                        {done}/{goals.length}
                    </span>
                </div>
                <p>{allDone ? 'Xong cả 3 mục tiêu hôm nay. Tuyệt vời!' : `Đã xong ${done} trên ${goals.length} mục tiêu.`}</p>
            </div>

            <ul className="goals">
                {goals.map((goal) => (
                    <li key={goal.id} className="goals__item" data-done={goal.done}>
                        <span className="goals__mark" aria-hidden="true">
                            {goal.done && <Check size={16} strokeWidth={3} />}
                        </span>
                        <span className="goals__label">
                            {goal.label}
                            <span className="sr-only">{goal.done ? ', đã xong' : ', chưa xong'}</span>
                        </span>
                        {!goal.done && (
                            <Link to={goal.to} viewTransition className="goals__go">
                                {goal.action}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </>
    );
};
