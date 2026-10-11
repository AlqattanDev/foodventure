import { roundStars, type RunState, type Stars } from './rules';

export interface Progress {
  version: 1;
  bestScore: number;
  bestCombo: number;
  totalServed: number;
  completedDays: number;
  dayStars: Record<string, Stars>;
  muted: boolean;
  lastRoundId: string | null;
}

export const DEFAULT_PROGRESS: Readonly<Progress> = Object.freeze({
  version: 1,
  bestScore: 0,
  bestCombo: 0,
  totalServed: 0,
  completedDays: 0,
  dayStars: Object.freeze({}),
  muted: false,
  lastRoundId: null,
});

function integer(value: unknown, max: number, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.floor(Math.min(max, Math.max(0, value))) : fallback;
}

function emptyProgress(): Progress {
  return { ...DEFAULT_PROGRESS, dayStars: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Storage is optional and untrusted; reject invalid shapes and bound every count. */
export function parseProgress(raw: string | null): Progress {
  if (!raw || raw.length > 250_000) return emptyProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1) return emptyProgress();
    const dayStars: Record<string, Stars> = {};
    if (isRecord(value.dayStars)) {
      for (const [key, stars] of Object.entries(value.dayStars)) {
        if (!/^[1-9]\d{0,4}$/.test(key) || Number(key) > 10_000) continue;
        dayStars[key] = integer(stars, 3) as Stars;
      }
    }
    return {
      version: 1,
      bestScore: integer(value.bestScore, 1_000_000_000),
      bestCombo: integer(value.bestCombo, 1_000_000),
      totalServed: integer(value.totalServed, 1_000_000_000),
      completedDays: integer(value.completedDays, 9_999),
      dayStars,
      muted: value.muted === true,
      lastRoundId: typeof value.lastRoundId === 'string' && /^[1-9]\d{0,4}:\d{1,10}$/.test(value.lastRoundId) ? value.lastRoundId : null,
    };
  } catch {
    return emptyProgress();
  }
}

/** Repeated handling of the same round result cannot inflate lifetime totals. */
export function recordRound(progress: Progress, run: RunState): Progress {
  if (run.status !== 'finished') return progress;
  const roundId = `${run.day}:${run.seed}`;
  if (progress.lastRoundId === roundId) return progress;
  const stars = roundStars(run);
  const day = Math.max(1, integer(run.day, 10_000, 1));
  const canAdvance = stars >= 1 && day <= progress.completedDays + 1;
  return {
    ...progress,
    bestScore: Math.max(progress.bestScore, integer(run.score, 1_000_000_000)),
    bestCombo: Math.max(progress.bestCombo, integer(run.bestCombo, 1_000_000)),
    totalServed: integer(progress.totalServed + integer(run.served, 1_000_000), 1_000_000_000),
    completedDays: canAdvance ? Math.max(progress.completedDays, Math.min(day, 9_999)) : progress.completedDays,
    dayStars: { ...progress.dayStars, [day]: Math.max(progress.dayStars[day] ?? 0, stars) as Stars },
    lastRoundId: roundId,
  };
}

export function nextDay(progress: Pick<Progress, 'completedDays'>): number {
  return Math.min(10_000, integer(progress.completedDays, 9_999) + 1);
}

/** Cosmetic only: cumulative personal-best stars decorate the stall. */
export function stallLevel(progress: Pick<Progress, 'dayStars'>): 1 | 2 | 3 | 4 {
  const stars = Object.values(progress.dayStars).reduce<number>((sum, value) => sum + integer(value, 3), 0);
  return stars >= 12 ? 4 : stars >= 6 ? 3 : stars >= 2 ? 2 : 1;
}
