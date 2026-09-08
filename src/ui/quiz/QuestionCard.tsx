import type { Answer, LocaleCode } from "@final-form/shared-types";
import type { QuizRound } from "../../state/useQuizEngine.js";
import { AnswerButton } from "./AnswerButton.js";

interface QuestionCardProps {
  round: QuizRound;
  locale: LocaleCode;
  onAnswer: (answer: Answer) => void;
}

export function QuestionCard({ round, locale, onAnswer }: QuestionCardProps) {
  return (
    <div className="ff-card">
      <h2 className="ff-display" style={{ fontSize: 20, marginTop: 0, marginBottom: 24, lineHeight: 1.35 }}>
        {round.question.text[locale]}
      </h2>
      {round.answers.map((answer) => (
        <AnswerButton key={answer.id} answer={answer} locale={locale} onSelect={onAnswer} />
      ))}
    </div>
  );
}
