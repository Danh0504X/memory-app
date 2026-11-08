import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius } from '@/constants/theme';
import { DIGIT_SHAPES } from './pictures';
import { linkSentence, makeRandom } from './story';
import { Disc, EmptyDisc, TrialFrame, trialStyles } from './TrialParts';

// Ba cấp: dãy dài dần, thời gian nhìn tăng theo độ dài
const LEVELS = [4, 6, 8];
const SECONDS_PER_DIGIT = 2;
type Phase = 'ready' | 'show' | 'recall' | 'result';

const makeDigits = (length: number, seed: number) => {
    const random = makeRandom(seed);
    return Array.from({ length }, () => Math.floor(random() * 10));
};

// Đọc lỗi để gợi ý đúng chỗ: hai hình đổi chỗ, hay quên đoạn cuối
const adviceFor = (target: number[], answer: number[]) => {
    const wrong = target.map((digit, i) => (answer[i] === digit ? -1 : i)).filter((i) => i >= 0);
    if (wrong.length === 0) return null;
    const [a, b] = wrong;
    if (wrong.length === 2 && b === a + 1 && answer[a] === target[b] && answer[b] === target[a]) {
        return `${DIGIT_SHAPES[target[a]].name} và ${DIGIT_SHAPES[target[b]].name.toLowerCase()} bị đổi chỗ. Cho hình đứng trước làm gì đó với hình đứng sau, để cảnh có chiều.`;
    }
    if (answer.length < target.length && wrong[0] >= answer.length) {
        return `Đoạn cuối bị rơi mất. Thử nối ${DIGIT_SHAPES[target[answer.length]].name.toLowerCase()} vào cảnh mạnh tay hơn: to hơn, ồn hơn, buồn cười hơn.`;
    }
    const first = target[wrong[0]];
    return `Vị trí ${wrong[0] + 1} là ${first}: ${DIGIT_SHAPES[first].name.toLowerCase()}. ${DIGIT_SHAPES[first].why}`;
};

// Trò thử của "Biến số thành hình": nhìn dãy số kèm hình trong vài giây, rồi gõ lại
export function NumberTrial() {
    const [level, setLevel] = useState(0);
    const [seed, setSeed] = useState(() => Date.now() % 100000);
    const [phase, setPhase] = useState<Phase>('ready');
    const [answer, setAnswer] = useState('');
    const [left, setLeft] = useState(0);

    const length = LEVELS[level];
    const digits = makeDigits(length, seed);
    const total = length * SECONDS_PER_DIGIT;

    // Đếm ngược trong lúc nhìn; hết giờ thì tự che
    useEffect(() => {
        if (phase !== 'show') return;
        const started = Date.now();
        const timer = setInterval(() => {
            const remaining = total - (Date.now() - started) / 1000;
            if (remaining <= 0) {
                clearInterval(timer);
                setPhase('recall');
            } else {
                setLeft(remaining);
            }
        }, 100);
        return () => clearInterval(timer);
    }, [phase, total]);

    const start = (nextLevel = level) => {
        setLevel(nextLevel);
        setLeft(LEVELS[nextLevel] * SECONDS_PER_DIGIT);
        setSeed((value) => value + 7919);
        setAnswer('');
        setPhase('show');
    };

    const typed = answer.split('').map(Number);
    const correct = digits.filter((digit, i) => typed[i] === digit).length;
    const perfect = phase === 'result' && correct === length;
    const advice = phase === 'result' ? adviceFor(digits, typed) : null;
    const story = digits.map((digit) => DIGIT_SHAPES[digit].name.toLowerCase());

    let title = 'Nhớ một dãy số bằng hình';
    if (phase === 'show') title = 'Đổi từng số thành hình, nối thành một cảnh';
    if (phase === 'recall') title = 'Dãy số đã che. Gõ lại theo thứ tự';
    if (phase === 'result') title = perfect ? 'Đúng cả dãy!' : `Đúng ${correct}/${length} chữ số`;

    return (
        <TrialFrame
            title={title}
            levels={LEVELS}
            level={level}
            unit="số"
            locked={phase === 'show'}
            onLevel={(index) => {
                setLevel(index);
                setPhase('ready');
                setAnswer('');
            }}
        >
            {phase === 'ready' ? (
                <>
                    <AppText variant="body" style={trialStyles.lead}>
                        Bạn có {total} giây để nhìn {length} chữ số. Mỗi số hiện kèm hình của nó; hãy nối các hình thành một cảnh theo thứ tự, rồi gõ lại dãy số.
                    </AppText>
                    <Button title="Bắt đầu" onPress={() => start()} />
                </>
            ) : null}

            {phase === 'show' ? (
                <>
                    <View style={trialStyles.row}>
                        {digits.map((digit, i) => <Disc key={i} picture={DIGIT_SHAPES[digit]} label={String(digit)} />)}
                    </View>
                    <AppText variant="small" style={trialStyles.hint}>Gợi ý: {linkSentence(story, seed)}</AppText>
                    <View style={styles.timer} accessibilityLabel={`Còn ${Math.ceil(left)} giây`}>
                        <View style={[styles.timerFill, { width: `${(left / total) * 100}%` }]} />
                    </View>
                    <Button title="Tôi nhớ rồi, che lại" variant="secondary" onPress={() => setPhase('recall')} />
                </>
            ) : null}

            {phase === 'recall' ? (
                <>
                    <AppText variant="body" style={trialStyles.lead}>Lần theo cảnh của bạn, đổi từng hình về số.</AppText>
                    <View style={trialStyles.row}>
                        {digits.map((_, i) => {
                            const value = typed[i];
                            return value !== undefined ? <Disc key={i} picture={DIGIT_SHAPES[value]} size={48} label={String(value)} /> : <EmptyDisc key={i} size={48} text="?" />;
                        })}
                    </View>
                    <TextInput
                        value={answer}
                        onChangeText={(text) => setAnswer(text.replace(/\D/g, '').slice(0, length))}
                        keyboardType="number-pad"
                        maxLength={length}
                        autoFocus
                        accessibilityLabel="Dãy số bạn nhớ"
                        style={styles.input}
                        onSubmitEditing={() => answer.length > 0 && setPhase('result')}
                    />
                    <Button title="Kiểm tra" disabled={answer.length === 0} onPress={() => setPhase('result')} />
                </>
            ) : null}

            {phase === 'result' ? (
                <>
                    <View style={trialStyles.row}>
                        {digits.map((digit, i) => {
                            const ok = typed[i] === digit;
                            return <Disc key={i} picture={DIGIT_SHAPES[digit]} tone={ok ? 'ok' : 'bad'} label={ok ? `${digit} · đúng` : `${digit} · bạn gõ ${typed[i] ?? 'trống'}`} />;
                        })}
                    </View>
                    <AppText variant="body" style={trialStyles.lead} accessibilityLiveRegion="polite">
                        {perfect
                            ? level < LEVELS.length - 1
                                ? `Bạn vừa nhớ ${length} chữ số chỉ sau một lần nhìn. Thử dãy ${LEVELS[level + 1]} số.`
                                : 'Tám chữ số, không sai số nào. Đã đến lúc chơi Ghi nhớ số với dãy dài hơn.'
                            : advice}
                    </AppText>
                    <View style={trialStyles.actions}>
                        {perfect && level < LEVELS.length - 1 ? (
                            <Button title={`Thử ${LEVELS[level + 1]} số`} onPress={() => start(level + 1)} />
                        ) : (
                            <Button title="Chơi Ghi nhớ số" onPress={() => router.push('/games/numbers')} />
                        )}
                        <Button title="Dãy mới" variant="secondary" onPress={() => start()} />
                    </View>
                </>
            ) : null}
        </TrialFrame>
    );
}

const styles = StyleSheet.create({
    timer: { height: 8, borderRadius: 4, backgroundColor: colors.step, overflow: 'hidden' },
    timerFill: { height: '100%', backgroundColor: colors.brand },
    input: {
        minHeight: 56,
        borderRadius: radius,
        borderWidth: 1.5,
        borderColor: colors.step,
        backgroundColor: colors.wall,
        textAlign: 'center',
        fontFamily: fonts.extrabold,
        fontSize: 28,
        letterSpacing: 8,
        color: colors.ink,
    },
});
