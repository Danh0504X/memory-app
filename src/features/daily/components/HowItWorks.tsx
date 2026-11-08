import { GAME_META } from '@/features/dashboard/constants';
import { formatSeconds } from '@/features/shared-game/utils/formatTime';
import type { DailyChallenge } from '../api/daily.api';

// Giới thiệu thử thách ngày (nút "Giới thiệu" ở trang chủ dẫn tới đây qua #how).
// challenge null khi chưa tải được: vẫn hiện luật chung, bỏ phần số liệu của hôm nay.
export const HowItWorks = ({ challenge }: { challenge: DailyChallenge | null }) => {
    const meta = challenge ? GAME_META[challenge.gameName] : null;

    return (
        <section id="how" className="how" aria-labelledby="how-title">
            <h2 id="how-title">Cách chơi thử thách</h2>
            <ol className="how__steps">
                <li data-tone="mint">
                    <h3>Một đề cho mọi người</h3>
                    <p>
                        Đúng 00:00 mỗi ngày (giờ Việt Nam) có đề mới, ai cũng nhận cùng một đề. Thẻ bài và Hình ảnh thay
                        phiên nhau.
                        {challenge && meta && ` Hôm nay là ${meta.label.toLowerCase()}, ${challenge.totalItems} ${meta.unit}.`}
                    </p>
                </li>
                <li data-tone="sun">
                    <h3>Một lượt duy nhất</h3>
                    <p>
                        Bấm tham gia là ván bắt đầu và được tính, kể cả khi bạn bỏ dở.
                        {challenge &&
                            ` Bạn có ${formatSeconds(challenge.memorizeLimitSec)} để ghi nhớ và ${formatSeconds(challenge.recallLimitSec)} để xếp lại.`}
                    </p>
                </li>
                <li data-tone="sky">
                    <h3>Xếp hạng công bằng</h3>
                    <p>
                        Ai nhớ đúng nhiều hơn đứng trên. Bằng nhau thì ai dùng ít thời gian hơn, vẫn bằng thì ai nộp bài
                        trước.
                    </p>
                </li>
            </ol>
            <p className="how__note">
                Ván thử thách vẫn được cộng EXP và giữ chuỗi ngày, nhưng không mở cấp độ mới. Cần đăng nhập để có tên trên
                bảng xếp hạng.
            </p>
        </section>
    );
};
