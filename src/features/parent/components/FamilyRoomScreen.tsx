import { useCallback, useEffect, useState } from 'react';
import { Alert, Share, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { TextField } from '@/components/ui/TextField';
import { FormError } from '@/features/auth/components/AuthParts';
import { PlayingCard } from '@/features/cards-game/components/PlayingCard';
import { cardFromCode } from '@/features/cards-game/utils/cardUtils';
import { PhotoTile } from '@/features/shared-game/components/PhotoTile';
import { MemorizeStage } from '@/features/shared-game/components/MemorizeStage';
import { RecallBoard } from '@/features/shared-game/components/RecallBoard';
import { roomsApi, type RoomItem, type RoomView } from '../api/rooms.api';
import { useFamilyRoom } from '../hooks/useFamilyRoom';
import { gameLabel, ParentScreen } from './ParentParts';

function GameItem({ game, item, width = 100 }: { game: string; item: RoomItem; width?: number }) {
    if (game === 'card') {
        try { return <PlayingCard card={cardFromCode(item.code)} width={width} />; }
        catch { return <AppText>{item.label ?? item.code}</AppText>; }
    }
    return <View style={{ alignItems: 'center', gap: 6, maxWidth: width }}>
        {item.imageUrl && <PhotoTile uri={item.imageUrl} width={width} label={item.label ?? 'Hình ghi nhớ'} />}
        {(game !== 'image' || !item.imageUrl) && <AppText variant={width >= 100 ? 'heading' : 'small'}>{item.label ?? (game === 'facename' ? '' : item.code)}</AppText>}
    </View>;
}

export function FamilyRoomScreen({ code }: { code: string }) {
    useFocusEffect(useCallback(() => {
        void activateKeepAwakeAsync('family-room').catch(() => {});
        return () => { void deactivateKeepAwake('family-room'); };
    }, []));
    const state = useFamilyRoom(code);
    const { room, answers, busy, act, edit } = state;
    const [slot, setSlot] = useState(0);
    const [index, setIndex] = useState(0);
    useEffect(() => { setSlot(0); setIndex(0); }, [room?.roundIndex]);
    const ended = room?.state === 'completed' || room?.state === 'cancelled';
    return <ParentScreen title={room ? `${gameLabel(room.gameName)} · Vòng ${room.roundIndex + 1}/${room.roundCount}` : 'Đang mở phòng'}>
        <AppText selectable>Mã phòng: {code}</AppText>
        <FormError>{state.error}</FormError>
        <AppText variant="small">{state.connected ? 'Đã đồng bộ với máy chủ' : 'Chưa đồng bộ. Kết nối lại để xem trạng thái mới nhất.'}</AppText>
        <Button title="Đồng bộ lại" variant="secondary" onPress={state.reload} />
        {!room && !state.error && <AppText>Đang tải phòng…</AppText>}
        {room?.state === 'waiting' && <Panel title="Chờ hai người sẵn sàng">
            <AppText>Ba mẹ: {room.parentReady ? 'Sẵn sàng' : 'Đang chờ'} · Con: {room.childJoined ? room.childReady ? 'Sẵn sàng' : 'Đã vào phòng' : 'Chưa vào phòng'}</AppText>
            {room.role === 'parent' ? <Button title="Chia sẻ mã phòng" variant="secondary" onPress={() => void Share.share({ message: `Vào Memio → Chơi cùng ba mẹ → nhập mã ${code}.` }).catch(() => {})} /> :
                !room.childJoined && <Button title="Tham gia phòng" loading={busy} onPress={() => void act(() => roomsApi.join(code))} />}
            <Button title="Tôi đã sẵn sàng" loading={busy} disabled={room.role === 'parent' ? room.parentReady : !room.childJoined || room.childReady} onPress={() => void act(() => roomsApi.ready(code))} />
            {room.role === 'parent' && <Button title="Bắt đầu chơi" loading={busy} disabled={!room.parentReady || !room.childReady || !room.childJoined} onPress={() => void act(() => roomsApi.start(code))} />}
        </Panel>}
        {state.remaining !== null && <AppText variant="heading" accessibilityLiveRegion="polite">Còn {state.remaining} giây {room?.phase === 'memorizing' ? 'ghi nhớ' : 'nhớ lại'}</AppText>}
        {room?.phase === 'memorizing' && room.round?.items && <>
            <AppText>Ghi nhớ thứ tự các mục. Có thể chuyển sang nhớ lại khi đã sẵn sàng.</AppText>
            <View style={{ height: 440 }}><MemorizeStage items={room.round.items} index={index} groupSize={1} unit="Mục" onJump={setIndex}
                onPrev={() => setIndex((n) => Math.max(0, n - 1))} onNext={() => setIndex((n) => Math.min(room.rules.totalItems - 1, n + 1))}
                renderBig={(item) => <GameItem game={room.gameName} item={item} width={160} />}
                renderMini={(item, _i, seen) => seen ? <GameItem game={room.gameName} item={item} width={44} /> : <AppText>?</AppText>}
                miniWidth={44} keyOf={(item, i) => `${i}:${item.code}`} /></View>
            <Button title="Bắt đầu nhớ lại" loading={busy} onPress={() => void act(() => roomsApi.recall(code))} />
        </>}
        {room?.phase === 'recalling' && <>
            <AppText>Đã điền {answers.filter((a) => a !== null && a !== '').length}/{room.rules.totalItems} mục. Hãy nộp trước khi hết giờ.</AppText>
            <RoomAnswers key={room.roundIndex} room={room} answers={answers} slot={slot} setSlot={setSlot} edit={edit} disabled={busy} />
            <Button title="Nộp bài" loading={busy} disabled={state.remaining === 0} onPress={() => Alert.alert('Nộp bài?', 'Các ô trống sẽ được tính là chưa trả lời.', [
                { text: 'Tiếp tục nhớ lại', style: 'cancel' }, { text: 'Nộp bài', onPress: () => void act(() => roomsApi.submit(code, [...answers])) },
            ])} />
        </>}
        {room?.phase === 'waiting_for_other' && <Panel><AppText>Đã nộp bài. Đang chờ người còn lại hoàn thành…</AppText></Panel>}
        {room?.round?.result && <RoundResult room={room} />}
        {room?.state === 'round_result' && room.role === 'parent' && <Button title={room.roundIndex + 1 < room.roundCount ? 'Vòng tiếp theo' : 'Hoàn thành phiên chơi'} loading={busy} onPress={() => void act(() => room.roundIndex + 1 < room.roundCount ? roomsApi.next(code) : roomsApi.finish(code))} />}
        {room?.state === 'round_result' && room.role === 'child' && <AppText>Đang chờ ba mẹ chuyển vòng hoặc hoàn thành phiên.</AppText>}
        {room?.state === 'completed' && <Panel title="Phiên chơi đã hoàn thành"><AppText>Ba mẹ và con đã hoàn thành phiên. Điểm đồng hành được máy chủ ghi nhận nếu cả hai tham gia đủ các vòng.</AppText></Panel>}
        {room?.state === 'cancelled' && <AppText>Phiên chơi đã bị hủy hoặc phòng chờ đã hết hạn.</AppText>}
        {room && <Panel title="Bảng điểm phiên">
            <AppText>Ba mẹ: {room.scores.parent.wins} thắng · {room.scores.parent.draws} hòa · {room.scores.parent.points} điểm · hạng {room.scores.parent.rank}</AppText>
            <AppText>Con: {room.scores.child.wins} thắng · {room.scores.child.draws} hòa · {room.scores.child.points} điểm · hạng {room.scores.child.rank}</AppText>
        </Panel>}
        {room?.role === 'parent' && !ended && <Button title="Kết thúc phiên sớm" variant="secondary" loading={busy} onPress={() => Alert.alert('Kết thúc phiên?', 'Phiên chưa đủ các vòng sẽ bị hủy và không nhận điểm đồng hành.', [
            { text: 'Chơi tiếp', style: 'cancel' }, { text: 'Kết thúc', style: 'destructive', onPress: () => void act(() => roomsApi.finish(code)) },
        ])} />}
        <Button title={ended ? 'Quay lại' : 'Rời màn hình phòng'} variant="secondary" onPress={() => router.replace('/family-room' as Href)} />
        {!ended && <AppText variant="small">Rời màn hình không hủy phòng và đồng hồ vẫn tiếp tục. Bạn có thể nhập lại mã để quay về.</AppText>}
    </ParentScreen>;
}

function RoomAnswers({ room, answers, slot, setSlot, edit, disabled }: {
    room: RoomView; answers: (string | null)[]; slot: number; setSlot: (n: number) => void;
    edit: (i: number, answer: string | null) => void; disabled: boolean;
}) {
    const options = room.round?.recallOptions ?? [];
    if (room.gameName === 'word' || room.gameName === 'facename') return <>{answers.map((answer, i) => <Panel key={i}>
        {room.gameName === 'facename' && options[i] && <GameItem game={room.gameName} item={options[i]} width={100} />}
        <TextField label={`${room.gameName === 'word' ? 'Từ' : 'Tên người'} ở vị trí ${i + 1}`} value={answer ?? ''}
            onChangeText={(value) => edit(i, value || null)} editable={!disabled} autoCorrect={false} autoCapitalize="none" maxLength={100} />
    </Panel>)}</>;
    if (room.gameName === 'number') return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{answers.map((answer, i) => <View key={i} style={{ width: 80 }}><TextField label={`Số ${i + 1}`}
        value={answer ?? ''} keyboardType="number-pad" maxLength={1} editable={!disabled}
        onChangeText={(value) => edit(i, value.replace(/[^0-9]/g, '').slice(-1) || null)} /></View>)}</View>;
    const lookup = new Map(options.map((item) => [item.code, item]));
    return <RecallBoard slots={answers.map((code) => code === null ? null : lookup.get(code) ?? { code })} selectedIndex={slot} unit={room.gameName === 'card' ? 'lá' : 'hình'}
        slotsPerRow={room.gameName === 'card' ? 5 : 3} itemRatio={room.gameName === 'card' ? 1.4 : 1} deckItemWidth={64}
        onSelectSlot={(i) => { if (!disabled) setSlot(i); }} onClearSlot={(i) => { if (!disabled && i >= 0) { edit(i, null); setSlot(i); } }}
        deckTitle="Chọn đúng thứ tự" groups={[{ items: options }]} isUsed={(item) => disabled || answers.includes(item.code)}
        onPick={(item) => { if (!disabled) { const target = slot >= 0 ? slot : answers.findIndex((a) => a === null); if (target >= 0) { edit(target, item.code); setSlot(Math.min(target + 1, answers.length - 1)); } } }}
        keyOf={(item) => item.code} labelOf={(item) => item.label ?? item.code} renderItem={(item, width) => <GameItem game={room.gameName} item={item} width={width} />} />;
}
function RoundResult({ room }: { room: RoomView }) {
    const result = room.round!.result!;
    return <Panel title={result.outcome === 'draw' ? 'Vòng này hòa' : result.outcome === 'parent' ? 'Ba mẹ thắng vòng này' : 'Con thắng vòng này'}>
        <AppText>Ba mẹ: {result.parent.correct ?? 0}/{result.parent.total} đúng · {Math.round((result.parent.usedMs ?? 0) / 1000)} giây</AppText>
        <AppText>Con: {result.child.correct ?? 0}/{result.child.total} đúng · {Math.round((result.child.usedMs ?? 0) / 1000)} giây</AppText>
        <AppText variant="heading">Thứ tự đúng</AppText>
        {result.expected.map((item, i) => <View key={`${i}:${item.code}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><AppText>{i + 1}.</AppText><GameItem game={room.gameName} item={item} width={80} /></View>)}
    </Panel>;
}
