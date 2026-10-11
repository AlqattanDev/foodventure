import { describe, expect, it } from 'vitest';
import { createRun, tickRun, type RunState } from './rules';
import { DEFAULT_PROGRESS, nextDay, parseProgress, recordRound, stallLevel, type Progress } from './progress';

function finished(day = 1, score = 1_500, seed = 731): RunState {
  return { ...tickRun(createRun(day, seed), 60_000), score, served: 8, bestCombo: 6, perfect: 4 };
}

function progress(fields: Partial<Progress> = {}): Progress {
  return { ...DEFAULT_PROGRESS, dayStars: {}, ...fields };
}

describe('safe local progress', () => {
  it('starts clean when storage is missing, broken, the wrong shape or another version', () => {
    for (const raw of [null, '', '{broken', 'null', '[]', '42', '"hello"', '{}', '{"version":2}', '{"version":"1"}']) {
      expect(parseProgress(raw)).toEqual(DEFAULT_PROGRESS);
    }
    expect(parseProgress(' '.repeat(250_001))).toEqual(DEFAULT_PROGRESS);
  });

  it('clamps hostile values without accepting strings, arrays or polluted keys', () => {
    const parsed = parseProgress('{"version":1,"bestScore":1e999,"bestCombo":-8,"totalServed":999999999999,"completedDays":4.8,"muted":"false","dayStars":{"1":9,"2":-3,"3":"3","4":2.9,"__proto__":3,"constructor":3,"0":3,"01":3,"10001":3},"lastRoundId":"<bad>"}');
    expect(parsed.bestScore).toBe(0);
    expect(parsed.bestCombo).toBe(0);
    expect(parsed.totalServed).toBe(1_000_000_000);
    expect(parsed.completedDays).toBe(4);
    expect(parsed.muted).toBe(false);
    expect(parsed.dayStars).toEqual({ 1: 3, 2: 0, 3: 0, 4: 2 });
    expect(parsed.lastRoundId).toBeNull();
    expect(Object.getPrototypeOf(parsed.dayStars)).toBe(Object.prototype);
    expect(parseProgress('{"version":1,"dayStars":[3,3],"muted":true}').dayStars).toEqual({});
    expect(parseProgress('{"version":1,"dayStars":null,"muted":true}').muted).toBe(true);
  });

  it('round-trips all saved fields and the remembered mute choice', () => {
    const recorded = recordRound(progress({ muted: true }), finished());
    expect(parseProgress(JSON.stringify(recorded))).toEqual(recorded);
    expect(parseProgress(JSON.stringify({ ...recorded, dayStars: { 10_000: 2 } })).dayStars).toEqual({ 10_000: 2 });
  });

  it('returns independent default objects so one failed save cannot alter another', () => {
    const first = parseProgress(null);
    first.dayStars['1'] = 3;
    first.muted = true;
    expect(parseProgress(null)).toEqual(DEFAULT_PROGRESS);
    expect(DEFAULT_PROGRESS.dayStars).toEqual({});
  });
});

describe('round rewards and progression', () => {
  it('records only a finished round and requires one star to unlock another day', () => {
    const initial = progress();
    expect(recordRound(initial, createRun())).toBe(initial);
    const below = recordRound(initial, finished(1, 499));
    expect(below.bestScore).toBe(499);
    expect(below.totalServed).toBe(8);
    expect(below.completedDays).toBe(0);
    expect(nextDay(below)).toBe(1);
    const passed = recordRound(below, finished(1, 500, 732));
    expect(passed.completedDays).toBe(1);
    expect(nextDay(passed)).toBe(2);
    expect(passed.dayStars).toEqual({ 1: 1 });
  });

  it('retains personal best scores and stars when replaying a weaker round', () => {
    const initial = recordRound(progress({ muted: true }), finished(1, 3_000));
    const replay = recordRound(initial, { ...finished(1, 600, 732), bestCombo: 2, served: 3 });
    expect(replay.bestScore).toBe(3_000);
    expect(replay.bestCombo).toBe(6);
    expect(replay.totalServed).toBe(11);
    expect(replay.dayStars['1']).toBe(3);
    expect(replay.completedDays).toBe(1);
    expect(replay.muted).toBe(true);
    expect(initial.totalServed).toBe(8);
    expect(initial.dayStars).toEqual({ 1: 3 });
  });

  it('does not double-record a result, including after a save reload', () => {
    const run = finished();
    const recorded = recordRound(progress(), run);
    expect(recordRound(recorded, run)).toBe(recorded);
    const restored = parseProgress(JSON.stringify(recorded));
    expect(recordRound(restored, run)).toBe(restored);
    expect(restored.totalServed).toBe(8);
    const next = recordRound(restored, finished(2, 2_000, 732));
    expect(next.totalServed).toBe(16);
    expect(next.completedDays).toBe(2);
  });

  it('unlocks sequentially and cannot skip directly to a later day', () => {
    const skipped = recordRound(progress(), finished(4, 9_000));
    expect(skipped.completedDays).toBe(0);
    let saved = progress();
    for (let day = 1; day <= 4; day += 1) {
      saved = recordRound(saved, finished(day, 5_000, day));
      expect(nextDay(saved)).toBe(day + 1);
      expect(saved.dayStars[String(day)]).toBe(3);
    }
  });

  it('is immutable even when its input and nested stars are frozen', () => {
    const initial = Object.freeze(progress({ dayStars: Object.freeze({ 1: 1 }), completedDays: 1 }));
    const result = recordRound(initial, finished(2, 2_500));
    expect(result).not.toBe(initial);
    expect(result.dayStars).not.toBe(initial.dayStars);
    expect(initial.dayStars).toEqual({ 1: 1 });
    expect(result.dayStars).toEqual({ 1: 1, 2: 3 });
  });

  it('keeps lifetime counters and day navigation bounded', () => {
    const nearLimit = progress({ totalServed: 999_999_999, completedDays: 9_999 });
    const result = recordRound(nearLimit, finished(10_000));
    expect(result.totalServed).toBe(1_000_000_000);
    expect(nextDay(result)).toBe(10_000);
    expect(nextDay({ completedDays: Number.NaN })).toBe(1);
    expect(nextDay({ completedDays: -9 })).toBe(1);
  });

  it('earns only cosmetic stall levels from cumulative best stars', () => {
    expect(stallLevel(progress())).toBe(1);
    expect(stallLevel(progress({ dayStars: { 1: 2 } }))).toBe(2);
    expect(stallLevel(progress({ dayStars: { 1: 3, 2: 3 } }))).toBe(3);
    expect(stallLevel(progress({ dayStars: { 1: 3, 2: 3, 3: 3, 4: 3 } }))).toBe(4);
    const run = finished(1, 3_000);
    const decorated = recordRound(progress({ dayStars: { 2: 3, 3: 3, 4: 3 } }), run);
    expect(stallLevel(decorated)).toBe(4);
    expect(decorated.bestScore).toBe(run.score);
  });
});
