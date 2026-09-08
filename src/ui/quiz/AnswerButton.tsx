import type { Answer, LocaleCode } from "@final-form/shared-types";

interface AnswerButtonProps {
  answer: Answer;
  locale: LocaleCode;
  onSelect: (answer: Answer) => void;
}

export function AnswerButton({ answer, locale, onSelect }: AnswerButtonProps) {
  return (
    <button onClick={() => onSelect(answer)} className="ff-btn ff-btn--block" style={{ marginBottom: 14 }}>
      {answer.text[locale]}
    </button>
  );
}
