import { describe, it, expect } from "vitest";
import { createBurner, stepBurner, bubbleStage } from "./burner";

const DT = 1 / 60;
const BAND: [number, number] = [0.45, 0.7];

function run(s = createBurner(), seconds: number, knob: number) {
  for (let t = 0; t < seconds; t += DT) stepBurner(s, knob, DT);
  return s;
}

describe("thermal inertia", () => {
  it("the heat chases the knob with lag", () => {
    const s = createBurner();
    run(s, 1, 1);
    expect(s.heat).toBeGreaterThan(0.2);
    expect(s.heat).toBeLessThan(0.9); // not instant
    run(s, 8, 1);
    expect(s.heat).toBeGreaterThan(0.95);
  });

  it("cooling is slower than heating — the pot holds heat", () => {
    const hot = run(createBurner(), 10, 1);
    const heatAt = (seconds: number) => {
      const s = { ...hot };
      run(s, seconds, 0);
      return s.heat;
    };
    const cooled = 1 - heatAt(2);
    const s2 = createBurner();
    s2.heat = 0;
    run(s2, 2, 1);
    const heated = s2.heat;
    expect(heated).toBeGreaterThan(cooled);
  });
});

describe("bubbleStage — the player's thermometer", () => {
  it("maps heat to what the surface visibly does", () => {
    expect(bubbleStage(0.1, BAND)).toBe("still");
    expect(bubbleStage(0.38, BAND)).toBe("beads");
    expect(bubbleStage(0.55, BAND)).toBe("simmer");
    expect(bubbleStage(0.8, BAND)).toBe("rolling");
  });

  it("beads warn just under the band — the cue to ease the knob", () => {
    expect(bubbleStage(BAND[0] - 0.01, BAND)).toBe("beads");
    expect(bubbleStage(BAND[0], BAND)).toBe("simmer");
    expect(bubbleStage(BAND[1], BAND)).toBe("simmer");
    expect(bubbleStage(BAND[1] + 0.01, BAND)).toBe("rolling");
  });
});
