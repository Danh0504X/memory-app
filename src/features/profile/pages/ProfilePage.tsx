import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BlockState } from '@/features/dashboard/components/BlockState';
import { PROFILE_KEY, useCatalog, useProfile } from '@/features/dashboard/hooks/useOverview';
import { setQuery } from '@/lib/queryCache';
import { GAME_SESSION_RECORDED_EVENT } from '@/features/shared-game/events';
import type { UserProfile } from '../api/profile.api';
import { AccountSettings } from '../components/AccountSettings';
import { Achievements } from '../components/Achievements';
import { ProfileHeader } from '../components/ProfileHeader';
import { Records } from '../components/Records';
import { buildBadges, isEarned } from '../utils/badges';
import '@/styles/app-screen.css';
import '../profile.css';

// Hồ sơ trả lời một câu: "Tôi đã đạt được gì, và tài khoản của tôi".
// Chuỗi ngày theo ngày, số liệu theo kỳ và cấp từng trò nằm ở trang chủ và trang Tiến độ; trang này không lặp lại.
export const ProfilePage = ({ startEditing = false }: { startEditing?: boolean }) => {
    const profile = useProfile();
    const catalog = useCatalog();
    // Bản hồ sơ vừa lưu (đổi tên) hiện ngay, không cần tải lại
    const [saved, setSaved] = useState<UserProfile | null>(null);
    const { reload: reloadProfile } = profile;
    const { reload: reloadCatalog } = catalog;

    // Nộp xong một ván ở tab khác thì EXP, chuỗi ngày và huy hiệu cập nhật theo
    useEffect(() => {
        const refresh = () => {
            setSaved(null);
            reloadProfile();
            reloadCatalog();
        };
        window.addEventListener(GAME_SESSION_RECORDED_EVENT, refresh);
        return () => window.removeEventListener(GAME_SESSION_RECORDED_EVENT, refresh);
    }, [reloadProfile, reloadCatalog]);

    const profileState = saved ? { status: 'ready' as const, data: saved } : profile.state;
    const games = catalog.state.status === 'ready' ? catalog.state.data : null;
    const badges = profileState.status === 'ready' && games ? buildBadges(profileState.data, games) : null;

    const onSaved = (updated: UserProfile) => {
        setSaved(updated);
        setQuery(PROFILE_KEY, updated);
    };

    return (
        <div className="min-h-svh">
            <Header />

            <main className="dash profile page-col">
                {profileState.status !== 'ready' && <h1 className="sr-only">Hồ sơ của bạn</h1>}

                <div className="dash__grid">
                    <section className="panel span-12 profile__head" aria-label="Thông tin của bạn">
                        <BlockState request={profileState} onRetry={profile.reload}>
                            {(data) => (
                                <ProfileHeader
                                    profile={data}
                                    games={games}
                                    badges={badges && { earned: badges.filter(isEarned).length, total: badges.length }}
                                />
                            )}
                        </BlockState>
                    </section>

                    <section className="panel profile__badges" aria-labelledby="badges-title">
                        <div className="panel__head">
                            <h2 id="badges-title">Huy hiệu</h2>
                        </div>
                        {badges ? (
                            <Achievements badges={badges} />
                        ) : (
                            <BlockState request={profileState.status === 'ready' ? catalog.state : profileState} onRetry={() => { profile.reload(); catalog.reload(); }}>
                                {() => null}
                            </BlockState>
                        )}
                    </section>

                    <section className="panel profile__records" aria-labelledby="records-title">
                        <div className="panel__head">
                            <h2 id="records-title">Kỷ lục cá nhân</h2>
                        </div>
                        {profileState.status === 'ready' ? (
                            <BlockState request={catalog.state} onRetry={catalog.reload}>
                                {(data) => <Records profile={profileState.data} games={data} />}
                            </BlockState>
                        ) : (
                            <BlockState request={profileState} onRetry={profile.reload}>
                                {() => null}
                            </BlockState>
                        )}
                    </section>

                    <section className="panel span-12" aria-labelledby="account-title">
                        <div className="panel__head">
                            <h2 id="account-title">Tài khoản</h2>
                        </div>
                        <BlockState request={profileState} onRetry={profile.reload}>
                            {(data) => <AccountSettings profile={data} startEditing={startEditing} onSaved={onSaved} />}
                        </BlockState>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
