import { useEffect, useRef, useState } from "react";
import { useFaceNameStore } from "../store/faceNameStore";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { PlayHints } from "@/features/shared-game/components/PlayHints";

const HINTS = [
  { keys: ["Enter", "↓"], label: "chuyển ô" },
  { keys: ["↑"], label: "ô trước" },
];

export const FaceNameRecallPhase = () => {
  const {
    recallPeople,
    userAnswers,
    updateAnswer,
    settings,
    recallDeadline,
    submitCurrentRound,
    isSubmitting,
    goHome,
    currentMode,
    currentLevelId,
  } = useFaceNameStore();

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!recallDeadline) return settings.recallSeconds;
    return Math.max(0, Math.ceil((recallDeadline - Date.now()) / 1000));
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasTriggeredSubmitRef = useRef(false);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!recallDeadline) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((recallDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !hasTriggeredSubmitRef.current) {
        hasTriggeredSubmitRef.current = true;
        clearInterval(interval);
        submitCurrentRound();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [recallDeadline, submitCurrentRound]);

  const handleSubmit = async () => {
    if (hasTriggeredSubmitRef.current || isSubmitting) return;
    hasTriggeredSubmitRef.current = true;
    await submitCurrentRound();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      // Move to next input without submitting
      if (index < recallPeople.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const total = recallPeople.length;
  const filledCount = Object.values(userAnswers).filter((v) => v.trim() !== "").length;

  return (
    <div className="play">
      <GameHeader
        gameName="Gương mặt & Tên"
        level={currentMode === "level" ? currentLevelId : null}
        status={`Nhớ lại · đã điền ${filledCount} trên ${total} người`}
        progress={filledCount / total}
        timeLeft={timeLeft}
        timeLimit={settings.recallSeconds}
        actionLabel={isSubmitting ? "Đang chấm..." : "Nộp bài"}
        actionBusy={isSubmitting}
        onAction={handleSubmit}
        onReset={goHome}
      />

      <main className="play__table play__table--facename-recall">
        <div className="facename-recall-container">
          <div className="facename-recall-list">
            {recallPeople.map((person, index) => {
              const currentAnswer = userAnswers[person.id] || "";
              return (
                <div key={person.id} className="facename-recall-card">
                  <span className="facename-recall-badge">
                    #{index + 1}
                  </span>

                  <div className="facename-recall-avatar">
                    <img
                      src={person.imageUrl}
                      alt={`Người ${index + 1}`}
                    />
                  </div>

                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    placeholder="Gõ tên..."
                    value={currentAnswer}
                    maxLength={50}
                    onChange={(e) => updateAnswer(person.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="facename-recall-input"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <PlayHints hints={HINTS} />
    </div>
  );
};
