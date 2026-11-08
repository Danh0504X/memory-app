import { useState } from "react";
import { Play } from "lucide-react";
import { GameDialog, SettingRow } from "@/features/shared-game/components/GameDialog";
import { useFaceNameStore } from "../store/faceNameStore";

export const FaceNameFreeConfigModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const startFreeGame = useFaceNameStore((state) => state.startFreeGame);
    const [faceCount, setFaceCount] = useState(10);
    const [memorizeSeconds, setMemorizeSeconds] = useState(60);
    const [recallSeconds, setRecallSeconds] = useState(120);
    if (!isOpen) return null;
    return <GameDialog title="Ván tự chọn" subtitle="Luyện theo nhịp của bạn. Ván tự chọn không mở cấp."
        onClose={onClose} footer={<>
            <button type="button" className="tool" onClick={onClose}>Để sau</button>
            <button type="submit" form="face-free-round" className="btn btn--brand"><Play size={18} aria-hidden="true" />Bắt đầu</button>
        </>}>
        <form id="face-free-round" onSubmit={(event) => {
            event.preventDefault();
            onClose();
            void startFreeGame(faceCount, memorizeSeconds, recallSeconds);
        }}>
            <SettingRow title="Số gương mặt" hint="Từ 3 đến 30 người.">
                <input className="face-number" aria-label="Số gương mặt" type="number" min={3} max={30} step={1} required value={faceCount} onChange={(event) => setFaceCount(event.target.valueAsNumber)} />
            </SettingRow>
            <SettingRow title="Thời gian ghi nhớ" hint="Từ 10 đến 300 giây.">
                <input className="face-number" aria-label="Thời gian ghi nhớ, giây" type="number" min={10} max={300} step={1} required value={memorizeSeconds} onChange={(event) => setMemorizeSeconds(event.target.valueAsNumber)} />
            </SettingRow>
            <SettingRow title="Thời gian nhớ lại" hint="Từ 10 đến 300 giây.">
                <input className="face-number" aria-label="Thời gian nhớ lại, giây" type="number" min={10} max={300} step={1} required value={recallSeconds} onChange={(event) => setRecallSeconds(event.target.valueAsNumber)} />
            </SettingRow>
        </form>
    </GameDialog>;
};
