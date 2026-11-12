export type Difficulty = "easy" | "normal" | "hard";

export interface DifficultyPreset {
  ru: string;
  en: string;
  ruHint: string;
  enHint: string;
  /** Multiplier for the animatronic's movement speed. */
  speed: number;
  /** Multiplier for how far the animatronic can see. */
  sight: number;
  /** Multiplier for flashlight battery drain. */
  drain: number;
  /** Batteries placed on the map. */
  batteries: number;
}

export const DIFFICULTY: Record<Difficulty, DifficultyPreset> = {
  easy: { ru: "Лёгкая", en: "Easy", ruHint: "Аниматроник медленный, много батареек", enHint: "Slow animatronic, plenty of batteries", speed: 0.75, sight: 0.75, drain: 0.6, batteries: 8 },
  normal: { ru: "Нормальная", en: "Normal", ruHint: "Как задумано", enHint: "As intended", speed: 1, sight: 1, drain: 1, batteries: 6 },
  hard: { ru: "Кошмар", en: "Nightmare", ruHint: "Быстрый, зоркий, батареек мало", enHint: "Fast, sharp-eyed, few batteries", speed: 1.25, sight: 1.3, drain: 1.5, batteries: 3 },
};

export type Cell = [number, number];
const manhattan = (a: Cell, b: Cell) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

/** Picks n cells spread apart: each is at least minDist (manhattan) from the others and from `avoid`. Relaxes the distance if the map is too crowded. */
export function pickSpread(cells: Cell[], n: number, minDist: number, avoid: Cell[] = [], rng = Math.random): Cell[] {
  const pool = [...cells].sort(() => rng() - 0.5);
  const chosen: Cell[] = [];
  for (let d = minDist; chosen.length < n && d >= 0; d--) {
    for (const c of pool) {
      if (chosen.length >= n) break;
      if (chosen.includes(c)) continue;
      if ([...chosen, ...avoid].every((o) => manhattan(o, c) >= d)) chosen.push(c);
    }
  }
  return chosen;
}

/** Random wander target at least minDist away from `from`; falls back to any cell. */
export function pickWander(cells: Cell[], from: Cell, minDist: number, rng = Math.random): Cell {
  const far = cells.filter((c) => manhattan(c, from) >= minDist);
  const list = far.length ? far : cells;
  return list[Math.floor(rng() * list.length)] ?? from;
}
