import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Flame, LoaderCircle, RefreshCw, Sparkle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GAME_SESSION_RECORDED_EVENT } from '@/features/shared-game/events';
import { profileApi, type UserProfile } from '../api/profile.api';
import { formatNumber } from '../utils/profileProgress';

interface ApiError {
    message?: string;
}

const updateUsernameSchema = z.object({
    username: z
        .string()
        .trim()
        .min(2, 'Username phải có ít nhất 2 ký tự.')
        .max(100, 'Username không được vượt quá 100 ký tự.'),
});

type UpdateUsernameForm = z.infer<typeof updateUsernameSchema>;

export const UpdateProfilePage = () => {
    const updateUser = useAuthStore((state) => state.updateUser);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [unavailableFields, setUnavailableFields] = useState<string[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<UpdateUsernameForm>({
        resolver: zodResolver(updateUsernameSchema),
        defaultValues: { username: '' },
    });

    useEffect(() => {
        let isCurrent = true;
        let latestRequest = 0;

        const loadProfile = async (resetUsername = true) => {
            const requestId = ++latestRequest;
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await profileApi.getProfile();
                if (!isCurrent || requestId !== latestRequest) return;

                setProfile(response.data.profile);
                setUnavailableFields(response.data.unavailableFields ?? []);
                if (resetUsername) reset({ username: response.data.profile.username ?? '' });
            } catch (requestError) {
                if (isCurrent && requestId === latestRequest) {
                    setLoadError((requestError as ApiError).message ?? 'Không thể tải hồ sơ. Vui lòng thử lại.');
                }
            } finally {
                if (isCurrent && requestId === latestRequest) setIsLoading(false);
            }
        };

        const refreshStatsAfterGame = () => { void loadProfile(false); };
        window.addEventListener(GAME_SESSION_RECORDED_EVENT, refreshStatsAfterGame);
        void loadProfile();
        return () => {
            isCurrent = false;
            window.removeEventListener(GAME_SESSION_RECORDED_EVENT, refreshStatsAfterGame);
        };
    }, [reloadKey, reset]);

    const onSubmit = async (values: UpdateUsernameForm) => {
        setSubmitError(null);
        setSuccessMessage(null);

        try {
            const response = await profileApi.updateUsername(values.username);
            const updatedProfile = response.data.profile;

            setProfile(updatedProfile);
            if (updatedProfile.username) updateUser({ username: updatedProfile.username });
            reset({ username: updatedProfile.username ?? values.username });
            setSuccessMessage('Đã lưu thay đổi.');
        } catch (requestError) {
            setSubmitError((requestError as ApiError).message ?? 'Không thể lưu thay đổi. Vui lòng thử lại.');
        }
    };

    const usernameField = register('username');
    const experienceValue = isLoading
        ? 'Đang tải...'
        : profile
            ? `${formatNumber(profile.exp)} · Cấp ${profile.level.level}`
            : 'Chưa có dữ liệu';
    const streakValue = isLoading
        ? 'Đang tải...'
        : !profile
            ? 'Chưa có dữ liệu'
            : profile.streakExpired
                ? 'Đã bị gián đoạn chuỗi'
                : `${profile.streaks} ngày liên tiếp`;

    return (
        <div className="min-h-screen bg-[#f8fbf8] font-sans text-[#1f2937]">
            <Header />

            <main className="mx-auto w-full max-w-[1200px] px-5 pb-14 pt-6 sm:px-8 sm:pt-7 lg:px-0">
                <Link to="/profile" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2e7d32] hover:underline">
                    <span aria-hidden="true">‹</span>
                    Hồ sơ của bạn
                </Link>
                <div className="mb-5 mt-2">
                    <h1 className="text-[26px] font-bold leading-tight sm:text-[30px]">Chỉnh sửa hồ sơ</h1>
                    <p className="mt-1.5 text-[13px] text-[#748277] sm:text-sm">
                        Cập nhật thông tin để mọi người dễ nhận ra bạn hơn.
                    </p>
                </div>

                {loadError ? (
                    <section className="flex min-h-56 flex-col items-center justify-center rounded-[18px] border border-[#e3ebe6] bg-white px-6 py-10 text-center" role="alert">
                        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1f0] text-[#b42318]">
                            <AlertCircle size={21} aria-hidden="true" />
                        </span>
                        <h2 className="text-base font-bold">Không thể tải hồ sơ</h2>
                        <p className="mt-1.5 max-w-lg text-sm text-[#748277]">{loadError}</p>
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
                    <div className="grid items-start gap-5 lg:grid-cols-[1.75fr_0.95fr]">
                        <section className="min-h-[520px] rounded-[18px] border border-[#e3ebe6] bg-white px-5 py-6 sm:px-8 sm:py-7 lg:px-9" aria-labelledby="personal-info-title" aria-busy={isLoading}>
                            <h2 id="personal-info-title" className="text-[18px] font-bold sm:text-[20px]">Thông tin cá nhân</h2>

                            <div className="mt-5 flex items-center gap-4">
                                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border border-[#a7e3ca] bg-[#d7f1e4]">
                                    {isLoading
                                        ? <LoaderCircle className="animate-spin text-[#2e7d32]" size={23} aria-label="Đang tải" />
                                        : <img src="/profile-mascot.svg" alt="Mascot Memio" className="h-[58px] w-[50px] object-contain" />}
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold">Ảnh đại diện Memio</p>
                                    <p className="mt-1 text-[11px] text-[#748277]">Mascot mặc định cho hồ sơ của bạn</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
                                <div>
                                    <label htmlFor="profile-username" className="mb-2 block text-[12px] font-semibold">
                                        Username
                                    </label>
                                    <input
                                        id="profile-username"
                                        type="text"
                                        autoComplete="username"
                                        disabled={isLoading || isSubmitting || !profile}
                                        aria-invalid={Boolean(errors.username)}
                                        aria-describedby={errors.username ? 'profile-username-error' : 'profile-username-help'}
                                        {...usernameField}
                                        onChange={(event) => {
                                            usernameField.onChange(event);
                                            setSuccessMessage(null);
                                        }}
                                        className={`h-12 w-full rounded-[11px] border bg-white px-4 text-[13px] text-[#1f2937] outline-none transition-colors disabled:bg-[#f8fbf8] ${errors.username
                                            ? 'border-[#b42318] focus:ring-1 focus:ring-[#b42318]'
                                            : 'border-[#e3ebe6] focus:border-[#2e7d32] focus:ring-1 focus:ring-[#2e7d32]'
                                            }`}
                                    />
                                    {errors.username ? (
                                        <p id="profile-username-error" className="mt-1.5 text-[11px] text-[#b42318]" role="alert">
                                            {errors.username.message}
                                        </p>
                                    ) : (
                                        <p id="profile-username-help" className="mt-1.5 text-[10px] text-[#87958b]">
                                            Dùng chữ thường, số hoặc dấu gạch dưới.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="profile-fullname" className="mb-2 block text-[12px] font-semibold">
                                        Họ và tên
                                    </label>
                                    <input
                                        id="profile-fullname"
                                        type="text"
                                        value={profile?.fullname ?? ''}
                                        readOnly
                                        disabled
                                        aria-describedby="profile-fullname-help"
                                        placeholder="Backend chưa cung cấp họ tên"
                                        className="h-12 w-full rounded-[11px] border border-[#e3ebe6] bg-[#f8fbf8] px-4 text-[13px] text-[#748277] placeholder:text-[#87958b]"
                                    />
                                    <p id="profile-fullname-help" className="mt-1.5 text-[10px] text-[#87958b]">
                                        Máy chủ hiện chưa hỗ trợ lưu thay đổi họ và tên.
                                    </p>
                                </div>

                                <p className="pt-1 text-[10px] leading-5 text-[#87958b]">
                                    Bạn có thể cập nhật username bất cứ lúc nào. EXP và chuỗi ngày chơi được cập nhật sau mỗi ván hoàn tất.
                                </p>

                                {submitError && (
                                    <div className="rounded-[10px] border border-[#f2c7c4] bg-[#fff5f4] px-3.5 py-3 text-[12px] text-[#b42318]" role="alert">
                                        {submitError}
                                    </div>
                                )}
                                {successMessage && (
                                    <p className="text-[12px] font-medium text-[#2e7d32]" role="status">
                                        {successMessage}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-3 pt-1">
                                    <button
                                        type="submit"
                                        disabled={isLoading || isSubmitting || !profile || !isDirty}
                                        className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-[10px] bg-[#2e7d32] px-5 text-[12px] font-semibold text-white transition-colors hover:bg-[#236527] disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                        {isSubmitting && <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />}
                                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                    <Link
                                        to="/profile"
                                        className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-[10px] border border-[#e3ebe6] bg-white px-5 text-[12px] font-semibold text-[#2e7d32] transition-colors hover:bg-[#f4faf5]"
                                    >
                                        Hủy
                                    </Link>
                                </div>
                            </form>
                        </section>

                        <aside className="space-y-4" aria-label="Xem trước hồ sơ">
                            <section className="min-h-[360px] rounded-[18px] bg-[#eaf8ef] px-5 py-6 sm:px-7" aria-labelledby="profile-preview-title">
                                <h2 id="profile-preview-title" className="text-[16px] font-bold">Xem trước hồ sơ</h2>
                                <div className="mt-5 flex flex-col items-center text-center">
                                    <div className="flex h-[78px] w-[78px] items-center justify-center rounded-full border border-[#a7e3ca] bg-white">
                                        <img src="/profile-mascot.svg" alt="" className="h-[62px] w-[54px] object-contain" />
                                    </div>
                                    <p className="mt-3 max-w-full break-words text-[18px] font-bold">
                                        {profile?.fullname || 'Chưa có họ tên'}
                                    </p>
                                    <p className="mt-1 max-w-full break-all text-[11px] text-[#748277]">
                                        {profile?.username ? `@${profile.username}` : 'Username chưa có'}
                                    </p>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#d8eee1] pt-4">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f9e8a5] text-[#2e7d32]">
                                            <Sparkle size={17} fill="currentColor" aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-[#748277]">EXP</p>
                                            <p className="truncate text-[13px] font-bold">{experienceValue}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f9e8a5] text-[#2e7d32]">
                                            <Flame size={17} aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-[#748277]">Ngày chơi</p>
                                            <p className="truncate text-[13px] font-bold">{streakValue}</p>
                                        </div>
                                    </div>
                                </div>
                                {profile?.streakExpired && (
                                    <p className="mt-3 text-[10px] leading-4 text-[#748277]">
                                        Ôi, chuỗi ngày chơi của bạn đã bị ngắt mất rồi! Hôm nay mình cùng chơi lại nhé!
                                    </p>
                                )}
                                {unavailableFields.length > 0 && (
                                    <p className="mt-4 text-[10px] leading-4 text-[#748277]">
                                        Một số thông tin xem trước chưa được máy chủ cung cấp.
                                    </p>
                                )}
                            </section>

                            <section className="rounded-[16px] border border-[#f0e9c9] bg-[#fff7df] px-5 py-5 sm:px-7" aria-label="Thông tin về tiến trình học">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f9e8a5] text-[#2e7d32]">
                                        <Check size={18} strokeWidth={3} aria-hidden="true" />
                                    </span>
                                    <h2 className="text-[12px] font-bold">Tiến trình được lưu tự động</h2>
                                </div>
                                <p className="mt-3 text-[10px] leading-[1.55] text-[#87907f]">
                                    EXP và chuỗi ngày chơi phản ánh kết quả các ván đã hoàn tất, nên không thể chỉnh sửa trực tiếp tại đây.
                                </p>
                            </section>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UpdateProfilePage;
