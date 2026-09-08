import { hashSeed } from "./random.ts";

export function createFormId(seed: number, answerEffects: unknown[]): string {
  const fingerprint = JSON.stringify(answerEffects);
  const first = hashSeed(seed, fingerprint).toString(16).padStart(8, "0").slice(0, 4).toUpperCase();
  const second = hashSeed(seed ^ 0x9e3779b9, fingerprint).toString(16).padStart(8, "0").slice(0, 4).toUpperCase();
  return `${first}-${second}`;
}
