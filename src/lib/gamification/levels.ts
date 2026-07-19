// Spiritual-growth themed leveling, inspired by Mazmur 1:3 — "seperti pohon
// yang ditanam di tepi aliran air, yang menghasilkan buahnya pada musimnya."
// Points come from the monthly reading challenge (daily reading + streaks);
// the level is derived from lifetime points, never stored separately, so it
// can never drift out of sync.
export type LevelTier = {
  level: number;
  name: string;
  minPoints: number;
  verseRef: string;
};

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, name: "Benih", minPoints: 0, verseRef: "Markus 4:31" },
  { level: 2, name: "Akar", minPoints: 50, verseRef: "Yeremia 17:8" },
  { level: 3, name: "Tunas", minPoints: 150, verseRef: "Yesaya 11:1" },
  { level: 4, name: "Pohon Muda", minPoints: 350, verseRef: "Mazmur 92:13" },
  { level: 5, name: "Pohon Rindang", minPoints: 700, verseRef: "Mazmur 1:3" },
  { level: 6, name: "Pohon Berbuah Lebat", minPoints: 1500, verseRef: "Yohanes 15:5" },
];

export function getLevelForPoints(points: number): LevelTier {
  let current = LEVEL_TIERS[0];
  for (const tier of LEVEL_TIERS) {
    if (points >= tier.minPoints) current = tier;
  }
  return current;
}

export function getNextTier(points: number): LevelTier | null {
  const current = getLevelForPoints(points);
  const next = LEVEL_TIERS.find((t) => t.level === current.level + 1);
  return next ?? null;
}

export function pointsToNextTier(points: number): number | null {
  const next = getNextTier(points);
  return next ? next.minPoints - points : null;
}
