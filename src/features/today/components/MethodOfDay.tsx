import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { METHODS, type MethodId } from '@/features/methods/methodsData';
import storyArt from '@/assets/memio/methods/method-story.svg';
import numbersArt from '@/assets/memio/methods/method-numbers.svg';
import lociArt from '@/assets/memio/methods/method-loci.svg';
import { pickOfDay, TIPS } from '../utils/today';

const ART: Record<MethodId, string> = { story: storyArt, numbers: numbersArt, loci: lociArt };

// Mỗi ngày một phương pháp và một mẹo, đổi theo ngày
export const MethodOfDay = () => {
    const method = pickOfDay(METHODS);
    const tip = pickOfDay(TIPS);

    return (
        <>
            <div className="method-day">
                <img src={ART[method.id]} alt="" className="method-day__art" data-tone={method.tone} />
                <div>
                    <h3>{method.name}</h3>
                    <p>{method.summary}</p>
                </div>
            </div>
            <div className="method-day__links">
                <Link to={method.guide} viewTransition className="dash-link">
                    Đọc cách làm →
                </Link>
                <Link to={method.practice.to} viewTransition className="dash-link">
                    {method.practice.label} →
                </Link>
            </div>
            <p className="tip">
                <Lightbulb size={18} aria-hidden="true" />
                <span>
                    <strong>Mẹo hôm nay:</strong> {tip}
                </span>
            </p>
        </>
    );
};
