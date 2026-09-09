import { useRef, useState } from "react";
import type { Answer, FinalForm, Question } from "@final-form/shared-types";
import { selectQuestions, selectAnswers } from "../engine/selection/index.js";
import { computeFinalForm } from "../engine/computeFinalForm.js";
import { createFormId } from "../engine/game/formId.js";
import { createSeed, mulberry32 } from "../engine/game/random.js";
import { contentPack, matchBaselines } from "../data/index.js";
import rarityDistributionRaw from "../data/rarityDistribution.json" with { type: "json" };

export interface QuizRound {
  question: Question;
  answers: Answer[];
}

const QUESTIONS_PER_GAME = 20;
const ANSWERS_SHOWN = 3;

export type QuizPhase = "landing" | "playing" | "calculating" | "result" | "error";

export function useQuizEngine() {
  const [phase, setPhase] = useState<QuizPhase>("landing");
  const [seed, setSeed] = useState(() => createSeed());
  const [rounds, setRounds] = useState<QuizRound[]>(() => buildRounds(seed));
  const [roundIndex, setRoundIndex] = useState(0);
  const [chosenEffects, setChosenEffects] = useState<Answer["effects"][]>([]);
  const [result, setResult] = useState<FinalForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answerLocked = useRef(false);

  const currentRound = rounds[roundIndex];

  function start() {
    setError(null);
    setPhase("playing");
  }

  function chooseAnswer(answer: Answer) {
    if (answerLocked.current || phase !== "playing") return;
    answerLocked.current = true;

    const nextEffects = [...chosenEffects, answer.effects];
    setChosenEffects(nextEffects);

    if (roundIndex + 1 < rounds.length) {
      setRoundIndex((current) => current + 1);
      queueMicrotask(() => {
        answerLocked.current = false;
      });
      return;
    }

    try {
      const resultSeed = seed >>> 0;
      const rng = mulberry32(resultSeed);
      const finalForm = computeFinalForm({
        chosenAnswerEffects: nextEffects,
        content: contentPack,
        matchBaselines,
        rarityTable: rarityDistributionRaw,
        rng,
      });
      finalForm.runSeed = resultSeed;
      finalForm.formId = createFormId(resultSeed, nextEffects);
      setResult(finalForm);
      setError(null);
      setPhase("calculating");
    } catch (cause) {
      console.error("Impossible de calculer la forme finale", cause);
      setError(cause instanceof Error ? cause.message : "Erreur inconnue pendant le calcul du résultat");
      setPhase("error");
      answerLocked.current = false;
    }
  }

  function finishCalculating() {
    if (result) setPhase("result");
    else {
      setError("Le résultat final n'a pas pu être généré.");
      setPhase("error");
    }
  }

  function reset() {
    const nextSeed = createSeed();
    setSeed(nextSeed);
    setRounds(buildRounds(nextSeed));
    setPhase("landing");
    setRoundIndex(0);
    setChosenEffects([]);
    setResult(null);
    setError(null);
    answerLocked.current = false;
  }

  return {
    phase,
    currentRound,
    roundIndex,
    totalRounds: rounds.length,
    result,
    error,
    start,
    chooseAnswer,
    finishCalculating,
    reset,
  };
}

function buildRounds(seed: number): QuizRound[] {
  const rng = mulberry32(seed);
  const questions = selectQuestions(contentPack.questions, {
    count: QUESTIONS_PER_GAME,
    rng,
  });

  return questions.map((question) => ({
    question,
    answers: selectAnswers(question.answers, { count: ANSWERS_SHOWN, rng }),
  }));
}
