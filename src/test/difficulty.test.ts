import { describe, expect, it } from "vitest";
import { DIFFICULTY, pickSpread, pickWander, type Cell } from "@/game/difficulty";

const grid: Cell[] = [];
for (let c = 0; c < 20; c++) for (let r = 0; r < 20; r++) grid.push([c, r]);
const d = (a: Cell, b: Cell) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

describe("difficulty", () => {
  it("hard is faster and has fewer batteries than easy", () => {
    expect(DIFFICULTY.hard.speed).toBeGreaterThan(DIFFICULTY.easy.speed);
    expect(DIFFICULTY.hard.batteries).toBeLessThan(DIFFICULTY.easy.batteries);
  });
  it("items are spread apart", () => {
    const picked = pickSpread(grid, 6, 5);
    expect(picked).toHaveLength(6);
    for (const a of picked) for (const b of picked) if (a !== b) expect(d(a, b)).toBeGreaterThanOrEqual(5);
  });
  it("still returns n cells when the map is crowded", () => {
    expect(pickSpread(grid.slice(0, 5), 5, 50)).toHaveLength(5);
  });
  it("wander target is far from the bear", () => {
    for (let i = 0; i < 50; i++) expect(d(pickWander(grid, [0, 0], 8), [0, 0])).toBeGreaterThanOrEqual(8);
  });
});
