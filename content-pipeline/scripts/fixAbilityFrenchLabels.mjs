import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(import.meta.dirname, "../../src/data/abilities.json");
const entries = JSON.parse(await readFile(path, "utf8"));

const activities = {
  reading: "Lecture",
  planning: "Planification",
  explaining: "Explication",
  repairing: "Réparation",
  negotiating: "Négociation",
  learning: "Apprentissage",
  organizing: "Organisation",
  adapting: "Adaptation",
  observing: "Observation",
  prioritizing: "Priorisation",
  debugging: "Débogage",
  teaching: "Enseignement",
  listening: "Écoute",
  estimating: "Estimation",
  coordinating: "Coordination",
  simplifying: "Simplification",
  inventing: "Invention",
  recovering: "Récupération",
};

const qualities = {
  instinct: "instinct",
  precision: "précision",
  speed: "vitesse",
  patience: "patience",
  improvisation: "improvisation",
  clarity: "clarté",
  endurance: "endurance",
  timing: "timing",
  intuition: "intuition",
  discipline: "discipline",
};

let changed = 0;
for (const entry of entries) {
  if (!entry.tags?.includes("expanded_v2")) continue;
  const body = entry.id.replace(/^ability_/, "");
  const activityKey = Object.keys(activities).find((key) => body.startsWith(`${key}_`));
  if (!activityKey) throw new Error(`Activité inconnue pour ${entry.id}`);
  const qualityKey = body.slice(activityKey.length + 1);
  if (!qualities[qualityKey]) throw new Error(`Qualité inconnue pour ${entry.id}`);

  const oldName = entry.name?.fr;
  const newName = `${activities[activityKey]} avec ${qualities[qualityKey]}`;
  if (!oldName) throw new Error(`Nom FR manquant pour ${entry.id}`);
  entry.name.fr = newName;

  const oldDescription = entry.description?.fr;
  if (!oldDescription) throw new Error(`Description FR manquante pour ${entry.id}`);
  if (oldDescription.startsWith(`${oldName} `)) {
    entry.description.fr = `${newName}${oldDescription.slice(oldName.length)}`;
  }
  changed += 1;
}

await writeFile(path, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Capacités FR corrigées: ${changed}`);
