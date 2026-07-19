import { describe, it, expect } from "vitest";
import {
  createPour,
  stepPour,
  flowFor,
  streamKind,
  TILT_THRESHOLD,
  GLUG_FLOW,
} from "./pour";

const DT = 1 / 60;

function run(s = createPour(), seconds: number, tilt: number, scooping = false) {
  for (let t = 0; t < seconds; t += DT) stepPour(s, tilt, scooping, DT);
  return s;
}

describe("flowFor", () => {
  it("pours nothing below the threshold tilt", () => {
    expect(flowFor(0)).toBe(0);
    expect(flowFor(TILT_THRESHOLD)).toBe(0);
    expect(flowFor(TILT_THRESHOLD - 0.05)).toBe(0);
  });

  it("flows faster the steeper the tilt", () => {
    expect(flowFor(0.4)).toBeGreaterThan(0);
    expect(flowFor(0.7)).toBeGreaterThan(flowFor(0.4));
    expect(flowFor(1)).toBeGreaterThan(flowFor(0.7));
  });
});

describe("stepPour", () => {
  it("holding a gentle tilt fills the bowl gradually", () => {
    const s = run(createPour(), 2, 0.5);
    expect(s.fill).toBeGreaterThan(0.05);
    expect(s.fill).toBeLessThan(0.6);
  });

  it("righting the vessel dribbles — fill keeps creeping briefly", () => {
    const s = run(createPour(), 1.5, 0.6);
    const atCut = s.fill;
    run(s, 0.5, 0); // vessel upright
    expect(s.fill).toBeGreaterThan(atCut); // the dribble landed
    const afterDribble = s.fill;
    run(s, 1, 0);
    expect(s.fill).toBeCloseTo(afterDribble, 2); // then it truly stops
  });

  it("a full bowl spills instead of filling past the brim", () => {
    const s = run(createPour(), 6, 1);
    expect(s.fill).toBe(1);
    expect(s.spilled).toBeGreaterThan(0);
  });

  it("scooping recovers an overshoot, slowly", () => {
    const s = run(createPour(), 3, 0.8);
    const over = s.fill;
    run(s, 2, 0, true);
    expect(s.fill).toBeLessThan(over);
    expect(over - s.fill).toBeLessThan(0.35); // slow — costs real time
  });

  it("scooping does nothing while the stream is still going", () => {
    const s = createPour();
    run(s, 1, 0.8);
    const before = s.fill;
    // still tilted AND scooping — the stream wins
    for (let t = 0; t < 0.5; t += DT) stepPour(s, 0.8, true, DT);
    expect(s.fill).toBeGreaterThan(before);
  });
});

describe("streamKind", () => {
  it("classifies none / thin / glug", () => {
    expect(streamKind(0)).toBe("none");
    expect(streamKind(GLUG_FLOW - 0.05)).toBe("thin");
    expect(streamKind(GLUG_FLOW + 0.05)).toBe("glug");
  });
});
