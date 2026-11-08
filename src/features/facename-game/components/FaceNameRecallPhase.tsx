import { usePhaseTimer } from "@/features/shared-game/hooks/usePhaseTimer";
import { useEffect, useRef } from "react";
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
    errorMessage,
  } = useFaceNameStore();

  const { timeLeft } = usePhaseTimer(recallDeadline, submitCurrentRound);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);



  const handleSubmit = async () => {
    if (isSubmitting) return;
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
    <div className="play face-play">
      <h1 className="sr-only">Nhớ lại tên từng gương mặt</h1>
      <GameHeader
        gameName="Gương mặt & Tên"
        level={currentMode === "level" ? currentLevelId : null}
        status={`Nhớ lại · đã điền ${filledCount} trên ${total} người`}
        progress={total ? filledCount / total : 0}
        timeLeft={timeLeft}
        timeLimit={settings.recallSeconds}
        actionLabel={isSubmitting ? "Đang chấm..." : "Nộp bài"}
        actionBusy={isSubmitting}
        onAction={handleSubmit}
        onReset={goHome}
      />

      <main className="play__table face-recall">
        <p className="face-recall__hint">Gương mặt đã đổi chỗ. Bạn còn nhớ tên ai?</p>
        {errorMessage && <p className="face-recall__error" role="alert">{errorMessage} Bấm Nộp bài để thử lại.</p>}
        <div className="facename-recall-container">
          <div className="facename-recall-list">
            {recallPeople.map((person, index) => {
              const currentAnswer = userAnswers[person.id] || "";
              return (
                <div key={person.id} className="facename-recall-card">
                  <label htmlFor={`face-answer-${person.id}`} className="facename-recall-badge">Người {index + 1}</label>

                  <div className="facename-recall-avatar">
                    <img
                      src={person.imageUrl}
                      alt={`Người ${index + 1}`}
                    />
                  </div>

                  <input
                    id={`face-answer-${person.id}`}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isSubmitting || timeLeft <= 0}
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
