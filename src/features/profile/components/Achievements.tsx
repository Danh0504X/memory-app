import { isEarned, nextBadge, type Badge } from '../utils/badges';

// Bộ sưu tập huy hiệu: đã đạt có màu và chuyển động; chưa đạt xám kèm thanh tiến độ; huy hiệu gần đạt nhất được làm nổi
export const Achievements = ({ badges }: { badges: Badge[] }) => {
    const earned = badges.filter(isEarned).length;
    const next = nextBadge(badges);

    return (
        <>
            <p className="badges__count">
                <strong>
                    {earned}/{badges.length}
                </strong>{' '}
                huy hiệu
                {next && (
                    <>
                        {' '}
                        · Sắp đạt: <strong>{next.title}</strong> ({next.unit(Math.min(next.current, next.target))})
                    </>
                )}
            </p>
            <ul className="badges">
                {badges.map((badge) => {
                    const done = isEarned(badge);
                    const share = Math.min(badge.current / badge.target, 1);
                    return (
                        <li key={badge.id} className="badge" data-earned={done} data-next={badge.id === next?.id}>
                            <span className="badge__art">
                                <img src={badge.shape} alt="" className="shape" data-motion={badge.motion} />
                                <span className="badge__number" aria-hidden="true">
                                    {badge.number}
                                </span>
                            </span>
                            <span className="badge__title">{badge.title}</span>
                            {done ? (
                                <span className="badge__progress">Đã đạt</span>
                            ) : (
                                <>
                                    <span className="badge__meter" aria-hidden="true">
                                        <span style={{ width: `${share * 100}%` }} />
                                    </span>
                                    <span className="badge__progress">{badge.unit(Math.min(badge.current, badge.target))}</span>
                                </>
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
    );
};
