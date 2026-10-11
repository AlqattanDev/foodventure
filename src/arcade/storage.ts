import { DEFAULT_PROGRESS, parseProgress, type Progress } from './progress';

export const PROGRESS_KEY = 'foodventure-progress-v1';
export const BEST_KEY = 'foodventure-best';
const TUTORIAL_KEY = 'foodventure-first-cup-v1';

export function loadProgress(): Progress {
  try { return parseProgress(window.localStorage.getItem(PROGRESS_KEY)); }
  catch { return { ...DEFAULT_PROGRESS, dayStars: {} }; }
}

export function saveProgress(progress: Progress): void {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    window.localStorage.setItem(BEST_KEY, JSON.stringify({ score: progress.bestScore, combo: progress.bestCombo }));
  } catch { /* The whole game also works with storage disabled. */ }
}

export function firstCupDone(): boolean {
  try { return window.localStorage.getItem(TUTORIAL_KEY) === 'done'; }
  catch { return false; }
}

export function rememberFirstCup(): void {
  try { window.localStorage.setItem(TUTORIAL_KEY, 'done'); } catch { /* Optional persistence. */ }
}

declare global {
  interface Window {
    arcade?: { submit: (result: { score: number; meta: Record<string, string | number> }) => unknown };
  }
}

export function submitScore(score: number, meta: Record<string, string | number>): void {
  try {
    const result = window.arcade?.submit({ score, meta });
    if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
      void Promise.resolve(result).catch(() => undefined);
    }
  } catch { /* The optional portfolio leaderboard must never interrupt a day. */ }
}
