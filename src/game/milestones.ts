/**
 * Milestone goals — the tycoon ladder. Pure definitions + achievement checks,
 * tested. Rewards are claimed by hand in the business panel (the tap is the
 * dopamine); claims persist in the save.
 */
import type { DishId } from "../data/dishes";
import type { MasteryState } from "./mastery";

export interface BizSnapshot {
  opened: boolean;
  lifetimeServed: number;
  bestDayNet: number;
  servers: number;
  chefs: number;
  floorTier: number;
  reputation: number;
  mastery: Record<DishId, MasteryState>;
}

export interface Milestone {
  id: string;
  emoji: string;
  title: string;
  detail: string;
  reward: number;
  achieved: (s: BizSnapshot) => boolean;
}

export const MILESTONES: Milestone[] = [
  {
    id: "first-batch",
    emoji: "🍯",
    title: "Open for business",
    detail: "Stock your first batch on the counter",
    reward: 20,
    achieved: (s) => s.opened,
  },
  {
    id: "serve-50",
    emoji: "🍽️",
    title: "Fifty plates",
    detail: "Serve 50 customers, lifetime",
    reward: 60,
    achieved: (s) => s.lifetimeServed >= 50,
  },
  {
    id: "profit-100",
    emoji: "💰",
    title: "A golden day",
    detail: "Close a day at +100 net or better",
    reward: 80,
    achieved: (s) => s.bestDayNet >= 100,
  },
  {
    id: "majlis",
    emoji: "🏛️",
    title: "The majlis opens",
    detail: "Build the majlis wing",
    reward: 100,
    achieved: (s) => s.floorTier >= 1,
  },
  {
    id: "full-staff",
    emoji: "🧑‍🤝‍🧑",
    title: "Full house",
    detail: "3 servers and 2 chefs on payroll",
    reward: 120,
    achieved: (s) => s.servers >= 3 && s.chefs >= 2,
  },
  {
    id: "serve-200",
    emoji: "🏆",
    title: "Two hundred plates",
    detail: "Serve 200 customers, lifetime",
    reward: 150,
    achieved: (s) => s.lifetimeServed >= 200,
  },
  {
    id: "rep-top",
    emoji: "⭐",
    title: "The souq talks",
    detail: "Reach a 4.8★ reputation",
    reward: 150,
    achieved: (s) => s.reputation >= 4.8,
  },
  {
    id: "master-all",
    emoji: "🏅",
    title: "Halwa royalty",
    detail: "Master all three halwa",
    reward: 200,
    achieved: (s) => (Object.values(s.mastery) as MasteryState[]).every((m) => m.mastered),
  },
];

/** Ids achieved but not yet claimed. */
export function claimable(s: BizSnapshot, claimed: readonly string[]): Milestone[] {
  return MILESTONES.filter((m) => m.achieved(s) && !claimed.includes(m.id));
}
