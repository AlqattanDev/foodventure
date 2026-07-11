/**
 * Mastery progression — pure logic, store-driven, unit-tested.
 *
 * The ladder per dish:
 *   1. Cook guided (book + hints). Two 4★+ guided runs unlock memory mode.
 *   2. Cook from memory (book closes at pot-on, no hints). Two 4★+ memory
 *      runs = MASTERED — the dish counts for the stall/apprentice later.
 */
export interface MasteryState {
  /** 4★+ runs with the guidance on */
  guidedGood: number;
  /** 4★+ runs from memory */
  memoryGood: number;
  mastered: boolean;
}

export type CookMode = "guided" | "memory";

export const FRESH_MASTERY: MasteryState = {
  guidedGood: 0,
  memoryGood: 0,
  mastered: false,
};

export const GUIDED_RUNS_TO_UNLOCK = 2;
export const MEMORY_RUNS_TO_MASTER = 2;
const GOOD_STARS = 4;

/** Can this dish be attempted from memory yet? */
export function memoryUnlocked(m: MasteryState): boolean {
  return m.guidedGood >= GUIDED_RUNS_TO_UNLOCK;
}

/** Fold one finished run into the mastery state. */
export function advanceMastery(
  m: MasteryState,
  mode: CookMode,
  stars: number
): MasteryState {
  if (stars < GOOD_STARS) return m;
  if (mode === "guided") {
    return { ...m, guidedGood: m.guidedGood + 1 };
  }
  const memoryGood = m.memoryGood + 1;
  return { ...m, memoryGood, mastered: memoryGood >= MEMORY_RUNS_TO_MASTER };
}
