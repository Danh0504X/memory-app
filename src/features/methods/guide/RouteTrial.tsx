import { router } from 'expo-router';
import { Bed, DoorOpen, Footprints, Lamp, Sofa, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius } from '@/constants/theme';
import { OBJECTS, shuffled, type Picture } from './pictures';
import { makeRandom } from './story';
import { Choice, TrialFrame, trialStyles } from './TrialParts';

// Một lộ trình trong nhà, luôn đi cùng một chiều
const ROUTE: { name: string; icon: LucideIcon; scene: (item: string) => string }[] = [
    { name: 'Cửa ra vào', icon: DoorOpen, scene: (item) => `${item} khổng lồ chắn ngay cửa, phải đẩy mới vào được.` },
    { name: 'Kệ giày', icon: Footprints, scene: (item) => `${item} nằm trong chiếc giày, đi vào là giẫm phải.` },
    { name: 'Ghế sofa', icon: Sofa, scene: (item) => `${item} ngồi chễm chệ trên sofa, chiếm hết chỗ.` },
    { name: 'Bàn học', icon: Lamp, scene: (item) => `${item} nhảy múa dưới ánh đèn bàn học.` },
    { name: 'Giường', icon: Bed, scene: (item) => `${item} nảy tưng tưng trên gối.` },
];
const LEVELS = [3, 5];
const WALK_MS = 2600;
type Phase = 'ready' | 'walk' | 'recall' | 'result';

const makeRound = (length: number, seed: number) => {
    const random = makeRandom(seed);
    const pool = shuffled(OBJECTS, random);
    const items = pool.slice(0, length);
    // Mỗi chỗ có bốn lựa chọn: đồ của chỗ đó, đồ của chỗ khác trên lộ trình (để thử thứ tự) và đồ lạ
    const options = items.map((item, i) => {
        const neighbours = items.filter((_, j) => j !== i).slice(0, 2);
        const strangers = pool.slice(length).filter((other) => !neighbours.includes(other));
        return shuffled([item, ...neighbours, ...strangers].slice(0, 4), random);
    });
    return { items, options };
};

// Trò thử của "Căn phòng trí nhớ": đi qua lộ trình xem đồ vật ở từng chỗ, rồi đi lại và chọn đúng đồ
export function RouteTrial() {
    const [level, setLevel] = useState(0);
    const [seed, setSeed] = useState(() => Date.now() % 100000);
    const [phase, setPhase] = useState<Phase>('ready');
    const [at, setAt] = useState(0);
    const [answers, setAnswers] = useState<(Picture | null)[]>([]);

    const length = LEVELS[level];
    const route = ROUTE.slice(0, length);
    const { items, options } = makeRound(length, seed);

    // Lượt đi đầu: tự bước qua từng chỗ; người chơi có thể bấm để đi nhanh hơn
    useEffect(() => {
        if (phase !== 'walk' || at >= length - 1) return;
        const timer = setTimeout(() => setAt((value) => value + 1), WALK_MS);
        return () => clearTimeout(timer);
    }, [phase, at, length]);

    const start = (nextLevel = level) => {
        setLevel(nextLevel);
        setSeed((value) => value + 3571);
        setAt(0);
        setAnswers([]);
        setPhase('walk');
    };
    const choose = (item: Picture) => {
        const next = [...answers];
        next[at] = item;
        setAnswers(next);
        if (at + 1 < length) setAt(at + 1);
        else setPhase('result');
    };

    const correct = items.filter((item, i) => answers[i] === item).length;
    const perfect = phase === 'result' && correct === length;
    const firstMiss = items.findIndex((item, i) => answers[i] !== item);

    let title = 'Đặt đồ vật dọc lộ trình trong nhà';
    if (phase === 'walk') title = `Đi tới ${route[at].name.toLowerCase()}`;
    if (phase === 'recall') title = `Đi lại: ở ${route[at].name.toLowerCase()} có gì?`;
    if (phase === 'result') title = perfect ? 'Tìm lại đủ mọi đồ vật!' : `Đúng ${correct}/${length} chỗ`;

    return (
        <TrialFrame
            title={title}
            levels={LEVELS}
            level={level}
            unit="chỗ"
            onLevel={(index) => {
                setLevel(index);
                setAt(0);
                setAnswers([]);
                setPhase('ready');
            }}
        >
            <View style={styles.route} accessibilityLabel="Lộ trình">
                {route.map((place, i) => {
                    const Icon = place.icon;
                    const shown = (phase === 'walk' && i <= at) || (phase === 'recall' && i < at && answers[i]) || phase === 'result';
                    const item = phase === 'recall' ? answers[i] : items[i];
                    const here = (phase === 'walk' || phase === 'recall') && i === at;
                    const ok = phase === 'result' ? answers[i] === items[i] : undefined;
                    const Shape = shown && item ? item.src : null;
                    return (
                        <View key={place.name} style={styles.stop}>
                            <View style={[styles.stopDisc, here && styles.here, ok === true && styles.ok, ok === false && styles.bad]}>
                                <Icon color={colors.inkSoft} size={26} strokeWidth={1.8} />
                                {Shape ? (
                                    <View style={styles.item}>
                                        <Shape width={28} height={28} />
                                    </View>
                                ) : null}
                            </View>
                            <AppText variant="small" style={styles.stopName} numberOfLines={2}>{place.name}</AppText>
                        </View>
                    );
                })}
            </View>

            {phase === 'ready' ? (
                <>
                    <AppText variant="body" style={trialStyles.lead}>
                        Lộ trình có {length} chỗ quen trong nhà. Ở mỗi chỗ, một đồ vật sẽ được đặt vào kèm một cảnh lạ. Đi hết một lượt, rồi đi lại và gọi tên đồ vật ở từng chỗ.
                    </AppText>
                    <Button title="Bắt đầu đi" onPress={() => start()} />
                </>
            ) : null}

            {phase === 'walk' ? (
                <>
                    <AppText variant="body" style={styles.scene} accessibilityLiveRegion="polite">{route[at].scene(items[at].name)}</AppText>
                    {at < length - 1 ? (
                        <Button title="Bước tiếp" variant="secondary" onPress={() => setAt(at + 1)} />
                    ) : (
                        <Button
                            title="Đi lại để nhớ"
                            onPress={() => {
                                setAt(0);
                                setPhase('recall');
                            }}
                        />
                    )}
                </>
            ) : null}

            {phase === 'recall' ? (
                <View style={trialStyles.row}>
                    {options[at].map((item) => <Choice key={item.name} picture={item} onPress={() => choose(item)} />)}
                </View>
            ) : null}

            {phase === 'result' ? (
                <>
                    <AppText variant="body" style={trialStyles.lead} accessibilityLiveRegion="polite">
                        {perfect
                            ? level < LEVELS.length - 1
                                ? 'Lộ trình giữ đủ đồ vật. Thêm hai chỗ nữa nhé.'
                                : 'Năm chỗ, năm đồ vật. Lộ trình này dùng được cho cả bộ bài trong trò Thẻ bài.'
                            : `Ở ${route[firstMiss].name.toLowerCase()} là ${items[firstMiss].name.toLowerCase()}. Cho đồ vật chạm vào chỗ đó (chắn, đè, rơi vào) thay vì chỉ đứng cạnh, để chỗ gọi ra được đồ.`}
                    </AppText>
                    <View style={trialStyles.actions}>
                        {perfect && level < LEVELS.length - 1 ? (
                            <Button title={`Thử ${LEVELS[level + 1]} chỗ`} onPress={() => start(level + 1)} />
                        ) : (
                            <Button title="Chơi Thẻ bài" onPress={() => router.push('/games/cards')} />
                        )}
                        <Button title="Lượt mới" variant="secondary" onPress={() => start()} />
                    </View>
                </>
            ) : null}
        </TrialFrame>
    );
}

const styles = StyleSheet.create({
    route: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
    stop: { flex: 1, alignItems: 'center', gap: 4 },
    stopDisc: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
    here: { borderColor: colors.sun },
    ok: { borderColor: colors.brand },
    bad: { borderColor: colors.danger },
    item: { position: 'absolute', right: -6, bottom: -6, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.step },
    stopName: { textAlign: 'center', fontSize: 11, lineHeight: 14 },
    scene: { fontFamily: fonts.semibold, color: colors.ink, padding: 12, borderRadius: radius, backgroundColor: colors.wall },
});
