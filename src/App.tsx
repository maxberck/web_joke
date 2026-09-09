import { useState } from "react";
import type { LocaleCode } from "@final-form/shared-types";
import { detectLocale } from "./i18n/detectLocale.js";
import { useQuizEngine } from "./state/useQuizEngine.js";
import { LandingPage } from "./ui/layout/LandingPage.js";
import { LanguageSelector } from "./ui/layout/LanguageSelector.js";
import { QuestionCard } from "./ui/quiz/QuestionCard.js";
import { ProgressBar } from "./ui/quiz/ProgressBar.js";
import { AnalyzingScreen } from "./ui/result/AnalyzingScreen.js";
import { FinalFormCard } from "./ui/result/FinalFormCard.js";

const errorLabels: Record<LocaleCode, { title: string; retry: string }> = {
  en: { title: "The final form could not be generated", retry: "Restart the quiz" },
  fr: { title: "La forme finale n'a pas pu être générée", retry: "Recommencer le quiz" },
  es: { title: "No se pudo generar la forma final", retry: "Reiniciar el quiz" },
};

export function App() {
  const [locale, setLocale] = useState<LocaleCode>(() => detectLocale());
  const { phase, currentRound, roundIndex, totalRounds, result, error, start, chooseAnswer, finishCalculating, reset } =
    useQuizEngine();

  return (
    <div className="ff-app">
      <div className="ff-shell">
        {phase === "landing" && <LandingPage locale={locale} onStart={start} />}

        {phase === "playing" && currentRound && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <ProgressBar current={roundIndex} total={totalRounds} />
            </div>
            <QuestionCard round={currentRound} locale={locale} onAnswer={chooseAnswer} />
          </div>
        )}

        {phase === "calculating" && <AnalyzingScreen locale={locale} onDone={finishCalculating} />}

        {phase === "result" && result && (
          <div>
            <FinalFormCard result={result} locale={locale} onTryAgain={reset} />
            <div style={{ marginTop: 24 }}>
              <LanguageSelector locale={locale} onChange={setLocale} />
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="ff-card">
            <div className="ff-eyebrow" style={{ marginBottom: 10 }}>FINAL FORM ERROR</div>
            <h1 className="ff-display" style={{ fontSize: 24, marginTop: 0 }}>{errorLabels[locale].title}</h1>
            {error && <p className="ff-mono" style={{ overflowWrap: "anywhere" }}>{error}</p>}
            <button className="ff-btn ff-btn--primary" style={{ width: "100%", marginTop: 12 }} onClick={reset}>
              {errorLabels[locale].retry}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
