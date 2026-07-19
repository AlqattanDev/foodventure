import { describe, it, expect } from "vitest";
import {
  createStir,
  stepStir,
  coverageQuality,
  scorchTotal,
  worstSpot,
  isStirring,
  DARK_THRESHOLD,
} from "./stir";

const DT = 1 / 60;

function idle(g = createStir(), seconds: number, heat: number) {
  for (let t = 0; t < seconds; t += DT) stepStir(g, null, heat, DT);
  return g;
}

/** Sweep the whole pot in slow circles, like an attentive cook. */
function circleStir(g: ReturnType<typeof createStir>, seconds: number, heat: number) {
  let clock = 0;
  for (let t = 0; t < seconds; t += DT) {
    clock += DT;
    const a = clock * 3;
    // spiral between two radii so the middle AND rim get swept; the radial
    // frequency is incommensurate with the angular one so the path drifts
    // over the whole pot instead of retracing one closed curve
    const r = 0.35 + 0.45 * Math.abs(Math.sin(clock * 1.13));
    stepStir(g, { x: Math.cos(a) * r, y: Math.sin(a) * r }, heat, DT);
  }
  return g;
}

describe("sticking & scorching", () => {
  it("a neglected pot on heat sticks, then scorches", () => {
    const g = idle(createStir(), 4, 1);
    expect(coverageQuality(g)).toBeLessThan(0.2);
    expect(scorchTotal(g)).toBe(0); // darkening yes, scorch not yet
    idle(g, 8, 1);
    expect(scorchTotal(g)).toBeGreaterThan(0.3);
    expect(worstSpot(g)).not.toBeNull();
  });

  it("no heat, no sticking", () => {
    const g = idle(createStir(), 10, 0);
    expect(coverageQuality(g)).toBe(1);
    expect(scorchTotal(g)).toBe(0);
  });

  it("an attentive stir on medium heat keeps coverage high, never scorches", () => {
    // medium heat is what the recipe instructs for the long stir; full blast
    // is deliberately harder to keep clean (the heat/speed tradeoff)
    const g = circleStir(createStir(), 12, 0.6);
    expect(coverageQuality(g)).toBeGreaterThan(0.85);
    expect(scorchTotal(g)).toBeLessThan(0.05);
  });

  it("scorch is permanent — sweeping cleans stick, not scorch", () => {
    const g = idle(createStir(), 12, 1);
    const burned = scorchTotal(g);
    expect(burned).toBeGreaterThan(0);
    circleStir(g, 4, 0.4);
    expect(scorchTotal(g)).toBeGreaterThanOrEqual(burned);
    expect(coverageQuality(g)).toBeGreaterThan(0.7); // stick did clean up
  });

  it("only the neglected corner darkens — sticking is local", () => {
    const g = createStir();
    // park the paddle on the left side only
    for (let t = 0; t < 6; t += DT) {
      const a = t * 3;
      stepStir(g, { x: -0.5 + Math.cos(a) * 0.25, y: Math.sin(a) * 0.5 }, 1, DT);
    }
    // the untouched right side darkens; the worked patch itself stays clean
    const n = g.n;
    let stuckRight = 0;
    let stuckLeft = 0;
    let workedPatch = Infinity;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const idx = j * n + i;
        if (!g.inside[idx]) continue;
        const x = ((i + 0.5) / n) * 2 - 1;
        const y = ((j + 0.5) / n) * 2 - 1;
        // the orbit's own footprint (center of the worked zone)
        if (Math.hypot(x + 0.5, y) < 0.35) workedPatch = Math.min(workedPatch, 1 - g.stick[idx]);
        if (g.stick[idx] < DARK_THRESHOLD) continue;
        if (x > 0.2) stuckRight++;
        else if (x < -0.2) stuckLeft++;
      }
    }
    expect(stuckRight).toBeGreaterThan(0);
    expect(stuckRight).toBeGreaterThan(stuckLeft);
    expect(workedPatch).toBeGreaterThan(0.6); // the tended patch is clean
  });

  it("a fast stroke sweeps the whole segment it crossed, not just endpoints", () => {
    const g = createStir();
    idle(g, 3, 1); // everything sticky
    // one fast diagonal swipe in a single frame
    stepStir(g, { x: -0.9, y: -0.9 }, 1, DT);
    stepStir(g, { x: 0.9, y: 0.9 }, 1, DT);
    // the center must be clean even though no frame sampled it directly
    const n = g.n;
    const centerIdx = Math.floor(n / 2) * n + Math.floor(n / 2);
    expect(g.stick[centerIdx]).toBeLessThan(0.05);
  });
});

describe("paddle state", () => {
  it("isStirring tracks active motion and lifting off", () => {
    const g = createStir();
    stepStir(g, { x: 0, y: 0 }, 0.5, DT);
    stepStir(g, { x: 0.2, y: 0 }, 0.5, DT);
    expect(isStirring(g)).toBe(true);
    idle(g, 1, 0.5);
    expect(isStirring(g)).toBe(false);
  });

  it("holding the paddle still counts as not stirring", () => {
    const g = createStir();
    for (let t = 0; t < 1; t += DT) stepStir(g, { x: 0.3, y: 0.3 }, 0.5, DT);
    expect(isStirring(g)).toBe(false);
  });
});
