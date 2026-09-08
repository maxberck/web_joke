import type { FinalForm, LocaleCode } from "@final-form/shared-types";
import { STAT_KEYS } from "@final-form/shared-types";
import { contentPack } from "../../data/index.js";
import { StatBar } from "./StatBar.js";
import {
  resolveCareer,
  resolveClass,
  resolvePower,
  resolveWeakness,
  resolveAnimal,
  resolveWorkStyle,
  resolveAlignment,
} from "./resolveContent.js";
import { useTranslation, useStatLabel } from "../../i18n/useTranslation.js";

interface FinalFormCardProps {
  result: FinalForm;
  locale: LocaleCode;
  onTryAgain: () => void;
}

export function FinalFormCard({ result, locale, onTryAgain }: FinalFormCardProps) {
  const t = useTranslation(locale);
  const statLabel = useStatLabel(locale);

  const career = resolveCareer(contentPack, result.careerId);
  const classProfile = resolveClass(contentPack, result.classId);
  const power = resolvePower(contentPack, result.powerId);
  const weakness = resolveWeakness(contentPack, result.weaknessId);
  const animal = resolveAnimal(contentPack, result.animalId);
  const workStyle = resolveWorkStyle(contentPack, result.workStyleId);
  const alignment = resolveAlignment(contentPack, result.alignmentId);

  const lifeExpectancyUnit: Record<LocaleCode, string> = { en: "yrs", fr: "ans", es: "años" };
  const worthDisplay =
    result.worth < 0
      ? `-$${Math.abs(result.worth).toLocaleString()}`
      : `$${result.worth.toLocaleString()}`;

  return (
    <div className="ff-card">
      <div className="ff-eyebrow" style={{ textAlign: "center", marginBottom: 6 }}>
        {t("yourFinalForm")}
      </div>
      <h1 className="ff-display" style={{ fontSize: 30, textAlign: "center", marginTop: 0, marginBottom: 20 }}>
        {classProfile.name[locale]}
      </h1>

      {/* Signature : badge rareté en burst avec trame de points (halftone) */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div className="ff-halftone">
          <div className="ff-burst">
            <div className="ff-mono" style={{ fontSize: 11, opacity: 0.85 }}>
              {t("rarity")}
            </div>
            <div className="ff-display" style={{ fontSize: 20 }}>
              1 / {result.rarity.oneInX.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="ff-info-grid" style={{ marginBottom: 24 }}>
        <InfoCell label={t("career")} value={career.name[locale]} />
        <InfoCell label={t("worth")} value={worthDisplay} mono />
        <InfoCell label={t("animal")} value={animal.name[locale]} />
        <InfoCell label={t("threatLevel")} value={`${result.threatLevel} / 10`} mono />
        <InfoCell label={t("lifeExpectancy")} value={`${result.lifeExpectancyYears} ${lifeExpectancyUnit[locale]}`} mono />
        <InfoCell label={t("alignment")} value={alignment.name[locale]} />
        <InfoCell label={t("power")} value={power.text[locale]} span2 />
        <InfoCell label={t("weakness")} value={weakness.text[locale]} span2 />
        <InfoCell label={t("workStyle")} value={workStyle.text[locale]} span2 />
      </div>

      <div style={{ marginBottom: 24 }}>
        {STAT_KEYS.map((key) => (
          <StatBar key={key} label={statLabel(key)} value={result.coreStats[key]} />
        ))}
      </div>

      <button onClick={onTryAgain} className="ff-btn ff-btn--primary" style={{ width: "100%" }}>
        {t("tryAgain")}
      </button>
    </div>
  );
}

function InfoCell({
  label,
  value,
  mono = false,
  span2 = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  span2?: boolean;
}) {
  return (
    <div className="ff-info-cell" style={span2 ? { gridColumn: "span 2" } : undefined}>
      <div className="ff-info-label">{label}</div>
      <div className={`ff-info-value${mono ? " ff-mono" : ""}`}>{value}</div>
    </div>
  );
}
