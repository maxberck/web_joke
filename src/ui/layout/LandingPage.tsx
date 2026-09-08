import type { LocaleCode } from "@final-form/shared-types";
import { useTranslation } from "../../i18n/useTranslation.js";

interface LandingPageProps {
  locale: LocaleCode;
  onStart: () => void;
}

export function LandingPage({ locale, onStart }: LandingPageProps) {
  const t = useTranslation(locale);

  return (
    <div className="ff-card" style={{ textAlign: "center", padding: "48px 24px" }}>
      <div className="ff-eyebrow" style={{ marginBottom: 12 }}>
        {t("tagline")}
      </div>
      <h1 className="ff-display" style={{ fontSize: 40, marginBottom: 16 }}>
        Final Form
      </h1>
      <button onClick={onStart} className="ff-btn ff-btn--primary" style={{ padding: "16px 40px", fontSize: 16 }}>
        {t("start")}
      </button>
    </div>
  );
}
