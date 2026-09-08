import { useState } from "react";
import type { Answer, FinalForm, Question } from "@final-form/shared-types";
import { selectQuestions, selectAnswers } from "../engine/selection/index.js";
import { computeFinalForm } from "../engine/computeFinalForm.js";
import { contentPack, matchBaselines } from "../data/index.js";

export interface QuizRound {
  question: Question;
  answers: Answer[];
}

const QUESTIONS_PER_GAME = 20; // pool actuel = 30 questions -> vraie sélection aléatoire (20 parmi 30)
const ANSWERS_SHOWN = 3;

export type QuizPhase = "landing" | "playing" | "calculating" | "result";

export function useQuizEngine() {
  const [phase, setPhase] = useState<QuizPhase>("landing");
  const [rounds] = useState<QuizRound[]>(() => buildRounds());
  const [roundIndex, setRoundIndex] = useState(0);
  const [chosenEffects, setChosenEffects] = useState<Answer["effects"][]>([]);
  const [result, setResult] = useState<FinalForm | null>(null);

  const currentRound = rounds[roundIndex];

  function start() {
    setPhase("playing");
  }

  function chooseAnswer(answer: Answer) {
    const nextEffects = [...chosenEffects, answer.effects];
    setChosenEffects(nextEffects);

    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1);
      return;
    }

    // Dernière question répondue : le calcul est déjà prêt, mais on n'affiche le résultat
    // qu'une fois que l'écran d'analyse (suspense, section 29) a fini son animation.
    // C'est `finishCalculating` (appelé par AnalyzingScreen.onDone) qui déclenche l'affichage.
    setPhase("calculating");
    const finalForm = computeFinalForm({ chosenAnswerEffects: nextEffects, content: contentPack, matchBaselines });
    setResult(finalForm);
  }

  function finishCalculating() {
    setPhase("result");
  }

  function reset() {
    setPhase("landing");
    setRoundIndex(0);
    setChosenEffects([]);
    setResult(null);
  }

  return {
    phase,
    currentRound,
    roundIndex,
    totalRounds: rounds.length,
    result,
    start,
    chooseAnswer,
    finishCalculating,
    reset,
  };
}

function buildRounds(): QuizRound[] {
  const questions = selectQuestions(contentPack.questions, {
    count: Math.min(QUESTIONS_PER_GAME, contentPack.questions.length),
  });

  return questions.map((question) => ({
    question,
    answers: selectAnswers(question.answers, { count: ANSWERS_SHOWN }),
  }));
}
