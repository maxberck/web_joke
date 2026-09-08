import type { LocaleCode } from "@final-form/shared-types";

export function detectLocale(): LocaleCode {
  if (typeof navigator === "undefined") return "en";

  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("es")) return "es";
  return "en";
}
