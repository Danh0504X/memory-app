import { useEffect, useState } from 'react';
import { AlertCircle, Check, Flame, LoaderCircle, Pencil, RefreshCw, Sparkle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { GAME_SESSION_RECORDED_EVENT } from '@/features/shared-game/events';
import { profileApi, type UserProfile } from '../api/profile.api';
import { formatNumber, getLevelProgress } from '../utils/profileProgress';

interface ApiError {
    message?: string;
}

// Lời nhắn dưới chuỗi ngày chơi, theo trạng thái backend trả về
const describeStreak = (profile: UserProfile): string => {
    if (profile.streakExpired) return 'Ôi, chuỗi ngày chơi của bạn đã bị ngắt mất rồi! Hôm nay mình cùng chơi lại nhé!';
    if (profile.streaks === 0) return 'Hoàn thành một ván để bắt đầu chuỗi ngày chơi.';
    if (profile.playedToday) return `Bạn đã hoàn thành game liên tục ${profile.streaks} ngày. Hôm nay bạn đã chơi rồi!`;
    return `Bạn đã hoàn thành game liên tục ${profile.streaks} ngày. Chơi một ván hôm nay để giữ chuỗi nhé!`;
};

export const ProfilePage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [unavailableFields, setUnavailableFields] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isCurrent = true;
        let latestRequest = 0;

        const loadProfile = async () => {
            const requestId = ++latestRequest;
            setIsLoading(true);
            setError(null);

            try {
                const response = await profileApi.getProfile();
                if (isCurrent && requestId === latestRequest) {
                    setProfile(response.data.profile);
                    setUnavailableFields(response.data.unavailableFields ?? []);
                }
            } catch (requestError) {
                if (isCurrent && requestId === latestRequest) {
                    setError((requestError as ApiError).message ?? 'Không thể tải hồ sơ. Vui lòng thử lại.');
                }
            } finally {
                if (isCurrent && requestId === latestRequest) setIsLoading(false);
            }
        };

        window.addEventListener(GAME_SESSION_RECORDED_EVENT, loadProfile);
        void loadProfile();
        return () => {
            isCurrent = false;
            window.removeEventListener(GAME_SESSION_RECORDED_EVENT, loadProfile);
        };
    }, [reloadKey]);

    const hasUnavailableStats = unavailableFields.includes('exp') || unavailableFields.includes('streaks');
    const playStreak = profile?.streaks ?? null;
    const levelProgress = profile ? getLevelProgress(profile.level) : null;

    return (
        <div className="min-h-screen bg-[#f8fbf8] font-sans text-[#1f2937]">
            <Header />

            <main className="mx-auto w-full max-w-[1200px] px-5 pb-14 pt-7 sm:px-8 sm:pt-8 lg:px-0">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-bold leading-tight sm:text-[30px]">Hồ sơ của bạn</h1>
                        <p className="mt-1.5 text-[13px] text-[#748277] sm:text-sm">
                            Một góc nhỏ để theo dõi hành trình học tập của bạn.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/profile/update')}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e3ebe6] bg-white px-4 text-[12px] font-semibold text-[#2e7d32] transition-colors hover:bg-[#f4faf5] sm:min-w-[186px] sm:text-[13px]"
                    >
                        <Pencil size={14} aria-hidden="true" />
                        Chỉnh sửa hồ sơ
                    </button>
                </div>

                {error ? (
                    <section className="flex min-h-52 flex-col items-center justify-center rounded-[20px] border border-[#e3ebe6] bg-white px-6 py-10 text-center" role="alert">
                        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1f0] text-[#b42318]">
                            <AlertCircle size={21} aria-hidden="true" />
                        </span>
                        <h2 className="text-base font-bold">Không thể tải hồ sơ</h2>
                        <p className="mt-1.5 max-w-lg text-sm text-[#748277]">{error}</p>
                        <button
                            type="button"
                            onClick={() => setReloadKey((key) => key + 1)}
                            className="mt-5 inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#2e7d32] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#236527]"
                        >
                            <RefreshCw size={16} aria-hidden="true" />
                            Thử lại
                        </button>
                    </section>
                ) : (
                    <>
                        <section className="relative flex min-h-[152px] flex-col justify-center overflow-hidden rounded-[20px] border border-[#e3ebe6] bg-white px-6 py-7 sm:px-8 lg:min-h-[174px]" aria-labelledby="profile-name" aria-busy={isLoading}>
                            <div className="pointer-events-none absolute -right-10 -top-14 hidden h-64 w-64 rounded-full bg-[#eaf8ef] sm:block" />
                            <div className="pointer-events-none absolute right-[9%] top-8 hidden h-40 w-40 rounded-full bg-[#fff7df] sm:block" />
                            <div className="relative z-10 flex items-center gap-5 sm:gap-7">
                                <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border border-[#a7e3ca] bg-[#d7f1e4] sm:h-[90px] sm:w-[90px]" role="img" aria-label="Mascot Memio">
                                    {isLoading ? <LoaderCircle className="animate-spin" size={25} aria-label="Đang tải" /> : <img src="/profile-mascot.svg" alt="" className="h-[66px] w-[58px] object-contain sm:h-[76px] sm:w-[66px]" />}
                                </div>
                                <div className="min-w-0">
                                    <h2 id="profile-name" className="truncate text-[20px] font-bold sm:text-[22px]">
                                        {isLoading ? 'Đang tải hồ sơ...' : profile?.username ?? 'Chưa có dữ liệu'}
                                    </h2>
                                    <p className="mt-1 text-sm text-[#748277]">
                                        {isLoading ? ' ' : profile?.fullname ?? 'Họ và tên chưa được cập nhật'}
                                    </p>
                                    <p className="mt-2 text-[13px] font-medium text-[#3d9f83]">
                                        {isLoading ? ' ' : profile?.username ? `@${profile.username}` : 'Tên người dùng chưa có'}
                                    </p>
                                </div>
                                <div className="relative ml-auto hidden min-w-[220px] flex-col items-center justify-center pr-2 text-[#2e7d32] lg:flex">
                                    <img src="/profile-mascot.svg" alt="" className="h-[68px] w-[60px] object-contain" />
                                    <div className="whitespace-nowrap text-center text-[11px] font-medium leading-5">
                                        Mỗi ngày một chút, tiến bộ thật nhiều.
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <section className="min-h-[126px] rounded-[18px] border border-[#f0e9c9] bg-[#fff7df] p-5 sm:p-6" aria-labelledby="experience-title">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#f9e8a5] text-[#2e7d32]">
                                        <Sparkle size={20} fill="currentColor" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 id="experience-title" className="text-[10px] font-semibold tracking-[0.04em] text-[#748277]">KINH NGHIỆM</h2>
                                        <p className="mt-0.5 text-[20px] font-bold leading-tight sm:text-[22px]">
                                            {isLoading ? 'Đang tải...' : profile ? `${formatNumber(profile.exp)} EXP` : 'Chưa có dữ liệu'}
                                        </p>
                                    </div>
                                    {!isLoading && profile && (
                                        <span className="ml-auto shrink-0 rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#2e7d32]">
                                            Cấp {profile.level.level}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-4 text-xs text-[#748277]">
                                    {isLoading ? ' ' : levelProgress
                                        ? `Còn ${formatNumber(levelProgress.remaining)} EXP để lên cấp ${levelProgress.nextLevel}`
                                        : 'Dữ liệu kinh nghiệm hiện chưa khả dụng.'}
                                </p>
                                <div
                                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e7eadc]"
                                    role="progressbar"
                                    aria-label="Tiến độ lên cấp tiếp theo"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={levelProgress ? Math.round(levelProgress.percentage) : 0}
                                >
                                    <div
                                        className="h-full rounded-full bg-[#2e7d32] transition-[width]"
                                        style={{ width: `${levelProgress?.percentage ?? 0}%` }}
                                    />
                                </div>
                            </section>

                            <section className="min-h-[126px] rounded-[18px] border border-[#e0eee5] bg-[#eaf8ef] p-5 sm:p-6" aria-labelledby="streak-title">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#f9e8a5] text-[#2e7d32]">
                                        <Flame size={19} aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 id="streak-title" className="text-[10px] font-semibold tracking-[0.04em] text-[#748277]">CHUỖI NGÀY CHƠI</h2>
                                        <p className="mt-0.5 text-[19px] font-bold leading-tight sm:text-[21px]">
                                            {isLoading
                                                ? 'Đang tải...'
                                                : playStreak === null
                                                    ? 'Chưa có dữ liệu'
                                                    : profile?.streakExpired
                                                        ? 'ĐÃ BỊ GIÁN ĐOẠN CHUỖI'
                                                        : `${playStreak} NGÀY LIÊN TIẾP`}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-[#748277]">
                                    {isLoading ? ' ' : profile ? describeStreak(profile) : 'Chưa có dữ liệu về chuỗi ngày chơi.'}
                                </p>
                                {!isLoading && profile && (
                                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                                        {profile.streaks > 0 && (
                                            <div className="flex gap-1.5" aria-label={`${profile.streaks} ngày chơi liên tiếp`}>
                                                {Array.from({ length: Math.min(profile.streaks, 7) }, (_, day) => (
                                                    <span key={day} className="flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#2e7d32] text-white">
                                                        <Check size={10} strokeWidth={3} aria-hidden="true" />
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {profile.longestStreak > 0 && (
                                            <span className="text-[11px] font-medium text-[#3d9f83]">
                                                Chuỗi dài nhất: {profile.longestStreak} ngày
                                            </span>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>

                        <section className="mt-5" aria-labelledby="account-title">
                            <h2 id="account-title" className="mb-3 text-[18px] font-bold sm:text-[20px]">Thông tin tài khoản</h2>
                            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                                <dl className="rounded-[18px] border border-[#e3ebe6] bg-white px-5 py-4 sm:px-6 sm:py-5">
                                    <div className="pb-3">
                                        <dt className="text-[11px] font-medium text-[#748277]">Username</dt>
                                        <dd className="mt-1 break-words text-[14px] font-semibold">
                                            {isLoading ? 'Đang tải...' : profile?.username ?? 'Chưa có dữ liệu'}
                                        </dd>
                                    </div>
                                    <div className="border-t border-[#e3ebe6] pt-3">
                                        <dt className="text-[11px] font-medium text-[#748277]">Họ và tên</dt>
                                        <dd className="mt-1 break-words text-[14px] font-semibold">
                                            {isLoading ? 'Đang tải...' : profile?.fullname ?? 'Chưa có dữ liệu'}
                                        </dd>
                                    </div>
                                </dl>

                                <aside className="flex min-h-[142px] items-center gap-4 rounded-[18px] bg-[#eaf8ef] px-5 py-4 sm:px-6" aria-label="Lời động viên">
                                    <img src="/profile-mascot-celebrating.svg" alt="" className="h-[122px] w-[108px] shrink-0 object-contain" />
                                    <div>
                                        <p className="text-[14px] font-bold">Bạn đang làm rất tốt!</p>
                                        <p className="mt-1 text-[11px] leading-[1.55] text-[#748277]">
                                            Giữ nhịp học ngắn mỗi ngày để kiến thức ở lại lâu hơn nhé.
                                        </p>
                                    </div>
                                </aside>
                            </div>
                        </section>

                        <p className="mt-5 text-[10px] leading-5 text-[#87958b]">
                            {isLoading ? ' ' : hasUnavailableStats || unavailableFields.includes('fullname')
                                ? 'Một số thông tin hồ sơ chưa được máy chủ cung cấp; các giá trị này sẽ hiển thị khi có dữ liệu.'
                                : 'Số liệu hồ sơ được lấy trực tiếp từ tài khoản của bạn.'}
                        </p>
                    </>
                )}
            </main>
        </div>
    );
};

export default ProfilePage;
