import { useEffect, useState } from "react";
import type { LocaleCode } from "@final-form/shared-types";

const STEPS: Record<LocaleCode, string[]> = {
  en: ["ANALYZING YOUR PROFILE", "CALCULATING CHAOS", "EVALUATING CAREER POTENTIAL", "FINALIZING YOUR FORM"],
  fr: ["ANALYSE DU PROFIL", "CALCUL DU CHAOS", "ÉVALUATION DU POTENTIEL DE CARRIÈRE", "FINALISATION DE LA FORME"],
  es: ["ANALIZANDO EL PERFIL", "CALCULANDO EL CAOS", "EVALUANDO EL POTENCIAL DE CARRERA", "FINALIZANDO LA FORMA"],
};

interface AnalyzingScreenProps { locale: LocaleCode; onDone: () => void; }

export function AnalyzingScreen({ locale, onDone }: AnalyzingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = STEPS[locale] ?? STEPS.en;

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      const timeout = setTimeout(onDone, 700);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setStepIndex((i) => i + 1), 500);
    return () => clearTimeout(timeout);
  }, [stepIndex, steps.length, onDone]);

  return (
    <div className="ff-card" style={{ textAlign: "center", padding: "56px 24px" }}>
      <div className="ff-eyebrow" style={{ marginBottom: 10 }}>
        {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
      </div>
      <div className="ff-display" style={{ fontSize: 18, letterSpacing: "0.03em" }}>
        {steps[stepIndex] ?? steps[steps.length - 1]}
      </div>
    </div>
  );
}
