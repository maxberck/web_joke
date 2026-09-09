import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dataDir = resolve(root, "src/data");
const readJson = async (name) => JSON.parse(await readFile(resolve(dataDir, name), "utf8"));

const [base, extra, expansion] = await Promise.all([
  readJson("matchBaselines.json"),
  readJson("matchBaselines.extra.json"),
  readJson("matchBaselines.expansion.json"),
]);

const groups = ["careers", "classes", "powers", "weaknesses", "abilities", "workStyles", "animals"];
const merged = {};
for (const group of groups) {
  merged[group] = {
    ...(base[group] ?? {}),
    ...(extra[group] ?? {}),
    ...(expansion[group] ?? {}),
  };

  const entries = await readJson(`${group}.json`);
  for (const entry of entries) {
    const baseline = merged[group][entry.id];
    if (!baseline || !Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) {
      throw new Error(`Baseline historique manquante ou invalide: ${group}.${entry.id}`);
    }
  }
  if (Object.keys(merged[group]).length !== entries.length) {
    throw new Error(`${group}: ${Object.keys(merged[group]).length} baselines pour ${entries.length} entrées canoniques`);
  }
}

await writeFile(resolve(dataDir, "matchBaselines.json"), `${JSON.stringify(merged, null, 2)}\n`, "utf8");
console.log(
  `Baselines historiques fusionnées: ${groups.map((group) => `${group}=${Object.keys(merged[group]).length}`).join(", ")}`,
);
