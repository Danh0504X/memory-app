import Svg, { Path } from 'react-native-svg';

// Biểu tượng chữ M của Memio (phần ô vuông trong src/assets/memio/Logo/Memio.svg)
export function MemioMark({ size = 24 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
            <Path
                d="M30 0H14C6.268 0 0 6.268 0 14V30C0 37.732 6.268 44 14 44H30C37.732 44 44 37.732 44 30V14C44 6.268 37.732 0 30 0Z"
                fill="#2E7D32"
            />
            <Path
                d="M11 31V17C11 11.6667 13 10.6667 17 14L22 23L27 14C31 10.6667 33 11.6667 33 17V31"
                stroke="white"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
