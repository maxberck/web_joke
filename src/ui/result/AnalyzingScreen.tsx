import { useEffect, useMemo, useState } from "react";
import type { LocaleCode } from "@final-form/shared-types";

const MESSAGE_POOL: Record<LocaleCode, string[]> = {
  en: [
    "ANALYZING YOUR QUESTIONABLE DECISIONS", "CALCULATING CHAOS", "CHECKING IF THIS WAS REALLY YOUR FINAL ANSWER",
    "CONSULTING THE LEGAL DEPARTMENT", "THE LEGAL DEPARTMENT LEFT THE CHAT", "COUNTING YOUR OPEN MENTAL TABS",
    "EVALUATING CAREER SURVIVABILITY", "MEASURING SUSPICIOUS CONFIDENCE", "COMPARING YOU TO A VERY ORGANIZED RACCOON",
    "CHECKING YOUR RELATIONSHIP WITH DEADLINES", "ESTIMATING GROUP CHAT DAMAGE", "AUDITING YOUR BACKUP PLANS",
    "MEASURING HOW OFTEN 'IT'LL BE FINE' ACTUALLY WORKS", "CALCULATING SPREADSHEET POTENTIAL", "FINALIZING YOUR FORM"
  ],
  fr: [
    "ANALYSE DE TES DÉCISIONS DISCUTABLES", "CALCUL DU CHAOS", "VÉRIFICATION DE TON DERNIER MOT",
    "CONSULTATION DU DÉPARTEMENT JURIDIQUE", "LE DÉPARTEMENT JURIDIQUE A QUITTÉ LE CHAT", "COMPTAGE DE TES ONGLETS MENTAUX",
    "ÉVALUATION DE TA SURVIE PROFESSIONNELLE", "MESURE DE TA CONFIANCE SUSPECTE", "COMPARAISON AVEC UN RATON LAVEUR TRÈS ORGANISÉ",
    "ANALYSE DE TA RELATION AVEC LES DEADLINES", "ESTIMATION DES DÉGÂTS DANS LE GROUPE", "AUDIT DE TES PLANS B",
    "CALCUL DU TAUX DE RÉUSSITE DE « ÇA VA LE FAIRE »", "MESURE DU POTENTIEL TABLEUR", "FINALISATION DE TA FORME"
  ],
  es: [
    "ANALIZANDO TUS DECISIONES CUESTIONABLES", "CALCULANDO EL CAOS", "COMPROBANDO SI ESA ERA TU RESPUESTA FINAL",
    "CONSULTANDO AL DEPARTAMENTO LEGAL", "EL DEPARTAMENTO LEGAL ABANDONÓ EL CHAT", "CONTANDO TUS PESTAÑAS MENTALES",
    "EVALUANDO TU SUPERVIVENCIA PROFESIONAL", "MIDIENDO TU CONFIANZA SOSPECHOSA", "COMPARÁNDOTE CON UN MAPACHE MUY ORGANIZADO",
    "REVISANDO TU RELACIÓN CON LOS PLAZOS", "ESTIMANDO DAÑOS EN EL CHAT GRUPAL", "AUDITANDO TUS PLANES B",
    "CALCULANDO CUÁNTAS VECES 'SALDRÁ BIEN' FUNCIONA", "MIDIENDO POTENCIAL DE HOJA DE CÁLCULO", "FINALIZANDO TU FORMA"
  ],
};

interface AnalyzingScreenProps { locale: LocaleCode; onDone: () => void; }

function pickSteps(messages: string[]): string[] {
  const middle = messages.slice(0, -1).map((message) => ({ message, order: Math.random() })).sort((a, b) => a.order - b.order).slice(0, 4).map(({ message }) => message);
  return [...middle, messages[messages.length - 1]];
}

export function AnalyzingScreen({ locale, onDone }: AnalyzingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => pickSteps(MESSAGE_POOL[locale]), [locale]);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      const timeout = setTimeout(onDone, 650);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setStepIndex((i) => i + 1), 430);
    return () => clearTimeout(timeout);
  }, [stepIndex, steps.length, onDone]);

  return (
    <div className="ff-card ff-analysis-card">
      <div className="ff-eyebrow" style={{ marginBottom: 12 }}>
        {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
      </div>
      <div className="ff-analysis-meter" aria-hidden="true"><span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div>
      <div className="ff-display ff-analysis-message" aria-live="polite">{steps[stepIndex]}</div>
    </div>
  );
}
