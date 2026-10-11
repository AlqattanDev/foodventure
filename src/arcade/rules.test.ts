import { describe, expect, it } from 'vitest';
import {
  ROUND_MS, RECIPES, activeOrder, comboMultiplier, completeStep, createRun,
  dayConfig, normalizeQuality, pourQuality, roundStars, scoreOrder, selectOrder,
  serveOrder, stirQuality, tickRun, type RunState,
} from './rules';

function ready(run: RunState, quality = 1): RunState {
  return completeStep(completeStep(run, quality), quality);
}

function servePlates(count: number, quality = 1): RunState {
  let run = createRun(1, 34);
  for (let index = 0; index < count; index += 1) {
    if (!run.orders.length) run = tickRun(run, 650);
    run = serveOrder(ready(run, quality));
  }
  return run;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

describe('the rush', () => {
  it('starts every day with a complete minute and one obvious karak order', () => {
    for (const day of [1, 2, 5, 10_000]) {
      const run = createRun(day, 45);
      expect(run.remainingMs).toBe(ROUND_MS);
      expect(run.elapsedMs).toBe(0);
      expect(run.status).toBe('playing');
      expect(run.orders).toHaveLength(1);
      expect(activeOrder(run)?.recipe).toBe('karak');
      expect(run.score).toBe(0);
    }
  });

  it('unlocks the five local dishes across four days and caps later pressure', () => {
    expect(dayConfig(1).recipes).toEqual(['karak', 'samboosa']);
    expect(dayConfig(2).recipes).toEqual(['karak', 'samboosa', 'halwa']);
    expect(dayConfig(3).recipes).toEqual(['karak', 'samboosa', 'halwa', 'balaleet']);
    expect(dayConfig(4).recipes).toContain('machboos');
    expect(dayConfig(999).arrivalMs).toBe(dayConfig(7).arrivalMs);
    expect(dayConfig(999).patienceMs).toBe(dayConfig(7).patienceMs);
    expect(dayConfig(999).starThresholds).toEqual(dayConfig(7).starThresholds);
    expect(dayConfig(1).maxOrders).toBe(2);
    expect(dayConfig(4).maxOrders).toBe(3);
  });

  it('is repeatable from a seed and never introduces locked recipes', () => {
    for (const day of [1, 2, 3, 4]) {
      let left = createRun(day, 182);
      let right = createRun(day, 182);
      const permitted = dayConfig(day).recipes;
      for (let tick = 0; tick < 240; tick += 1) {
        left = tickRun(left, 250);
        right = tickRun(right, 250);
        expect(left).toEqual(right);
        expect(left.orders.every(order => permitted.includes(order.recipe))).toBe(true);
        expect(left.orders.length).toBeLessThanOrEqual(dayConfig(day).maxOrders);
      }
    }
  });

  it('retains partial plates when choosing a different customer', () => {
    let run = tickRun(createRun(1, 91), 4_000);
    const [first, second] = run.orders;
    run = completeStep(run, 0.74);
    run = selectOrder(run, second!.id);
    run = completeStep(run, 1);
    run = selectOrder(run, first!.id);
    expect(activeOrder(run)?.step).toBe(1);
    expect(activeOrder(run)?.qualities).toEqual([0.74]);
    expect(run.orders[1]?.qualities).toEqual([1]);
    expect(selectOrder(run, 999)).toBe(run);
    expect(selectOrder(run, Number.NaN)).toBe(run);
  });

  it('serves only finished food and awards each order once', () => {
    const run = createRun(1, 24);
    const id = activeOrder(run)!.id;
    expect(serveOrder(run, id)).toBe(run);
    const partial = completeStep(run, 1);
    expect(serveOrder(partial, id)).toBe(partial);
    const cooked = completeStep(partial, 1);
    expect(completeStep(cooked, 0)).toBe(cooked);
    const served = serveOrder(cooked, id);
    expect(served.score).toBe(170);
    expect(served.served).toBe(1);
    expect(served.perfect).toBe(1);
    expect(served.orders).toHaveLength(0);
    expect(serveOrder(served, id)).toBe(served);
    expect(served.lastEvent).toMatchObject({ type: 'serve', points: 170, perfect: true, recipe: 'karak' });
  });

  it('brings another customer within 650ms when the stall becomes empty', () => {
    const run = servePlates(1);
    expect(tickRun(run, 649).orders).toHaveLength(0);
    expect(tickRun(run, 650).orders).toHaveLength(1);
    expect(tickRun(tickRun(run, 325), 325)).toEqual(tickRun(run, 650));
  });

  it('keeps the earlier planned arrival when the empty queue wakes', () => {
    const run = serveOrder(ready(tickRun(createRun(1, 44), 3_900)));
    expect(run.arrivalAtMs).toBe(4_000);
    expect(tickRun(run, 100).orders).toHaveLength(1);
  });

  it('expires incomplete and ready plates, resets the streak, and selects a survivor', () => {
    let run = servePlates(1);
    run = tickRun(run, 4_650);
    const expiredId = run.selectedId;
    const survivor = run.orders.find(order => order.id !== expiredId)!;
    run = ready(run);
    run = tickRun(run, 14_000);
    expect(run.orders.some(order => order.id === expiredId)).toBe(false);
    expect(run.selectedId).toBe(survivor.id);
    expect(run.missed).toBe(1);
    expect(run.combo).toBe(0);
    expect(run.bestCombo).toBe(1);
    expect(run.score).toBe(170);
    expect(serveOrder(run, expiredId)).toBe(run);
    expect(run.lastEvent).toMatchObject({ type: 'miss', orderId: expiredId });
  });

  it('safely wakes an empty stall after an expiry', () => {
    const initial = createRun(1, 76);
    // Keep only the initial order until its deadline to exercise the empty case.
    const isolated = { ...initial, arrivalAtMs: 40_000 };
    const expired = tickRun(isolated, 18_000);
    expect(expired.orders).toHaveLength(0);
    expect(expired.selectedId).toBeNull();
    expect(expired.arrivalAtMs).toBe(18_650);
    expect(tickRun(expired, 650).orders).toHaveLength(1);
    expect(tickRun(isolated, 18_650)).toEqual(tickRun(tickRun(isolated, 18_000), 650));
  });

  it('processes long frames identically to many small frames', () => {
    for (const day of [1, 2, 4, 8]) {
      for (const duration of [3_999, 4_000, 18_000, 37_999, 60_000]) {
        const initial = createRun(day, 721);
        const oneTick = tickRun(initial, duration);
        let partitioned = initial;
        let remaining = duration;
        for (const chunk of [17, 487, 5_098, 2_074, 29_173, 23_151]) {
          const delta = Math.min(chunk, remaining);
          partitioned = tickRun(partitioned, delta);
          remaining -= delta;
        }
        partitioned = tickRun(partitioned, remaining);
        expect(partitioned).toEqual(oneTick);
      }
    }
  });

  it('ends exactly at the bell and rejects every further scoring action', () => {
    const initial = ready(createRun(1, 41));
    const almost = tickRun(initial, ROUND_MS - 1);
    expect(almost.status).toBe('playing');
    const finished = tickRun(almost, 1);
    expect(finished.elapsedMs).toBe(ROUND_MS);
    expect(finished.remainingMs).toBe(0);
    expect(finished.status).toBe('finished');
    expect(finished.lastEvent?.type).toBe('finish');
    expect(tickRun(finished, 1_000)).toBe(finished);
    expect(completeStep(finished, 1)).toBe(finished);
    expect(selectOrder(finished, finished.orders[0]!.id)).toBe(finished);
    expect(serveOrder(finished)).toBe(finished);
    expect(tickRun(initial, 1_000_000)).toEqual(tickRun(initial, ROUND_MS));
  });

  it('does not count waiting customers as extra misses at the bell', () => {
    const initial = createRun(1, 46);
    const order = { ...initial.orders[0]!, expiresAtMs: ROUND_MS, remainingMs: ROUND_MS, patienceMs: ROUND_MS };
    const held = { ...initial, orders: [order], arrivalAtMs: ROUND_MS };
    const finished = tickRun(held, ROUND_MS);
    expect(finished.missed).toBe(0);
    expect(finished.nextOrderId).toBe(2);
    expect(finished.orders).toHaveLength(1);
  });

  it('does not mutate its inputs, including nested orders and qualities', () => {
    const original = freeze(tickRun(createRun(1, 100), 4_000));
    const completed = completeStep(original, 1);
    const selected = selectOrder(original, original.orders[1]!.id);
    const advanced = tickRun(original, 20_000);
    const served = serveOrder(freeze(ready(original)));
    expect(original.orders[0]?.step).toBe(0);
    expect(original.elapsedMs).toBe(4_000);
    expect(completed.orders[0]?.step).toBe(1);
    expect(selected.selectedId).toBe(original.orders[1]?.id);
    expect(advanced.elapsedMs).toBe(24_000);
    expect(served.served).toBe(1);
  });

  it('sanitizes hostile clock, seed, day and gesture numbers', () => {
    for (const invalid of [Number.NaN, Infinity, -Infinity, -100]) {
      const run = createRun(invalid, invalid);
      expect(run.day).toBe(1);
      expect(Number.isFinite(run.seed)).toBe(true);
      expect(tickRun(run, invalid)).toBe(run);
      expect(activeOrder(completeStep(run, invalid))?.qualities).toEqual([0]);
    }
    expect(createRun(2.9, 10.9).day).toBe(2);
    expect(activeOrder(completeStep(createRun(), 900))?.qualities).toEqual([1]);
  });
});

describe('quality, tips and stars', () => {
  it('rewards careful cooking and quicker service with more points', () => {
    const perfect = activeOrder(ready(createRun()))!;
    const uneven = { ...perfect, qualities: [0.4, 1] };
    const slow = { ...perfect, remainingMs: 1_000 };
    expect(scoreOrder(perfect, 1).points).toBeGreaterThan(scoreOrder(uneven, 1).points);
    expect(scoreOrder(perfect, 1).tip).toBeGreaterThan(scoreOrder(slow, 1).tip);
    expect(scoreOrder(uneven, 1).perfect).toBe(false);
    expect(scoreOrder(perfect, 1).perfect).toBe(true);
    expect(servePlates(3, 0.2).score).toBeLessThan(servePlates(3, 1).score);
  });

  it('builds a visible streak but never grows beyond a double multiplier', () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBeCloseTo(1.2);
    expect(comboMultiplier(6)).toBe(2);
    expect(comboMultiplier(100_000)).toBe(2);
    const run = servePlates(12);
    expect(run.combo).toBe(12);
    expect(run.bestCombo).toBe(12);
    expect(run.lastEvent?.points).toBe(340);
    expect(run.perfect).toBe(12);
    expect(roundStars(run)).toBe(3);
  });

  it('keeps scoring finite, integer and nonnegative for hostile quality/speed numbers', () => {
    const order = activeOrder(ready(createRun()))!;
    for (const value of [Number.NaN, Infinity, -Infinity, -100, 10_000, 0.35]) {
      const score = scoreOrder({ ...order, qualities: [value, value], patienceMs: value, remainingMs: value }, value);
      expect(Number.isInteger(score.points)).toBe(true);
      expect(score.points).toBeGreaterThanOrEqual(0);
      expect(score.points).toBeLessThanOrEqual(340);
      expect(score.multiplier).toBeGreaterThanOrEqual(1);
      expect(score.multiplier).toBeLessThanOrEqual(2);
    }
  });

  it('awards stars at their exact visible thresholds', () => {
    expect(roundStars({ day: 1, score: 499 })).toBe(0);
    expect(roundStars({ day: 1, score: 500 })).toBe(1);
    expect(roundStars({ day: 1, score: 1_300 })).toBe(2);
    expect(roundStars({ day: 1, score: 2_300 })).toBe(3);
    expect(roundStars({ day: 1, score: Infinity })).toBe(0);
    expect(roundStars({ day: 1, score: -100 })).toBe(0);
    expect(roundStars({ day: 8, score: 2_300 })).toBe(2);
  });

  it('makes the full gold pour band perfect and improves toward it', () => {
    for (const fill of [0.62, 0.67, 0.72, 0.78, 0.82]) expect(pourQuality(fill)).toBe(1);
    expect(pourQuality(0.5)).toBeGreaterThan(pourQuality(0.2));
    expect(pourQuality(0.9)).toBeGreaterThan(pourQuality(1));
    expect(pourQuality(0)).toBe(0);
    expect(pourQuality(Number.NaN)).toBe(0);
    expect(pourQuality(-10)).toBe(0);
    expect(pourQuality(Infinity)).toBe(0);
  });

  it('needs only one stir circle and gives no penalty for extra circles', () => {
    expect(stirQuality(0)).toBe(0);
    expect(stirQuality(0.5)).toBe(0.5);
    expect(stirQuality(1)).toBe(1);
    expect(stirQuality(4)).toBe(1);
    expect(stirQuality(Number.NaN)).toBe(0);
    expect(normalizeQuality(-1)).toBe(0);
    expect(Object.values(RECIPES).every(recipe => recipe.steps.length === 2)).toBe(true);
  });
});
