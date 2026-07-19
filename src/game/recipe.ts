/**
 * V2 recipe engine — the real Halwa Bahrainiya process as a staged cook.
 * Pure logic: no React, no Three. The cook UI collects a summary of what the
 * player actually did during each stage and this module scores it, so unit
 * tests exercise the exact production path.
 *
 * Stage kinds map 1:1 to the real process (see PLAN.md Part A):
 *   heat-hold        — bring the syrup to a simmer and hold it
 *   pour-stir        — pour ingredients, then stir until smooth
 *   pour-while-stir  — slowly pour the slurry into the syrup while stirring
 *   stir-batches     — the long stir; add ghee batch by batch on the cue
 *   timed-add        — spices in their window
 *   finish-call      — the player calls doneness
 */
import { clamp01 } from "./scoring";

export type StepKind =
  | "heat-hold"
  | "pour-stir"
  | "pour-while-stir"
  | "stir-batches"
  | "timed-add"
  | "finish-call";

export interface PourSpec {
  key: string;
  label: string;
  emoji: string;
  color: string;
  /** display amount for the cookbook, e.g. "2 cups" */
  amount: string;
  /** target pour 0..1 of the gauge */
  target: number;
  tolerance: number;
}

interface StepBase {
  id: string;
  kind: StepKind;
  title: string;
  /** guided-mode line shown live during the step */
  instruction: string;
  /** cookbook text — the real-world why/how of this step */
  edu: string;
  tip?: string;
  /** relative weight in the final rating (default 1) */
  weight?: number;
}

export interface HeatHoldStep extends StepBase {
  kind: "heat-hold";
  /** heat band 0..1 the player must reach and hold */
  band: [number, number];
  holdSeconds: number;
}

export interface PourStirStep extends StepBase {
  kind: "pour-stir";
  pours: PourSpec[];
  /** seconds of on-tempo stirring needed for a smooth mix */
  smoothSeconds: number;
}

export interface PourWhileStirStep extends StepBase {
  kind: "pour-while-stir";
}

export interface BatchCue {
  key: string;
  label: string;
  emoji: string;
  color: string;
  amount: string;
}

export interface StirBatchesStep extends StepBase {
  kind: "stir-batches";
  /** the ghee ladles — cued when the sheen dulls */
  batches: BatchCue[];
  durationSeconds: number;
}

export interface TimedAdd {
  key: string;
  label: string;
  emoji: string;
  color: string;
  amount: string;
}

export interface TimedAddStep extends StepBase {
  kind: "timed-add";
  adds: TimedAdd[];
}

export interface FinishCallStep extends StepBase {
  kind: "finish-call";
  /** doneness 0..1 window in which calling it is perfect */
  idealWindow: [number, number];
}

export type RecipeStep =
  | HeatHoldStep
  | PourStirStep
  | PourWhileStirStep
  | StirBatchesStep
  | TimedAddStep
  | FinishCallStep;

/* ---------------- per-stage summaries (what the UI measured) ------------- */

export interface HeatHoldSummary {
  kind: "heat-hold";
  /** seconds spent inside the band */
  timeInBand: number;
  /** seconds spent above the band (scorch risk) */
  timeAbove: number;
}

export interface PourStirSummary {
  kind: "pour-stir";
  /** final gauge value per poured ingredient */
  pourAmounts: Record<string, number>;
  /** seconds of on-tempo stirring achieved */
  smoothSeconds: number;
}

export interface PourWhileStirSummary {
  kind: "pour-while-stir";
  /** fraction of the pour spent pouring too fast (lumps) 0..1 */
  rushedFrac: number;
  /** fraction of the pour spent not stirring (sticks) 0..1 */
  stalledFrac: number;
}

export interface StirBatchesSummary {
  kind: "stir-batches";
  /** avg on-rhythm quality while stirring 0..1 */
  smoothness: number;
  /** ghee cues answered in time */
  batchesHit: number;
  /** scorch accumulated this stage 0..1 */
  burn: number;
}

export interface TimedAddSummary {
  kind: "timed-add";
  hits: number;
}

export interface FinishCallSummary {
  kind: "finish-call";
  /** doneness 0..1 at the moment the player called it */
  calledAt: number;
}

export type StepSummary =
  | HeatHoldSummary
  | PourStirSummary
  | PourWhileStirSummary
  | StirBatchesSummary
  | TimedAddSummary
  | FinishCallSummary;

/* ---------------- scorers ---------------- */

import { scorePour } from "./scoring";

/** Score one stage 0..1 from what the player actually did. */
export function scoreStep(step: RecipeStep, summary: StepSummary): number {
  if (step.kind !== summary.kind) {
    throw new Error(`summary kind ${summary.kind} does not match step ${step.kind}`);
  }
  switch (step.kind) {
    case "heat-hold": {
      const s = summary as HeatHoldSummary;
      const held = clamp01(s.timeInBand / step.holdSeconds);
      // hovering above the band cooks the sugar too hard — costs up to half
      const scorch = clamp01(s.timeAbove / step.holdSeconds);
      return clamp01(held * (1 - scorch * 0.5));
    }
    case "pour-stir": {
      const s = summary as PourStirSummary;
      const pourAvg =
        step.pours.reduce(
          (acc, p) =>
            acc + scorePour({ target: p.target, tolerance: p.tolerance }, s.pourAmounts[p.key] ?? 0),
          0
        ) / Math.max(1, step.pours.length);
      const smooth = clamp01(s.smoothSeconds / step.smoothSeconds);
      return clamp01(pourAvg * 0.6 + smooth * 0.4);
    }
    case "pour-while-stir": {
      const s = summary as PourWhileStirSummary;
      // rushing makes lumps, stalling makes it stick — both eat the score
      return clamp01(1 - s.rushedFrac * 0.7 - s.stalledFrac * 0.7);
    }
    case "stir-batches": {
      const s = summary as StirBatchesSummary;
      const batches = step.batches.length
        ? s.batchesHit / step.batches.length
        : 1;
      return clamp01(
        (s.smoothness * 0.55 + batches * 0.45) * (1 - s.burn * 0.85)
      );
    }
    case "timed-add": {
      const s = summary as TimedAddSummary;
      return step.adds.length ? clamp01(s.hits / step.adds.length) : 1;
    }
    case "finish-call": {
      const s = summary as FinishCallSummary;
      const [lo, hi] = step.idealWindow;
      if (s.calledAt >= lo && s.calledAt <= hi) return 1;
      // early = pale and loose, late = dark and rubbery; falloff over ~0.15
      const d = s.calledAt < lo ? lo - s.calledAt : s.calledAt - hi;
      return clamp01(1 - d / 0.15);
    }
  }
}

/* ---------------- run aggregation ---------------- */

export interface StepResult {
  stepId: string;
  title: string;
  score: number;
  weight: number;
}

export interface RunRating {
  /** weighted overall 0..1 */
  overall: number;
  /** 0 stars only when burnt */
  stars: number;
  burnt: boolean;
  results: StepResult[];
  /** the stage that cost the most (null on a clean 5★) */
  worst: StepResult | null;
}

/**
 * Combine per-stage results into the final rating.
 * `burn` is the total scorch 0..1 across the cook; past 0.85 the batch is ruined.
 */
export function rateRun(
  steps: RecipeStep[],
  summaries: StepSummary[],
  burn: number
): RunRating {
  if (steps.length !== summaries.length) {
    throw new Error(
      `expected ${steps.length} summaries, got ${summaries.length}`
    );
  }
  const results: StepResult[] = steps.map((step, i) => ({
    stepId: step.id,
    title: step.title,
    score: scoreStep(step, summaries[i]),
    weight: step.weight ?? 1,
  }));
  const totalW = results.reduce((a, r) => a + r.weight, 0);
  const overall = clamp01(
    results.reduce((a, r) => a + r.score * r.weight, 0) / Math.max(1, totalW)
  );

  const burnt = burn >= 0.85;
  let stars = burnt
    ? 0
    : overall >= 0.9
      ? 5
      : overall >= 0.75
        ? 4
        : overall >= 0.58
          ? 3
          : overall >= 0.4
            ? 2
            : 1;
  // a real recipe has no skippable step: ruining any single stage caps the
  // rating no matter how clean the rest was
  const floor = Math.min(...results.map((r) => r.score));
  if (!burnt && floor < 0.15) stars = Math.min(stars, 2);
  else if (!burnt && floor < 0.35) stars = Math.min(stars, 3);

  const worst =
    stars >= 5
      ? null
      : results.reduce<StepResult | null>(
          (w, r) => (w === null || r.score < w.score ? r : w),
          null
        );

  return { overall, stars, burnt, results, worst };
}
