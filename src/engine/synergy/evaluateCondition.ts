import type { Stats, StatCondition } from "@final-form/shared-types";

export function evaluateCondition(stats: Stats, condition: StatCondition): boolean {
  const value = stats[condition.stat];

  switch (condition.op) {
    case ">":
      return value > condition.value;
    case ">=":
      return value >= condition.value;
    case "<":
      return value < condition.value;
    case "<=":
      return value <= condition.value;
    case "==":
      return value === condition.value;
  }
}
