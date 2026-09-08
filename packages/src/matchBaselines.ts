export interface MatchBaseline {
  mean: number;
  std: number;
}

export type MatchBaselineSet = Record<string, MatchBaseline>;

export interface MatchBaselines {
  careers: MatchBaselineSet;
  classes: MatchBaselineSet;
  animals: MatchBaselineSet;
  powers: MatchBaselineSet;
  weaknesses: MatchBaselineSet;
  abilities: MatchBaselineSet;
  workStyles: MatchBaselineSet;
}
