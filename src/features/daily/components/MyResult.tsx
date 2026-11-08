import { Link } from 'react-router-dom';
import { GAME_META } from '@/features/dashboard/constants';
import { formatClock } from '@/features/dashboard/utils/format';
import { METHODS } from '@/features/methods/methodsData';
import type { DailyChallengeView } from '../api/daily.api';

// Cột bên của bảng xếp hạng: đã chơi thì là thành tích của bạn, chưa chơi thì là lời khuyên trước khi bắt đầu
export const MyResult = ({ view }: { view: DailyChallengeView }) => {
    const { challenge, me } = view;
    const meta = GAME_META[challenge.gameName];
    const entry = me?.entry;

    if (!entry) {
        // Trò hình hợp với nối chuyện; trò bài có hai thông tin (số và chất) nên hợp với căn phòng trí nhớ
        const method = METHODS.find((item) => item.id === (challenge.gameName === 'image' ? 'story' : 'loci')) ?? METHODS[0];
        return (
            <div className="myrank myrank--tip">
                <h2>Trước khi bắt đầu</h2>
                <p>
                    Hôm nay là {challenge.totalItems} {meta.unit}. Thử <strong>{method.name.toLowerCase()}</strong>:{' '}
                    {method.summary.charAt(0).toLowerCase() + method.summary.slice(1)}
                </p>
                <Link to={method.guide} viewTransition className="dash-link">
                    Đọc cách làm →
                </Link>
            </div>
        );
    }

    const others = challenge.players - 1;
    const beaten = challenge.players - entry.rank;
    let standing = `Bạn giỏi hơn ${Math.round((beaten / others) * 100)}% người chơi hôm nay.`;
    if (others === 0) standing = 'Bạn là người đầu tiên hoàn thành hôm nay.';
    else if (beaten === 0) standing = 'Bạn đã hoàn thành thử thách. Ngày mai thử nối các hình thành câu chuyện nhé!';

    return (
        <div className="myrank">
            <h2>Kết quả của bạn</h2>
            <p className="myrank__rank">
                <span>Hạng</span>
                <strong>{entry.rank}</strong>
                <span>trên {challenge.players}</span>
            </p>
            <p className="myrank__line">{standing}</p>
            <dl className="myrank__stats">
                <div>
                    <dt>Đúng</dt>
                    <dd>
                        {entry.correctItems}/{entry.totalItems}
                    </dd>
                </div>
                <div>
                    <dt>Ghi nhớ</dt>
                    <dd>{formatClock(entry.memorizeSec)}</dd>
                </div>
                <div>
                    <dt>Nhớ lại</dt>
                    <dd>{formatClock(entry.recallSec)}</dd>
                </div>
            </dl>
        </div>
    );
};
