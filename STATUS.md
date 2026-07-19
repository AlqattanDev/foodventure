# STATUS — Foodventure: Khaliji Edition

**What this is:** Mobile-first, stylized 3D cooking-tycoon game. You really cook Halwa Bahrainiya with your hands (tilt-pour measuring, free stirring over a pot that scorches where you neglect it), then run a souq eatery as a real business: timed service days, a P&L ledger, payroll, your own menu prices, expansion into a majlis wing, and milestone goals.

## Stack
React + TypeScript + Vite · Three.js via React Three Fiber + Drei · postprocessing · framer-motion · Zustand · vitest · Capacitor 6 (iOS + Android shells wired).

## Current state (V3 M1–M6 + Tycoon T1–T6 done)
`npm run dev` runs it; `npm run build` and `npm test` green (**93 tests**).

### The cook — hands, not bars
- **Measuring** (`ui/cook/PourVessel.tsx` + `game/pour.ts`): hold a vessel, drag up to tilt; the level rises to an etched line. Dribble on cut, slow spoon-back on overshoot. No gauges.
- **Stirring** (`ui/cook/StirPad.tsx` + `game/stir.ts`): the finger is the paddle; the pot bottom is a scorch grid — neglected cells darken, then permanently scorch, with smoke off the worst spot. Coverage matters, not rhythm.
- **Heat** (`ui/cook/GasKnob.tsx` + `game/burner.ts`): gas knob with thermal lag; rim bubbles are the thermometer.
- **Ghee & spices** (`ui/cook/DragAdd.tsx`): physically dragged to the pot in their windows.
- **The pot is the interface** (`game/cookViz.ts` → `scene/Halwa.tsx`): paddle follows the finger, pour streams splash, ghee pools melt, scorch patches render on the dome.
- 7 recipe stages (`data/recipes.ts` → `game/recipe.ts`, tested), incl. the two-thumb combine and player-called doneness. Mastery ladder (guided → memory → 🏅 MASTERED) gates the chefs.

### The tycoon — a real business
- **Service days** (`game/ledger.ts` + `game/eateryLive.ts`): "☀️ Open the Stall" starts a 180s day; the world runs ONLY while open (service cooks mid-day keep it running; practice cooks pause it). Close-out (timer, or "close up") sweeps unserved guests as losses and shows the **ledger card**: revenue − ingredients − wages − rent = net, rep delta, shortfall warning. History persists (14 days).
- **Menu & pricing** (`game/menu.ts` + `ui/MenuBoard.tsx`): per-dish price multiplier 0.6x–1.6x + on/off. Price drives demand (pricey = ordered less), pay (price + freshness tip), and the value verdict — overpricing low-star food reads "ripped off" and costs reputation; bargains build it.
- **Staff roster** (`game/staff.ts`): up to 3 servers + 2 chefs, hired at rising prices, wages at close-out (15/25 per day each). Servers walk plates (never double-targeting); chefs auto-cook mastered dishes at best-minus-one star, consuming real stock (chef #2 needs the Second Stove). Big Pot = 7-serving batches.
- **Expansion** (`scene/Eatery.tsx`): terrace tables 1–6, then the **majlis wing** (500 coins, 3★ rep) physically builds a roofed, carpeted room with tables 7–10, richer guests (1.35x pay) and higher rent. Camera widens to hold it.
- **The Books** (`ui/BusinessPanel.tsx` + `game/milestones.ts`): last-7-days net bars around a zero line, souq rating, all-time stats, 8 claimable milestone rewards.
- **Souq market depth** (`game/pantry.ts` + `ui/Market.tsx`): daily price wobble ±20% (deterministic per day, ▲▼ shown), bulk +5 buys at 15% off, finite shelves, consumption at pot-on, the Umm-Khalid no-softlock rule.
- **Serving**: tap order chips with patience rings (`ui/ServeTray.tsx`), or let servers run it; "🧍 N waiting" pressure badge during mid-day cooks.

## Architecture notes
- Zustand `state/game.ts` owns economy/day/menu/staff/save (localStorage `foodventure-save-v3`, staff-shape migration included).
- 60fps mutable singletons outside React: `cookViz` (pot), `eatery`/`staffLive`/`dayLive` (floor, staff bodies, day clock).
- Pure tested modules: `pour`, `stir`, `burner`, `recipe`, `scoring`, `mastery`, `pantry`, `eatery`, `staff`, `menu`, `ledger`, `milestones`.
- Dev handles on `window`: `useGame`, `cookViz`, `eatery`, `staffLive`, `dayLive`, `__pour`.

## Deploy (exidex showcase)
- exidex.dev/foodventure — `npm run exidex` rebuilds `.exidex/` (preserves card.json + thumb.png); commit + push, Mini pulls. Card is `hidden: true` pending Ali's playtest.
- Remote: `github.com/AlqattanDev/foodventure`.

## Mobile (Capacitor)
`npm run ios` / `npm run android`. The two-thumb combine stage + haptics need a real-device pass.

## Known gaps / next steps
1. **Ali playtest** — the cook feel AND the tycoon day-loop both need his verdict before anything else moves.
2. Balance from real play (first-guess numbers: day 180s, wages 15/25, rent 10/25, majlis 500@3★, serving pay 0.28×base×stars×mult).
3. Final art/juice pass after validated gameplay.
4. On-device run (signing).
