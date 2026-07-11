import { describe, it, expect } from "vitest";
import {
  FRESH_MASTERY,
  advanceMastery,
  memoryUnlocked,
  GUIDED_RUNS_TO_UNLOCK,
  MEMORY_RUNS_TO_MASTER,
} from "./mastery";

describe("mastery ladder", () => {
  it("bad runs never advance anything", () => {
    let m = FRESH_MASTERY;
    for (const stars of [0, 1, 2, 3]) {
      m = advanceMastery(m, "guided", stars);
      m = advanceMastery(m, "memory", stars);
    }
    expect(m).toEqual(FRESH_MASTERY);
    expect(memoryUnlocked(m)).toBe(false);
  });

  it("two good guided runs unlock memory mode", () => {
    let m = FRESH_MASTERY;
    for (let i = 0; i < GUIDED_RUNS_TO_UNLOCK; i++) {
      expect(memoryUnlocked(m)).toBe(false);
      m = advanceMastery(m, "guided", 4);
    }
    expect(memoryUnlocked(m)).toBe(true);
    expect(m.mastered).toBe(false);
  });

  it("good memory runs master the dish; guided runs never do", () => {
    let m = FRESH_MASTERY;
    for (let i = 0; i < 10; i++) m = advanceMastery(m, "guided", 5);
    expect(m.mastered).toBe(false);
    for (let i = 0; i < MEMORY_RUNS_TO_MASTER; i++) {
      expect(m.mastered).toBe(false);
      m = advanceMastery(m, "memory", 5);
    }
    expect(m.mastered).toBe(true);
  });
});
