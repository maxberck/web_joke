import { useState } from "react";
import type { FinalForm, LocaleCode, LocalizedText, StatKey } from "@final-form/shared-types";
import { STAT_KEYS } from "@final-form/shared-types";
import { contentPack } from "../../data/index.js";
import { StatBar } from "./StatBar.js";
import { resolveCareer, resolveClass, resolvePower, resolveWeakness, resolveAnimal, resolveAbility, resolveWorkStyle, resolveAlignment } from "./resolveContent.js";
import { useTranslation, useStatLabel } from "../../i18n/useTranslation.js";

interface FinalFormCardProps { result: FinalForm; locale: LocaleCode; onTryAgain: () => void; }
function localizedLabel(entry: { name?: LocalizedText; text?: LocalizedText }, locale: LocaleCode, context: string): string {
  const label = entry.name ?? entry.text;
  if (!label) throw new Error(`FinalFormCard: libellé manquant pour ${context}`);
  return label[locale];
}
function localizedDescription(entry: { description?: LocalizedText }, locale: LocaleCode): string {
  return entry.description?.[locale] ?? "";
}

type RarityTier = "normal" | "rare" | "epic" | "legendary";
type VerdictKey = "chaos" | "discipline" | "humor" | "intelligence" | "empathy" | "luck";
type CopyLabels = {
  ability: string; aura: string; fortune: string; synergies: string; derived: string; formId: string;
  details: string; hideDetails: string; share: string; copied: string; profile: string;
  rarityBreakdown: string; appearance: string; synergyScore: string; extremityScore: string; behaviorMultiplier: string;
  normal: string; rare: string; epic: string; legendary: string;
};

const labels: Record<LocaleCode, CopyLabels> = {
  en: { ability: "Special ability", aura: "Aura", fortune: "Fortune", synergies: "Activated synergies", derived: "Derived stats", formId: "Form ID", details: "See full analysis", hideDetails: "Hide full analysis", share: "Share my form", copied: "Result copied", profile: "Your suspiciously accurate summary", rarityBreakdown: "Why this form is rare", appearance: "Estimated occurrence", synergyScore: "Synergy rarity", extremityScore: "Stat extremity", behaviorMultiplier: "Behavior multiplier", normal: "Uncommon specimen", rare: "Rare form detected", epic: "Statistically concerning", legendary: "This should not have happened" },
  fr: { ability: "Capacité spéciale", aura: "Aura", fortune: "Fortune", synergies: "Synergies activées", derived: "Statistiques dérivées", formId: "ID de forme", details: "Voir l'analyse complète", hideDetails: "Masquer l'analyse", share: "Partager ma forme", copied: "Résultat copié", profile: "Ton résumé étrangement précis", rarityBreakdown: "Pourquoi cette forme est rare", appearance: "Occurrence estimée", synergyScore: "Rareté des synergies", extremityScore: "Extrémité des stats", behaviorMultiplier: "Multiplicateur comportemental", normal: "Spécimen peu commun", rare: "Forme rare détectée", epic: "Statistiquement inquiétant", legendary: "Ceci n'aurait pas dû arriver" },
  es: { ability: "Habilidad especial", aura: "Aura", fortune: "Fortuna", synergies: "Sinergias activadas", derived: "Estadísticas derivadas", formId: "ID de forma", details: "Ver análisis completo", hideDetails: "Ocultar análisis", share: "Compartir mi forma", copied: "Resultado copiado", profile: "Tu resumen sospechosamente preciso", rarityBreakdown: "Por qué esta forma es rara", appearance: "Aparición estimada", synergyScore: "Rareza de sinergias", extremityScore: "Extremidad de estadísticas", behaviorMultiplier: "Multiplicador conductual", normal: "Espécimen poco común", rare: "Forma rara detectada", epic: "Estadísticamente preocupante", legendary: "Esto no debería haber ocurrido" },
};

const verdicts: Record<LocaleCode, Record<VerdictKey | "default", string>> = {
  en: { chaos: "You can turn a minor inconvenience into a three-act story, then somehow solve it at the last minute.", discipline: "You have a plan, a backup plan, and a folder containing the plan nobody was supposed to know about.", humor: "Your primary defense mechanism is making the situation funny before anyone can ask if you're okay.", intelligence: "You solve problems suspiciously fast, then make everyone nervous by saying you were 'just guessing'.", empathy: "You notice everyone's mood immediately. This is useful until the group chat becomes your unpaid second job.", luck: "Your strategy contains several gaps. Luck keeps filing the paperwork for you.", default: "You look functional from a distance. Up close, the system is mostly confidence, timing, and one very specific coping mechanism." },
  fr: { chaos: "Tu peux transformer un petit contretemps en histoire en trois actes, puis régler le problème au dernier moment comme si tout était prévu.", discipline: "Tu as un plan, un plan B et probablement un dossier contenant le plan que personne n'était censé connaître.", humor: "Ton principal mécanisme de défense consiste à rendre la situation drôle avant que quelqu'un demande si ça va.", intelligence: "Tu règles les problèmes beaucoup trop vite, puis tu inquiètes tout le monde en disant que tu as « juste essayé un truc ».", empathy: "Tu détectes immédiatement l'humeur de tout le monde. Pratique, jusqu'à ce que le groupe devienne ton deuxième travail non payé.", luck: "Ta stratégie comporte quelques trous. Heureusement, ta chance remplit les formulaires à ta place.", default: "De loin, tu sembles parfaitement fonctionnel. De près, le système repose surtout sur la confiance, le timing et un mécanisme de survie très spécifique." },
  es: { chaos: "Puedes convertir un pequeño problema en una historia de tres actos y aun así resolverlo en el último minuto.", discipline: "Tienes un plan, un plan B y probablemente una carpeta con el plan que nadie debía conocer.", humor: "Tu principal mecanismo de defensa es hacer divertida la situación antes de que alguien pregunte si estás bien.", intelligence: "Resuelves problemas sospechosamente rápido y luego inquietas a todos diciendo que solo estabas probando algo.", empathy: "Detectas el estado de ánimo de todos al instante. Útil hasta que el chat grupal se convierte en tu segundo trabajo no remunerado.", luck: "Tu estrategia tiene varios agujeros. La suerte sigue haciendo el papeleo por ti.", default: "De lejos pareces perfectamente funcional. De cerca, el sistema funciona con confianza, timing y un mecanismo de supervivencia muy específico." },
};

const verdictKeys: readonly VerdictKey[] = ["chaos", "discipline", "humor", "intelligence", "empathy", "luck"];
function getVerdict(result: FinalForm, locale: LocaleCode): string {
  const strongest = verdictKeys.reduce<VerdictKey>((best, key) => result.coreStats[key] > result.coreStats[best] ? key : best, "chaos");
  return verdicts[locale][strongest];
}
function rarityTier(oneInX: number): RarityTier { if (oneInX >= 1_000_000) return "legendary"; if (oneInX >= 100_000) return "epic"; if (oneInX >= 1_000) return "rare"; return "normal"; }
function humanizeTag(tag: string): string { return tag.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export function FinalFormCard({ result, locale, onTryAgain }: FinalFormCardProps) {
  const t = useTranslation(locale); const statLabel = useStatLabel(locale); const copy = labels[locale];
  const [showDetails, setShowDetails] = useState(false); const [shared, setShared] = useState(false);
  const career = resolveCareer(contentPack, result.careerId); const classProfile = resolveClass(contentPack, result.classId);
  const power = resolvePower(contentPack, result.powerId); const weakness = resolveWeakness(contentPack, result.weaknessId);
  const animal = resolveAnimal(contentPack, result.animalId); const ability = resolveAbility(contentPack, result.abilityId);
  const workStyle = resolveWorkStyle(contentPack, result.workStyleId); const alignment = resolveAlignment(contentPack, result.alignmentId);
  const className = localizedLabel(classProfile, locale, "class"); const tier = rarityTier(result.rarity.oneInX);
  const animalName = localizedLabel(animal, locale, "animal"); const animalDescription = localizedDescription(animal, locale);
  const lifeExpectancyUnit: Record<LocaleCode, string> = { en: "yrs", fr: "ans", es: "años" };
  const worthDisplay = result.worth < 0 ? `-$${Math.abs(result.worth).toLocaleString()}` : `$${result.worth.toLocaleString()}`;
  const appearanceOneInX = Math.max(25, Math.round(result.rarity.appearanceOneInX));
  const shareText = `${className} — 1 / ${result.rarity.oneInX.toLocaleString()}\n${localizedLabel(career, locale, "career")} · ${localizedLabel(power, locale, "power")}\n${getVerdict(result, locale)}`;
  async function shareResult() { try { if (navigator.share) await navigator.share({ title: className, text: shareText }); else await navigator.clipboard.writeText(shareText); setShared(true); setTimeout(() => setShared(false), 1800); } catch { /* partage annulé */ } }

  return <div className={`ff-card ff-result-card ff-result-card--${tier}`}>
    <header className="ff-result-hero">
      <div className="ff-eyebrow">{t("yourFinalForm")}</div>
      <div className="ff-rarity-kicker">{copy[tier]}</div>
      <h1 className="ff-display ff-result-title">{className}</h1>
      <div className="ff-halftone"><div className="ff-burst"><div className="ff-mono ff-rarity-label">{t("rarity")}</div><div className="ff-display ff-rarity-value">1 / {result.rarity.oneInX.toLocaleString()}</div></div></div>
    </header>

    <div className="ff-vitals" aria-label="Key result metrics">
      <VitalCard label={copy.fortune} value={worthDisplay} />
      <VitalCard label={copy.aura} value={`${Math.round(result.auraPercent)}%`} />
      <VitalCard label={t("lifeExpectancy")} value={`${result.lifeExpectancyYears} ${lifeExpectancyUnit[locale]}`} />
    </div>

    <section className="ff-verdict"><div className="ff-eyebrow">{copy.profile}</div><p>{getVerdict(result, locale)}</p></section>

    <section className="ff-animal-card">
      <div className="ff-eyebrow">{t("animal")}</div>
      <div className="ff-display ff-animal-name">{animalName}</div>
      {animalDescription && <p>{animalDescription}</p>}
    </section>

    <div className="ff-info-grid ff-result-summary">
      <InfoCell label={t("career")} value={localizedLabel(career, locale, "career")} span2 />
      <InfoCell label={t("power")} value={localizedLabel(power, locale, "power")} span2 />
      <InfoCell label={t("weakness")} value={localizedLabel(weakness, locale, "weakness")} span2 />
      <InfoCell label={t("workStyle")} value={localizedLabel(workStyle, locale, "workStyle")} span2 />
      <InfoCell label={copy.ability} value={localizedLabel(ability, locale, "ability")} span2 />
    </div>

    {result.matchedRuleTags.length > 0 && <section className="ff-synergy-section"><div className="ff-eyebrow">{copy.synergies}</div><div className="ff-badges">{result.matchedRuleTags.map((tag) => <span key={tag} className="ff-badge">{humanizeTag(tag)}</span>)}</div></section>}

    <button onClick={() => setShowDetails((value) => !value)} className="ff-btn ff-btn--block ff-details-toggle" aria-expanded={showDetails}>{showDetails ? copy.hideDetails : copy.details}</button>
    {showDetails && <div className="ff-details-panel">
      <div className="ff-info-grid">
        <InfoCell label={t("threatLevel")} value={`${result.threatLevel} / 10`} mono />
        <InfoCell label={t("alignment")} value={localizedLabel(alignment, locale, "alignment")} />
      </div>
      <section className="ff-rarity-breakdown">
        <div className="ff-eyebrow">{copy.rarityBreakdown}</div>
        <div className="ff-info-grid">
          <InfoCell label={copy.appearance} value={`1 / ${appearanceOneInX.toLocaleString()}`} mono />
          <InfoCell label={copy.behaviorMultiplier} value={`×${result.rarity.behavioralMultiplier.toFixed(3)}`} mono />
          <InfoCell label={copy.synergyScore} value={result.rarity.synergyScore.toFixed(1)} mono />
          <InfoCell label={copy.extremityScore} value={result.rarity.extremityScore.toFixed(1)} mono />
        </div>
      </section>
      <div className="ff-stats-panel">{STAT_KEYS.map((key) => <StatBar key={key} label={statLabel(key)} value={result.coreStats[key]} />)}</div>
      {Object.keys(result.derivedStats).length > 0 && <section><div className="ff-eyebrow">{copy.derived}</div><div className="ff-info-grid">{Object.entries(result.derivedStats).map(([key, value]) => <InfoCell key={key} label={key} value={Number.isFinite(value) ? value.toFixed(1) : String(value)} mono />)}</div></section>}
      {result.formId && <div className="ff-mono ff-form-id">{copy.formId}: {result.formId}</div>}
    </div>}
    <div className="ff-result-actions"><button onClick={shareResult} className="ff-btn ff-btn--share">{shared ? copy.copied : copy.share}</button><button onClick={onTryAgain} className="ff-btn ff-btn--primary">{t("tryAgain")}</button></div>
  </div>;
}
function VitalCard({ label, value }: { label: string; value: string }) { return <div className="ff-vital-card"><div className="ff-vital-label">{label}</div><div className="ff-display ff-vital-value">{value}</div></div>; }
function InfoCell({ label, value, mono = false, span2 = false }: { label: string; value: string; mono?: boolean; span2?: boolean }) { return <div className="ff-info-cell" style={span2 ? { gridColumn: "span 2" } : undefined}><div className="ff-info-label">{label}</div><div className={`ff-info-value${mono ? " ff-mono" : ""}`}>{value}</div></div>; }
