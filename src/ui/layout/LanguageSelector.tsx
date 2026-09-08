import type { LocaleCode } from "@final-form/shared-types";

interface LanguageSelectorProps {
  locale: LocaleCode;
  onChange: (locale: LocaleCode) => void;
}

const OPTIONS: { code: LocaleCode; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
];

export function LanguageSelector({ locale, onChange }: LanguageSelectorProps) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          onClick={() => onChange(option.code)}
          className={`ff-pill${option.code === locale ? " ff-pill--active" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
