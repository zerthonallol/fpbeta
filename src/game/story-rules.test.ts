import { describe, expect, it } from "vitest";
import { availableStoryChoice, canReleaseBear } from "./story-rules";

describe("additional endings", () => {
  it("unlocks the release conversation only after all three records", () => {
    expect(availableStoryChoice("notes", 2, 3)).toBe(false);
    expect(availableStoryChoice("notes", 3, 0)).toBe(true);
  });
  it("unlocks the keeper offer only with three running fuse boxes", () => {
    expect(availableStoryChoice("gens", 3, 2)).toBe(false);
    expect(availableStoryChoice("gens", 0, 3)).toBe(true);
  });
  it("releases Tommy only with the promise, no flashlight, proximity and line of sight", () => {
    expect(canReleaseBear(true, false, 2, true)).toBe(true);
    expect(canReleaseBear(false, false, 2, true)).toBe(false);
    expect(canReleaseBear(true, true, 2, true)).toBe(false);
    expect(canReleaseBear(true, false, 4, true)).toBe(false);
    expect(canReleaseBear(true, false, 2, false)).toBe(false);
  });
});