import { useState } from 'react';
import { router, type Href } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BlockState, Panel } from '@/components/ui/Panel';
import { TextField } from '@/components/ui/TextField';
import { Chips } from '@/features/shared-game/components/Chips';
import { FormError } from '@/features/auth/components/AuthParts';
import { useAuthStore } from '@/features/auth/store/authStore';
import { roomsApi, type FamilyGame } from '../api/rooms.api';
import { useParentAction, useParentResource } from '../hooks/useParentResource';
import { isRoomCode } from '../utils/roomSession';
import { gameLabel, ParentScreen } from './ParentParts';

export function FamilyLobbyScreen() {
    const isParent = useAuthStore((s) => s.user?.role === 'parent');
    return isParent ? <CreateRoomScreen /> : <JoinRoomScreen />;
}
function JoinRoomScreen() {
    const [code, setCode] = useState('');
    const action = useParentAction();
    return <ParentScreen title="Chơi cùng ba mẹ">
        <AppText>Nhập mã phòng ba mẹ đã tạo. Cả hai cần đăng nhập trên hai thiết bị hoặc hai phiên riêng.</AppText>
        <TextField label="Mã phòng (8 ký tự)" value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} maxLength={8} />
        <FormError>{action.error}</FormError>
        <Button title="Vào phòng" loading={action.busy} onPress={() => void action.run(async () => {
            const clean = code.trim().toUpperCase();
            if (!isRoomCode(clean)) throw new Error('Mã phòng gồm 8 ký tự A–Z và 2–9.');
            await roomsApi.join(clean);
            router.push(`/family-room/${clean}` as Href);
        })} />
    </ParentScreen>;
}
function CreateRoomScreen() {
    const request = useParentResource(roomsApi.games);
    return <ParentScreen title="Chơi cùng con">
        <AppText>Chọn trò và tạo phòng. Chỉ tài khoản con đã liên kết mới tham gia được.</AppText>
        <BlockState request={request.state} onRetry={request.reload}>{({ games }) => games.length ? <RoomSettings games={games} /> : <AppText>Chưa có trò chơi khả dụng.</AppText>}</BlockState>
    </ParentScreen>;
}
function RoomSettings({ games }: { games: FamilyGame[] }) {
    const [gameName, setGameName] = useState(games[0].gameName);
    const game = games.find((g) => g.gameName === gameName) ?? games[0];
    return <><Chips accessibilityLabel="Trò chơi" value={gameName} options={games.map((g) => ({ value: g.gameName, label: gameLabel(g.gameName) }))} onChange={setGameName} /><GameSettings key={game.gameName} game={game} /></>;
}
function GameSettings({ game }: { game: FamilyGame }) {
    const [mode, setMode] = useState<'level' | 'custom'>('level');
    const [level, setLevel] = useState(1);
    const [count, setCount] = useState(String(game.customItems?.min ?? 5));
    const [memorize, setMemorize] = useState(String(game.defaultMemorizeSec));
    const [recall, setRecall] = useState(String(game.recallSec));
    const [rounds, setRounds] = useState(3);
    const action = useParentAction();
    return <Panel title="Cấu hình phòng">
        {game.customItems && <Chips accessibilityLabel="Chế độ" value={mode} options={[{ value: 'level', label: 'Theo cấp' }, { value: 'custom', label: 'Tự chọn' }]} onChange={setMode} />}
        {mode === 'level' ? <Chips accessibilityLabel="Cấp đã mở của con" value={level} options={game.levels.filter((l) => l.level <= (game.player?.unlockedLevel ?? 1)).map((l) => ({ value: l.level, label: `Cấp ${l.level} · ${l.itemCount} mục` }))} onChange={setLevel} /> : <>
            <TextField label={`Số mục (${game.customItems?.min}–${game.customItems?.max})`} value={count} onChangeText={setCount} keyboardType="number-pad" />
            <AppText>Thời gian nhớ lại mặc định: {game.recallSec} giây</AppText>
            {game.customTimeRange && <TextField label={`Nhớ lại (${game.customTimeRange.min}–${game.customTimeRange.max} giây)`} value={recall} onChangeText={setRecall} keyboardType="number-pad" />}
        </>}
        <AppText>Thời gian ghi nhớ</AppText>
        <Chips accessibilityLabel="Giây ghi nhớ" value={memorize} options={game.memorizeSecOptions.map((sec) => ({ value: String(sec), label: `${sec} giây` }))} onChange={setMemorize} />
        {mode === 'custom' && game.customTimeRange && <TextField label={`Ghi nhớ tự chọn (${game.customTimeRange.min}–${game.customTimeRange.max} giây)`} value={memorize} onChangeText={setMemorize} keyboardType="number-pad" />}
        <Chips accessibilityLabel="Số vòng" value={rounds} options={[1, 3, 5].map((n) => ({ value: n, label: `${n} vòng` }))} onChange={setRounds} />
        <FormError>{action.error}</FormError>
        <Button title="Tạo phòng" loading={action.busy} onPress={() => void action.run(async () => {
            const duration = Number(memorize), items = Number(count), recallSec = Number(recall);
            if (!Number.isInteger(duration) || duration <= 0 || (mode === 'custom' && (!Number.isInteger(items) || !Number.isInteger(recallSec)))) throw new Error('Nhập số nguyên hợp lệ.');
            const room = await roomsApi.create({ gameName: game.gameName, roundCount: rounds, memorizeSec: duration,
                ...(mode === 'level' ? { mode: 'level' as const, gameLevel: level } : { mode: 'custom' as const, itemCount: items, ...(game.customTimeRange ? { recallSec } : {}) }) });
            router.push(`/family-room/${room.code}` as Href);
        })} />
    </Panel>;
}
