import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { OBJECTS, shuffled, type Picture } from './pictures';
import { linkSentence, makeRandom } from './story';
import { Choice, Disc, EmptyDisc, TrialFrame, trialStyles } from './TrialParts';

const LEVELS = [4, 5, 7];
type Phase = 'ready' | 'show' | 'recall' | 'result';

// Cùng hạt giống thì cùng đề: hình và thứ tự xáo trộn không đổi giữa các lần vẽ lại
const makeRound = (length: number, seed: number) => {
    const random = makeRandom(seed);
    const items = shuffled(OBJECTS, random).slice(0, length);
    return { items, choices: shuffled(items, random) };
};

// Trò thử của "Nối thành câu chuyện": nhìn một hàng hình, kể chuyện nối chúng, rồi xếp lại sau khi bị xáo
export function StoryTrial() {
    const [level, setLevel] = useState(0);
    const [seed, setSeed] = useState(() => Date.now() % 100000);
    const [phase, setPhase] = useState<Phase>('ready');
    const [picked, setPicked] = useState<Picture[]>([]);

    const length = LEVELS[level];
    const { items, choices } = makeRound(length, seed);
    const names = items.map((item) => item.name.toLowerCase());

    const start = (nextLevel = level) => {
        setLevel(nextLevel);
        setSeed((value) => value + 104729);
        setPicked([]);
        setPhase('show');
    };
    const pick = (item: Picture) => {
        if (picked.includes(item)) return;
        const next = [...picked, item];
        setPicked(next);
        if (next.length === length) setPhase('result');
    };

    const correct = items.filter((item, i) => picked[i] === item).length;
    const perfect = phase === 'result' && correct === length;
    // Đoạn nối đầu tiên bị đứt: hình đúng trước nó và hình đáng ra phải đến tiếp
    const broken = items.findIndex((item, i) => picked[i] !== item);

    let title = 'Nhớ thứ tự các hình bằng một câu chuyện';
    if (phase === 'show') title = 'Kể một câu chuyện đi qua các hình theo thứ tự';
    if (phase === 'recall') title = `Chạm các hình theo thứ tự (${picked.length}/${length})`;
    if (phase === 'result') title = perfect ? 'Đúng cả câu chuyện!' : `Đúng ${correct}/${length} vị trí`;

    return (
        <TrialFrame
            title={title}
            levels={LEVELS}
            level={level}
            unit="hình"
            onLevel={(index) => {
                setLevel(index);
                setPicked([]);
                setPhase('ready');
            }}
        >
            {phase === 'ready' ? (
                <>
                    <AppText variant="body" style={trialStyles.lead}>
                        {length} hình sẽ hiện theo một hàng. Nối chúng bằng một câu chuyện của riêng bạn, mỗi hình làm gì đó với hình kế tiếp. Sau đó các hình bị xáo trộn và bạn xếp lại.
                    </AppText>
                    <Button title="Bắt đầu" onPress={() => start()} />
                </>
            ) : null}

            {phase === 'show' ? (
                <>
                    <View style={trialStyles.row}>
                        {items.map((item) => <Disc key={item.name} picture={item} label={item.name} />)}
                    </View>
                    <AppText variant="small" style={trialStyles.hint}>Gợi ý: {linkSentence(names, seed)}</AppText>
                    <Button title="Tôi kể xong, xáo hình" onPress={() => setPhase('recall')} />
                </>
            ) : null}

            {phase === 'recall' ? (
                <>
                    <View style={trialStyles.row}>
                        {items.map((_, i) => (picked[i] ? <Disc key={i} picture={picked[i]} size={48} /> : <EmptyDisc key={i} size={48} text={String(i + 1)} />))}
                    </View>
                    <View style={trialStyles.row}>
                        {choices.map((item) => <Choice key={item.name} picture={item} disabled={picked.includes(item)} onPress={() => pick(item)} />)}
                    </View>
                    <Button title="Bỏ hình vừa chọn" variant="secondary" disabled={picked.length === 0} onPress={() => setPicked(picked.slice(0, -1))} />
                </>
            ) : null}

            {phase === 'result' ? (
                <>
                    <View style={trialStyles.row}>
                        {items.map((item, i) => {
                            const ok = picked[i] === item;
                            return <Disc key={item.name} picture={item} tone={ok ? 'ok' : 'bad'} label={ok ? item.name : `Bạn chọn ${picked[i]?.name.toLowerCase()}`} />;
                        })}
                    </View>
                    <AppText variant="body" style={trialStyles.lead} accessibilityLiveRegion="polite">
                        {perfect
                            ? level < LEVELS.length - 1
                                ? `Câu chuyện giữ đủ ${length} hình. Thử với ${LEVELS[level + 1]} hình.`
                                : 'Bảy hình, đúng thứ tự. Giờ thử với từ ngữ trong Ghi nhớ từ.'
                            : broken === 0
                              ? `Câu chuyện mở đầu bằng ${names[0]}. Hãy cho hình đầu tiên một hành động thật rõ để có chỗ bắt đầu.`
                              : `Câu chuyện đứt ở đoạn ${names[broken - 1]} → ${names[broken]}. Chỉ cần làm lại cảnh đó cho to, lạ và có chuyển động, không cần kể lại cả chuyện.`}
                    </AppText>
                    <View style={trialStyles.actions}>
                        {perfect && level < LEVELS.length - 1 ? (
                            <Button title={`Thử ${LEVELS[level + 1]} hình`} onPress={() => start(level + 1)} />
                        ) : (
                            <Button title="Chơi Ghi nhớ từ" onPress={() => router.push('/games/words')} />
                        )}
                        <Button title="Lượt mới" variant="secondary" onPress={() => start()} />
                    </View>
                </>
            ) : null}
        </TrialFrame>
    );
}
