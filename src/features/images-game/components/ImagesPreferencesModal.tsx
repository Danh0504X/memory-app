import { useState } from "react";
import type { GameCatalogItem } from "@/features/shared-game/api/games.api";
import { ChoiceGroup, GameDialog, SettingRow, Stepper, Switch } from "@/features/shared-game/components/GameDialog";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";
import { useImagesGameStore } from "../store/imagesGameStore";

interface ImagesPreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    game: GameCatalogItem; // Các lựa chọn thời gian lấy từ backend
}

export const ImagesPreferencesModal = ({ isOpen, onClose, game }: ImagesPreferencesModalProps) => {
    const { preferences, setPreferences, memorizeTime, setMemorizeTime } = useImagesGameStore();

    // Modal chỉ được render khi mở, nên state luôn khởi tạo từ giá trị hiện tại của store
    const [groups, setGroups] = useState(preferences.groups);
    const [hideTimer, setHideTimer] = useState(preferences.hideTimer);
    const [tempMemorizeTime, setTempMemorizeTime] = useState(
        game.memorizeSecOptions.includes(memorizeTime) ? memorizeTime : game.defaultMemorizeSec,
    );

    if (!isOpen) return null;

    const handleSave = () => {
        setMemorizeTime(tempMemorizeTime);
        setPreferences({
            groups: Math.max(1, Math.min(5, groups)),
            hideTimer,
            prepTime: preferences.prepTime,
        });
        onClose();
    };

    return (
        <GameDialog
            title="Tùy chọn"
            subtitle="Hình ảnh"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn--quiet" onClick={onClose}>
                        Hủy
                    </button>
                    <button type="button" className="btn btn--brand" onClick={handleSave}>
                        Lưu tùy chọn
                    </button>
                </>
            }
        >
            <SettingRow title="Số hình mỗi lần xem" hint="Xem 1 đến 5 hình cùng lúc khi ghi nhớ.">
                <Stepper
                    value={groups}
                    min={1}
                    max={5}
                    label="Số hình mỗi lần xem"
                    onChange={(value) => setGroups(Math.max(1, Math.min(5, Math.round(value) || 1)))}
                />
            </SettingRow>

            <SettingRow title="Thời gian ghi nhớ" hint="Thời gian xem và nhớ thứ tự các hình.">
                <ChoiceGroup
                    options={game.memorizeSecOptions}
                    value={tempMemorizeTime}
                    label="Thời gian ghi nhớ"
                    format={formatSeconds}
                    onChange={setTempMemorizeTime}
                />
            </SettingRow>

            <SettingRow
                title="Thời gian nhớ lại"
                hint={`${formatSeconds(game.recallSec)} để xếp lại các hình, giống nhau với mọi người chơi.`}
            />

            <SettingRow title="Ẩn đồng hồ" hint="Không hiện thời gian đếm ngược trong lúc ghi nhớ.">
                <Switch checked={hideTimer} label="Ẩn đồng hồ" onToggle={() => setHideTimer(!hideTimer)} />
            </SettingRow>
        </GameDialog>
    );
};
