import { describe, it, expect } from "vitest";
import {
  scoreStep,
  rateRun,
  type RecipeStep,
  type StepSummary,
  type HeatHoldStep,
  type PourStirStep,
  type PourWhileStirStep,
  type StirBatchesStep,
  type TimedAddStep,
  type FinishCallStep,
} from "./recipe";
import { RECIPES } from "../data/recipes";
import { DISH_ORDER } from "../data/dishes";

const heatHold: HeatHoldStep = {
  id: "syrup", kind: "heat-hold", title: "The syrup",
  instruction: "", edu: "", band: [0.45, 0.7], holdSeconds: 6,
};
const pourStir: PourStirStep = {
  id: "slurry", kind: "pour-stir", title: "The slurry",
  instruction: "", edu: "", smoothSeconds: 4,
  pours: [
    { key: "starch", label: "Cornstarch", emoji: "🌾", color: "#fff", amount: "1 cup", target: 0.6, tolerance: 0.14 },
    { key: "water", label: "Cold water", emoji: "💧", color: "#fff", amount: "2 cups", target: 0.65, tolerance: 0.14 },
  ],
};
const combine: PourWhileStirStep = {
  id: "combine", kind: "pour-while-stir", title: "Marrying them",
  instruction: "", edu: "", pourSeconds: 6, weight: 1.25,
};
const longStir: StirBatchesStep = {
  id: "longstir", kind: "stir-batches", title: "The long stir",
  instruction: "", edu: "", durationSeconds: 24, weight: 2,
  batches: [
    { key: "ghee1", label: "Ghee 1", emoji: "🧈", color: "#fff", amount: "¼ cup" },
    { key: "ghee2", label: "Ghee 2", emoji: "🧈", color: "#fff", amount: "¼ cup" },
    { key: "ghee3", label: "Ghee 3", emoji: "🧈", color: "#fff", amount: "¼ cup" },
  ],
};
const timedAdd: TimedAddStep = {
  id: "spices", kind: "timed-add", title: "The perfume",
  instruction: "", edu: "",
  adds: [
    { key: "cardamom", label: "Cardamom", emoji: "🫛", color: "#fff", amount: "1 tsp" },
    { key: "rose", label: "Rose water", emoji: "🌹", color: "#fff", amount: "2 tbsp" },
  ],
};
const finishCall: FinishCallStep = {
  id: "finish", kind: "finish-call", title: "Calling it",
  instruction: "", edu: "", idealWindow: [0.7, 0.9], weight: 1.5,
};

describe("scoreStep: heat-hold", () => {
  it("full hold in band with no scorch is perfect", () => {
    expect(scoreStep(heatHold, { kind: "heat-hold", timeInBand: 6, timeAbove: 0 })).toBe(1);
  });
  it("half the hold gives half the score", () => {
    expect(scoreStep(heatHold, { kind: "heat-hold", timeInBand: 3, timeAbove: 0 })).toBeCloseTo(0.5);
  });
  it("time above the band burns the syrup score", () => {
    const clean = scoreStep(heatHold, { kind: "heat-hold", timeInBand: 6, timeAbove: 0 });
    const scorched = scoreStep(heatHold, { kind: "heat-hold", timeInBand: 6, timeAbove: 3 });
    expect(scorched).toBeLessThan(clean);
    expect(scorched).toBeCloseTo(0.75);
  });
});

describe("scoreStep: pour-stir", () => {
  it("perfect pours + full smoothing is perfect", () => {
    const s = scoreStep(pourStir, {
      kind: "pour-stir",
      pourAmounts: { starch: 0.6, water: 0.65 },
      smoothSeconds: 4,
    });
    expect(s).toBe(1);
  });
  it("missing an ingredient entirely tanks the pour side", () => {
    const s = scoreStep(pourStir, {
      kind: "pour-stir",
      pourAmounts: { starch: 0.6 },
      smoothSeconds: 4,
    });
    expect(s).toBeLessThan(0.75);
  });
  it("no stirring loses the smooth 40%", () => {
    const s = scoreStep(pourStir, {
      kind: "pour-stir",
      pourAmounts: { starch: 0.6, water: 0.65 },
      smoothSeconds: 0,
    });
    expect(s).toBeCloseTo(0.6);
  });
});

describe("scoreStep: pour-while-stir", () => {
  it("slow steady pour while stirring is perfect", () => {
    expect(
      scoreStep(combine, { kind: "pour-while-stir", rushedFrac: 0, stalledFrac: 0 })
    ).toBe(1);
  });
  it("rushing (lumps) and stalling (sticking) both cost", () => {
    const rushed = scoreStep(combine, { kind: "pour-while-stir", rushedFrac: 0.5, stalledFrac: 0 });
    const stalled = scoreStep(combine, { kind: "pour-while-stir", rushedFrac: 0, stalledFrac: 0.5 });
    expect(rushed).toBeCloseTo(0.65);
    expect(stalled).toBeCloseTo(0.65);
  });
});

describe("scoreStep: stir-batches", () => {
  it("steady stir + all ghee batches = perfect", () => {
    expect(
      scoreStep(longStir, { kind: "stir-batches", smoothness: 1, batchesHit: 3, burn: 0 })
    ).toBe(1);
  });
  it("missing ghee ladles costs the batch share", () => {
    const s = scoreStep(longStir, { kind: "stir-batches", smoothness: 1, batchesHit: 1, burn: 0 });
    expect(s).toBeCloseTo(0.55 + 0.45 / 3);
  });
  it("burn scales the whole stage down", () => {
    const s = scoreStep(longStir, { kind: "stir-batches", smoothness: 1, batchesHit: 3, burn: 0.5 });
    expect(s).toBeCloseTo(1 - 0.5 * 0.85);
  });
});

describe("scoreStep: timed-add and finish-call", () => {
  it("all spice cues hit = perfect", () => {
    expect(scoreStep(timedAdd, { kind: "timed-add", hits: 2 })).toBe(1);
  });
  it("calling doneness inside the window is perfect", () => {
    expect(scoreStep(finishCall, { kind: "finish-call", calledAt: 0.8 })).toBe(1);
    expect(scoreStep(finishCall, { kind: "finish-call", calledAt: 0.7 })).toBe(1);
    expect(scoreStep(finishCall, { kind: "finish-call", calledAt: 0.9 })).toBe(1);
  });
  it("early = pale, late = rubbery, both fall off", () => {
    const early = scoreStep(finishCall, { kind: "finish-call", calledAt: 0.625 });
    const late = scoreStep(finishCall, { kind: "finish-call", calledAt: 0.975 });
    expect(early).toBeCloseTo(0.5);
    expect(late).toBeCloseTo(0.5);
    expect(scoreStep(finishCall, { kind: "finish-call", calledAt: 0.4 })).toBe(0);
  });
});

describe("scoreStep: kind mismatch", () => {
  it("throws when the summary doesn't match the step", () => {
    expect(() =>
      scoreStep(heatHold, { kind: "timed-add", hits: 1 } as StepSummary)
    ).toThrow();
  });
});

/* ---------- rateRun over a full recipe (the real production path) ---------- */

const perfectSummaries = (steps: RecipeStep[]): StepSummary[] =>
  steps.map((step): StepSummary => {
    switch (step.kind) {
      case "heat-hold":
        return { kind: "heat-hold", timeInBand: step.holdSeconds, timeAbove: 0 };
      case "pour-stir":
        return {
          kind: "pour-stir",
          pourAmounts: Object.fromEntries(step.pours.map((p) => [p.key, p.target])),
          smoothSeconds: step.smoothSeconds,
        };
      case "pour-while-stir":
        return { kind: "pour-while-stir", rushedFrac: 0, stalledFrac: 0 };
      case "stir-batches":
        return { kind: "stir-batches", smoothness: 1, batchesHit: step.batches.length, burn: 0 };
      case "timed-add":
        return { kind: "timed-add", hits: step.adds.length };
      case "finish-call":
        return {
          kind: "finish-call",
          calledAt: (step.idealWindow[0] + step.idealWindow[1]) / 2,
        };
    }
  });

describe("rateRun on the real recipes", () => {
  it("a perfect run of every halwa is 5 stars with no worst stage", () => {
    for (const id of DISH_ORDER) {
      const r = RECIPES[id];
      const rating = rateRun(r.steps, perfectSummaries(r.steps), 0);
      expect(rating.stars).toBe(5);
      expect(rating.overall).toBe(1);
      expect(rating.worst).toBeNull();
    }
  });

  it("burning the pot past 0.85 is 0 stars regardless of skill", () => {
    const r = RECIPES.classic;
    const rating = rateRun(r.steps, perfectSummaries(r.steps), 0.9);
    expect(rating.burnt).toBe(true);
    expect(rating.stars).toBe(0);
  });

  it("botching the long stir drags hardest (weight 2) and is named worst", () => {
    const r = RECIPES.classic;
    const summaries = perfectSummaries(r.steps).map((s) =>
      s.kind === "stir-batches"
        ? { kind: "stir-batches" as const, smoothness: 0.2, batchesHit: 0, burn: 0.3 }
        : s
    );
    const rating = rateRun(r.steps, summaries, 0.3);
    expect(rating.stars).toBeLessThanOrEqual(3);
    expect(rating.worst?.stepId).toBe("longstir");
  });

  it("a sloppy-but-complete run lands mid stars, not 0 and not 5", () => {
    const r = RECIPES.classic;
    const summaries: StepSummary[] = r.steps.map((step): StepSummary => {
      switch (step.kind) {
        case "heat-hold":
          return { kind: "heat-hold", timeInBand: step.holdSeconds * 0.7, timeAbove: step.holdSeconds * 0.15 };
        case "pour-stir":
          return {
            kind: "pour-stir",
            pourAmounts: Object.fromEntries(
              step.pours.map((p) => [p.key, p.target + p.tolerance * 1.4])
            ),
            smoothSeconds: step.smoothSeconds * 0.6,
          };
        case "pour-while-stir":
          return { kind: "pour-while-stir", rushedFrac: 0.2, stalledFrac: 0.1 };
        case "stir-batches":
          return { kind: "stir-batches", smoothness: 0.7, batchesHit: step.batches.length - 1, burn: 0.2 };
        case "timed-add":
          return { kind: "timed-add", hits: Math.max(0, step.adds.length - 1) };
        case "finish-call":
          return { kind: "finish-call", calledAt: step.idealWindow[1] + 0.06 };
      }
    });
    const rating = rateRun(r.steps, summaries, 0.2);
    expect(rating.stars).toBeGreaterThanOrEqual(2);
    expect(rating.stars).toBeLessThanOrEqual(4);
    expect(rating.worst).not.toBeNull();
  });

  it("no stage is skippable: one ruined stage caps the stars even if the rest is perfect", () => {
    const r = RECIPES.classic;
    // skip the spices entirely on an otherwise flawless cook
    const summaries = perfectSummaries(r.steps).map((s) =>
      s.kind === "timed-add" ? { kind: "timed-add" as const, hits: 0 } : s
    );
    const rating = rateRun(r.steps, summaries, 0);
    expect(rating.stars).toBeLessThanOrEqual(2);
    expect(rating.worst?.stepId).toBe("spices");
  });

  it("throws when summaries don't line up with steps", () => {
    const r = RECIPES.classic;
    expect(() => rateRun(r.steps, [], 0)).toThrow();
  });
});
