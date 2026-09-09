import assert from "node:assert/strict";
import { computeHybridRarity } from "../../src/engine/result/computeHybridRarity.ts";

const common = {
  probabilities: [0.08, 0.07, 0.06, 0.08, 0.07, 0.06, 0.08, 0.12],
  synergyScore: 4,
  extremityScore: 5,
};
const rare = {
  probabilities: [0.01, 0.015, 0.012, 0.02, 0.018, 0.014, 0.016, 0.04],
  synergyScore: 4,
  extremityScore: 5,
};
const behavioral = {
  probabilities: common.probabilities,
  synergyScore: 30,
  extremityScore: 28,
};

const commonResult = computeHybridRarity(common);
const rareResult = computeHybridRarity(rare);
const behavioralResult = computeHybridRarity(behavioral);

assert.ok(commonResult.oneInX >= 25, "la rareté minimale doit rester à 1/25");
assert.ok(rareResult.oneInX > commonResult.oneInX, "un profil moins fréquent doit être plus rare");
assert.ok(behavioralResult.oneInX > commonResult.oneInX, "les synergies et l'extrémité doivent augmenter la rareté");
assert.ok(rareResult.oneInX <= 1_000_000_000, "la rareté doit être plafonnée");
assert.ok(Number.isFinite(rareResult.appearanceOneInX) && rareResult.appearanceOneInX > 0);
assert.ok(Number.isFinite(rareResult.behavioralMultiplier) && rareResult.behavioralMultiplier >= 1);

const observed = new Set();
for (let i = 0; i < 25; i += 1) {
  const p = 0.015 + i * 0.0013;
  observed.add(computeHybridRarity({
    probabilities: [p, p * 1.1, p * 0.9, p * 1.2, p, p * 0.95, p * 1.05, p * 1.3],
    synergyScore: i,
    extremityScore: i / 2,
  }).oneInX);
}
assert.ok(observed.size >= 15, `la rareté doit être granulaire, seulement ${observed.size} valeurs observées`);

console.log(`Hybrid rarity OK: ${observed.size} valeurs distinctes sur 25 profils de test`);
