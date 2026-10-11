/** The complete rush lives here: no browser APIs, clocks, random globals, or side effects. */
export type RecipeId = 'karak' | 'samboosa' | 'halwa' | 'balaleet' | 'machboos';
export type GestureKind = 'pour' | 'stir' | 'fold' | 'tap';

export interface RecipeStep {
  kind: GestureKind;
  label: string;
  tool?: string;
}

export interface Recipe {
  id: RecipeId;
  name: string;
  arabic: string;
  description: string;
  steps: readonly [RecipeStep, RecipeStep];
}

export const RECIPES: Readonly<Record<RecipeId, Recipe>> = {
  karak: {
    id: 'karak', name: 'Karak', arabic: 'كرك', description: 'Creamy tea, fragrant cardamom.',
    steps: [{ kind: 'pour', label: 'Pour the tea', tool: 'Tea pot' }, { kind: 'tap', label: 'Add cardamom', tool: 'Cardamom' }],
  },
  samboosa: {
    id: 'samboosa', name: 'Samboosa', arabic: 'سمبوسة', description: 'A crisp little golden triangle.',
    steps: [{ kind: 'fold', label: 'Fold the pastry', tool: 'Pastry' }, { kind: 'tap', label: 'Make it sizzle', tool: 'Hot pan' }],
  },
  halwa: {
    id: 'halwa', name: 'Halwa', arabic: 'حلوى بحرينية', description: 'Glossy saffron sweetness with pistachios.',
    steps: [{ kind: 'stir', label: 'Stir the halwa', tool: 'Spoon' }, { kind: 'tap', label: 'Add pistachios', tool: 'Pistachios' }],
  },
  balaleet: {
    id: 'balaleet', name: 'Balaleet', arabic: 'بلاليط', description: 'Sweet golden noodles, fluffy egg.',
    steps: [{ kind: 'stir', label: 'Toss the noodles', tool: 'Spoon' }, { kind: 'tap', label: 'Top with egg', tool: 'Egg' }],
  },
  machboos: {
    id: 'machboos', name: 'Machboos', arabic: 'مجبوس', description: 'Spiced rice and a generous chicken topping.',
    steps: [{ kind: 'tap', label: 'Scoop the rice', tool: 'Rice' }, { kind: 'tap', label: 'Add the chicken', tool: 'Chicken' }],
  },
};

export const ROUND_MS = 60_000;
export const RECIPE_IDS: readonly RecipeId[] = ['karak', 'samboosa', 'halwa', 'balaleet', 'machboos'];
export type Stars = 0 | 1 | 2 | 3;

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, finite(value, min)));
}

export function normalizeQuality(value: number): number {
  return clamp(value, 0, 1);
}

function normalizeDay(day: number): number {
  return Math.floor(clamp(day, 1, 10_000));
}

export interface DayConfig {
  day: number;
  recipes: readonly RecipeId[];
  maxOrders: number;
  arrivalMs: number;
  patienceMs: number;
  starThresholds: readonly [number, number, number];
}

/** Recipes unlock quickly; later days add only a small, capped amount of pressure. */
export function dayConfig(day: number): DayConfig {
  const safeDay = normalizeDay(day);
  const pressure = Math.min(safeDay - 1, 6);
  const starScale = 1 + pressure * 0.05;
  return {
    day: safeDay,
    recipes: RECIPE_IDS.slice(0, Math.min(5, safeDay + 1)),
    maxOrders: safeDay === 1 ? 2 : 3,
    arrivalMs: 4_000 - pressure * 200,
    patienceMs: 18_000 - pressure * 750,
    starThresholds: [Math.round(500 * starScale), Math.round(1_300 * starScale), Math.round(2_300 * starScale)],
  };
}

export interface Order {
  id: number;
  recipe: RecipeId;
  customer: number;
  patienceMs: number;
  remainingMs: number;
  createdAtMs: number;
  expiresAtMs: number;
  step: number;
  qualities: number[];
}

export interface RunEvent {
  serial: number;
  type: 'arrival' | 'step' | 'serve' | 'miss' | 'finish';
  text: string;
  points: number;
  orderId: number | null;
  recipe: RecipeId | null;
  perfect?: boolean;
}

export interface RunState {
  day: number;
  seed: number;
  elapsedMs: number;
  remainingMs: number;
  orders: Order[];
  selectedId: number | null;
  score: number;
  served: number;
  missed: number;
  combo: number;
  bestCombo: number;
  perfect: number;
  status: 'playing' | 'finished';
  lastEvent: RunEvent | null;
  arrivalAtMs: number;
  nextOrderId: number;
  eventSerial: number;
}

export type Run = RunState;

// A stateless integer hash gives every order a repeatable customer and recipe.
function randomAt(seed: number, index: number): number {
  let n = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
  n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
  return ((n ^ (n >>> 15)) >>> 0) / 4_294_967_296;
}

function event(run: RunState, update: Omit<RunEvent, 'serial'>): Pick<RunState, 'lastEvent' | 'eventSerial'> {
  const serial = run.eventSerial + 1;
  return { eventSerial: serial, lastEvent: { ...update, serial } };
}

function addOrder(run: RunState): RunState {
  const config = dayConfig(run.day);
  if (run.orders.length >= config.maxOrders) return run;
  const id = run.nextOrderId;
  const recipe = id === 1 ? 'karak' : config.recipes[Math.floor(randomAt(run.seed, id) * config.recipes.length)]!;
  const order: Order = {
    id,
    recipe,
    customer: Math.floor(randomAt(run.seed, id + 10_000) * 6),
    patienceMs: config.patienceMs,
    remainingMs: config.patienceMs,
    createdAtMs: run.elapsedMs,
    expiresAtMs: run.elapsedMs + config.patienceMs,
    step: 0,
    qualities: [],
  };
  return {
    ...run,
    orders: [...run.orders, order],
    selectedId: run.selectedId ?? id,
    nextOrderId: id + 1,
    ...event(run, { type: 'arrival', text: `${RECIPES[recipe].name}, please!`, points: 0, orderId: id, recipe }),
  };
}

export function createRun(day = 1, seed = 1): RunState {
  const config = dayConfig(day);
  return addOrder({
    day: config.day,
    seed: Math.floor(finite(seed, 1)) >>> 0,
    elapsedMs: 0,
    remainingMs: ROUND_MS,
    orders: [],
    selectedId: null,
    score: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    perfect: 0,
    status: 'playing',
    lastEvent: null,
    arrivalAtMs: config.arrivalMs,
    nextOrderId: 1,
    eventSerial: 0,
  });
}

export function activeOrder(run: RunState): Order | undefined {
  return run.orders.find(order => order.id === run.selectedId);
}

export function selectOrder(run: RunState, id: number): RunState {
  if (run.status !== 'playing' || run.selectedId === id || !run.orders.some(order => order.id === id)) return run;
  return { ...run, selectedId: id };
}

function moveClock(run: RunState, elapsedMs: number): RunState {
  return {
    ...run,
    elapsedMs,
    remainingMs: Math.max(0, ROUND_MS - elapsedMs),
    orders: run.orders.map(order => ({ ...order, remainingMs: Math.max(0, order.expiresAtMs - elapsedMs) })),
  };
}

function wakeEmptyQueue(run: RunState): RunState {
  return run.orders.length === 0
    ? { ...run, arrivalAtMs: Math.min(run.arrivalAtMs, run.elapsedMs + 650) }
    : run;
}

function expireOrders(run: RunState): RunState {
  const expired = run.orders.filter(order => order.expiresAtMs <= run.elapsedMs);
  if (!expired.length) return run;
  const orders = run.orders.filter(order => order.expiresAtMs > run.elapsedMs);
  let updated: RunState = {
    ...run,
    orders,
    selectedId: orders.some(order => order.id === run.selectedId) ? run.selectedId : orders[0]?.id ?? null,
    missed: run.missed + expired.length,
    combo: 0,
  };
  for (const order of expired) {
    updated = {
      ...updated,
      ...event(updated, { type: 'miss', text: 'Next plate, fresh start!', points: 0, orderId: order.id, recipe: order.recipe }),
    };
  }
  return wakeEmptyQueue(updated);
}

/** Process every arrival and deadline at its own time, even after a long frame. */
export function tickRun(run: RunState, dtMs: number): RunState {
  const delta = clamp(dtMs, 0, ROUND_MS);
  if (run.status !== 'playing' || delta === 0) return run;
  const target = Math.min(ROUND_MS, run.elapsedMs + delta);
  let updated = run;
  while (updated.elapsedMs < target) {
    const deadline = updated.orders.reduce((earliest, order) => Math.min(earliest, order.expiresAtMs), Infinity);
    const nextEventAt = Math.min(updated.arrivalAtMs, deadline, target);
    updated = moveClock(updated, nextEventAt);
    // The bell ends the rush; customers still waiting are not extra misses.
    if (nextEventAt >= ROUND_MS) {
      return {
        ...updated,
        status: 'finished',
        ...event(updated, { type: 'finish', text: 'A lovely day at the souq!', points: 0, orderId: null, recipe: null }),
      };
    }
    // Expiry precedes an arrival at the same time, so a freed spot can be used.
    updated = expireOrders(updated);
    if (updated.arrivalAtMs <= nextEventAt) {
      updated = addOrder(updated);
      updated = { ...updated, arrivalAtMs: updated.arrivalAtMs + dayConfig(updated.day).arrivalMs };
    }
  }
  return updated;
}

export function completeStep(run: RunState, quality: number): RunState {
  if (run.status !== 'playing') return run;
  const selected = activeOrder(run);
  if (!selected || selected.remainingMs <= 0 || selected.step >= RECIPES[selected.recipe].steps.length) return run;
  const safeQuality = normalizeQuality(quality);
  const step = selected.step + 1;
  const completed = { ...selected, step, qualities: [...selected.qualities, safeQuality] };
  return {
    ...run,
    orders: run.orders.map(order => order.id === selected.id ? completed : order),
    ...event(run, {
      type: 'step',
      text: step === RECIPES[selected.recipe].steps.length ? 'Ready to serve!' : safeQuality >= 0.9 ? 'Lovely!' : 'Looking good!',
      points: 0,
      orderId: selected.id,
      recipe: selected.recipe,
      perfect: safeQuality >= 0.9,
    }),
  };
}

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(5, Math.max(0, Math.floor(finite(combo)) - 1)) * 0.2;
}

export interface ScoreBreakdown {
  points: number;
  base: number;
  tip: number;
  multiplier: number;
  quality: number;
  perfect: boolean;
}

/** Combo is the new streak length including the plate being scored. */
export function scoreOrder(order: Order, combo: number): ScoreBreakdown {
  const count = RECIPES[order.recipe].steps.length;
  const qualities = Array.from({ length: count }, (_, index) => normalizeQuality(order.qualities[index] ?? 0));
  const quality = qualities.reduce((sum, value) => sum + value, 0) / count;
  const perfect = qualities.every(value => value >= 0.9);
  const speed = normalizeQuality(order.patienceMs > 0 ? order.remainingMs / order.patienceMs : 0);
  const base = Math.round(40 + 80 * quality);
  const tip = Math.round(30 * speed * quality);
  const multiplier = comboMultiplier(combo);
  const points = Math.round((base + tip + (perfect ? 20 : 0)) * multiplier);
  return { points, base, tip, multiplier, quality, perfect };
}

export function serveOrder(run: RunState, id: number | null = run.selectedId): RunState {
  if (run.status !== 'playing') return run;
  const order = run.orders.find(candidate => candidate.id === id);
  if (!order || order.remainingMs <= 0 || order.step !== RECIPES[order.recipe].steps.length) return run;
  const combo = run.combo + 1;
  const scoring = scoreOrder(order, combo);
  const orders = run.orders.filter(candidate => candidate.id !== id);
  const updated: RunState = {
    ...run,
    orders,
    selectedId: orders.some(candidate => candidate.id === run.selectedId) ? run.selectedId : orders[0]?.id ?? null,
    score: run.score + scoring.points,
    served: run.served + 1,
    combo,
    bestCombo: Math.max(run.bestCombo, combo),
    perfect: run.perfect + (scoring.perfect ? 1 : 0),
    ...event(run, {
      type: 'serve',
      text: scoring.perfect ? 'Perfect plate!' : 'Made with love!',
      points: scoring.points,
      orderId: order.id,
      recipe: order.recipe,
      perfect: scoring.perfect,
    }),
  };
  return wakeEmptyQueue(updated);
}

export function roundStars(run: Pick<RunState, 'day' | 'score'>): Stars {
  const score = Math.max(0, finite(run.score));
  return dayConfig(run.day).starThresholds.reduce<number>((stars, threshold) => stars + (score >= threshold ? 1 : 0), 0) as Stars;
}

/** The gold band is generous: 62–82% of the cup makes a perfect pour. */
export function pourQuality(fill: number): number {
  const distance = Math.abs(normalizeQuality(fill) - 0.72);
  return normalizeQuality(1 - Math.max(0, distance - 0.100_000_001) / 0.42);
}

/** One complete circle is enough; extra circles never punish the player. */
export function stirQuality(turns: number): number {
  return normalizeQuality(turns);
}
