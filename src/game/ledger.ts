/**
 * The books — a real tycoon closes its day and reads the P&L. Pure logic,
 * tested. The store accumulates the day's tallies while the stall is open;
 * closing the day folds them into a DayLedger and a coin delta.
 *
 * Wages are per-day payroll and rent is due nightly — fixed costs you feel,
 * unlike invisible per-tip cuts.
 */

export const DAY_SECONDS = 180;

export const WAGE = { server: 15, chef: 25 };

/** Rent per day by floor tier (0 = terrace, 1 = + majlis wing). */
export const RENT = [10, 25];

export interface StaffCounts {
  servers: number;
  chefs: number;
}

/** What the open day accumulated, folded at close-out. */
export interface DayTallies {
  revenue: number;
  /** market spend attributed to this day (incl. pending spend from prep) */
  ingredientSpend: number;
  served: number;
  lost: number;
}

export interface DayLedger extends DayTallies {
  day: number;
  wages: number;
  rent: number;
  net: number;
  repStart: number;
  repEnd: number;
}

export function wagesFor(staff: StaffCounts): number {
  return staff.servers * WAGE.server + staff.chefs * WAGE.chef;
}

export function rentFor(floorTier: number): number {
  return RENT[Math.max(0, Math.min(RENT.length - 1, floorTier))];
}

/**
 * Fold an open day into its ledger. Revenue was already paid into the till
 * serving-by-serving; the close-out charges the fixed costs, so the coin
 * delta at close is -(wages + rent), floored so the till never goes negative
 * (the shortfall still shows in the ledger's net).
 */
export function closeOutDay(
  day: number,
  tallies: DayTallies,
  staff: StaffCounts,
  floorTier: number,
  repStart: number,
  repEnd: number,
  coins: number
): { ledger: DayLedger; coinsAfter: number } {
  const wages = wagesFor(staff);
  const rent = rentFor(floorTier);
  const net = tallies.revenue - tallies.ingredientSpend - wages - rent;
  return {
    ledger: { day, ...tallies, wages, rent, net, repStart, repEnd },
    coinsAfter: Math.max(0, coins - wages - rent),
  };
}

/** How many past ledgers the books keep (the panel charts a week). */
export const LEDGER_HISTORY = 14;
