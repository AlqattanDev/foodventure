import { describe, it, expect } from "vitest";
import { MILESTONES, claimable, type BizSnapshot } from "./milestones";
import { FRESH_MASTERY } from "./mastery";

const MASTERED = { guidedGood: 2, memoryGood: 2, mastered: true };

const base: BizSnapshot = {
  opened: false,
  lifetimeServed: 0,
  bestDayNet: 0,
  servers: 0,
  chefs: 0,
  floorTier: 0,
  reputation: 0,
  mastery: { classic: FRESH_MASTERY, saffron: FRESH_MASTERY, royal: FRESH_MASTERY },
};

describe("milestones", () => {
  it("a fresh business has achieved nothing", () => {
    expect(claimable(base, [])).toEqual([]);
  });

  it("each milestone flips on its condition", () => {
    const by = Object.fromEntries(MILESTONES.map((m) => [m.id, m]));
    expect(by["first-batch"].achieved({ ...base, opened: true })).toBe(true);
    expect(by["serve-50"].achieved({ ...base, lifetimeServed: 50 })).toBe(true);
    expect(by["serve-50"].achieved({ ...base, lifetimeServed: 49 })).toBe(false);
    expect(by["profit-100"].achieved({ ...base, bestDayNet: 120 })).toBe(true);
    expect(by["majlis"].achieved({ ...base, floorTier: 1 })).toBe(true);
    expect(by["full-staff"].achieved({ ...base, servers: 3, chefs: 2 })).toBe(true);
    expect(by["full-staff"].achieved({ ...base, servers: 3, chefs: 1 })).toBe(false);
    expect(by["rep-top"].achieved({ ...base, reputation: 4.9 })).toBe(true);
    expect(
      by["master-all"].achieved({
        ...base,
        mastery: { classic: MASTERED, saffron: MASTERED, royal: MASTERED },
      })
    ).toBe(true);
  });

  it("claimed milestones stop being claimable", () => {
    const s = { ...base, opened: true };
    expect(claimable(s, []).map((m) => m.id)).toContain("first-batch");
    expect(claimable(s, ["first-batch"])).toEqual([]);
  });
});
