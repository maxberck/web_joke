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

// Langue détectée automatiquement depuis le navigateur (section 23) : aucune action
// requise de l'utilisateur. Le sélecteur manuel n'apparaît qu'à la toute fin (écran
// de résultat), pour ne pas distraire pendant le quiz alors que l'auto-détection
// suffit dans l'immense majorité des cas.
export function App() {
  const [locale, setLocale] = useState<LocaleCode>(() => detectLocale());
  const { phase, currentRound, roundIndex, totalRounds, result, start, chooseAnswer, finishCalculating, reset } =
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
      </div>
    </div>
  );
}
