import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BlockState } from '@/features/dashboard/components/BlockState';
import { PROFILE_KEY, useCatalog, useProfile } from '@/features/dashboard/hooks/useOverview';
import { setQuery } from '@/lib/queryCache';
import { GAME_SESSION_RECORDED_EVENT } from '@/features/shared-game/events';
import type { UserProfile } from '../api/profile.api';
import { Achievements } from '../components/Achievements';
import { IdentityPanel } from '../components/IdentityPanel';
import { GamesSummary, LevelPanel, StreakSummary } from '../components/ProgressPanels';
import '@/styles/app-screen.css';
import '../profile.css';

// Hồ sơ: bạn là ai (tên, email), cấp độ và cách lên cấp, chuỗi ngày, thành tích.
// Số liệu theo ngày/tuần nằm ở trang Tiến độ; trang này không lặp lại chúng.
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

    return (
        <div className="min-h-svh">
            <Header />

            <main className="dash profile page-col">
                {profileState.status !== 'ready' && <h1 className="sr-only">Hồ sơ của bạn</h1>}

                <div className="dash__grid">
                    <section className="panel span-12" aria-label="Thông tin của bạn">
                        <BlockState request={profileState} onRetry={profile.reload}>
                            {(data) => (
                                <IdentityPanel
                                    profile={data}
                                    startEditing={startEditing}
                                    onSaved={(updated) => {
                                        setSaved(updated);
                                        setQuery(PROFILE_KEY, updated);
                                    }}
                                />
                            )}
                        </BlockState>
                    </section>

                    <section className="panel span-6" aria-labelledby="level-title">
                        <div className="panel__head">
                            <h2 id="level-title">Cấp độ</h2>
                        </div>
                        <BlockState request={profileState} onRetry={profile.reload}>
                            {(data) => <LevelPanel profile={data} />}
                        </BlockState>
                    </section>

                    {/* Chuỗi ngày và các trò chung một khối, ngăn bằng đường mảnh, để cao bằng khối Cấp độ */}
                    <div className="panel span-6 dash__aside">
                        <section aria-labelledby="streak-title">
                            <div className="panel__head">
                                <h2 id="streak-title">Chuỗi ngày</h2>
                            </div>
                            <BlockState request={profileState} onRetry={profile.reload}>
                                {(data) => <StreakSummary profile={data} />}
                            </BlockState>
                        </section>
                        <section aria-labelledby="games-title">
                            <div className="panel__head">
                                <h2 id="games-title">Trò chơi của bạn</h2>
                            </div>
                            <BlockState request={catalog.state} onRetry={catalog.reload}>
                                {(games) => <GamesSummary games={games} />}
                            </BlockState>
                        </section>
                    </div>

                    <section className="panel span-12" aria-labelledby="badges-title">
                        <div className="panel__head">
                            <h2 id="badges-title">Thành tích</h2>
                        </div>
                        {profileState.status === 'ready' ? (
                            <BlockState request={catalog.state} onRetry={catalog.reload}>
                                {(games) => <Achievements profile={profileState.data} games={games} />}
                            </BlockState>
                        ) : (
                            <BlockState request={profileState} onRetry={profile.reload}>
                                {() => null}
                            </BlockState>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
