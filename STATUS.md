# STATUS — Foodventure: Khaliji Edition

**What this is:** Mobile-first, stylized 3D cooking-tycoon game. You really cook Halwa Bahrainiya with your hands (tilt-pour measuring, free stirring over a pot that scorches where you neglect it), then run a live souq eatery — tables, walking customers, a server and a chef on payroll, ingredients bought at the souq market.

## Stack
React + TypeScript + Vite · Three.js via React Three Fiber + Drei · postprocessing · framer-motion · Zustand · vitest · Capacitor 6 (iOS + Android shells wired).

## Current state (V3 Milestones 1–6 done)
`npm run dev` runs it; `npm run build` and `npm test` green (**73 tests**).

### The cook — hands, not bars (M1–M2)
- **Measuring** (`ui/cook/PourVessel.tsx` + `game/pour.ts`): hold a vessel, drag up to tilt; the level rises to an etched line on the bowl. The stream dribbles off when you right it; overshoot is spooned back slowly. No gauges.
- **Stirring** (`ui/cook/StirPad.tsx` + `game/stir.ts`): the finger is the paddle, any path counts. The pot bottom is a scorch grid — neglected cells visibly darken, then permanently scorch, with smoke off the worst spot. Coverage matters, not rhythm; the V1/V2 circular-tempo mechanic is deleted.
- **Heat** (`ui/cook/GasKnob.tsx` + `game/burner.ts`): a gas knob with thermal lag; the thermometer is the pot's rim bubbles (still/beads/simmer/rolling).
- **Ghee & spices** (`ui/cook/DragAdd.tsx`): physically dragged to the pot in their timing windows.
- **The pot is the interface** (`game/cookViz.ts` → `scene/Halwa.tsx`): paddle follows the finger, pour streams fall and splash, ghee pools melt in, scorch patches render as instanced blobs on the dome, sheen dulling = the ghee cue.
- 7 recipe stages (`data/recipes.ts`), engine unchanged in shape (`game/recipe.ts`, tested): syrup base → simmer → slurry → combine (true two-thumb multi-touch) → long stir → spices → player-called doneness.

### The economy (M3)
- `game/pantry.ts` + `data/ingredients.ts`: real stock, consumed at pot-on (cookbook amounts). Souq market screen (grain/dairy/spice/nuts stalls) fills the shelf; shelf upgrades raise capacity. No-softlock neighbour rule (broke + empty shelf → free classic basics).
- Cookbook shows have/need; cook button becomes "to the souq" when short.
- **Persistence**: full save to localStorage on every change (`foodventure-save-v3`).

### The eatery (M4–M5)
- `game/eatery.ts` (pure sim, tested): customers walk in from the souq gate, queue, seat at terrace tables (2 owned → 6 buyable), order, patience drains, eat, tip by quality × freshness of patience, leave; reputation (0..5) drives walk-in rate.
- A finished cook = a 5-serving batch at that run's stars, stocked at the counter ("To the counter →" on the rating card). Serving = tapping order chips with patience rings (`ui/ServeTray.tsx`); instant sale is gone.
- **Live-cook rule:** a service cook leaves the world running (a "🧍 N waiting" badge shows the pressure); only a **practice cook** (book page toggle, half ingredients, no batch) pauses it.
- **Staff** (`game/staff.ts` tested + `game/eateryLive.ts`): hired **server** walks plates to tables (keeps 20% of tips); hired **chef** (gated on mastering a dish) auto-cooks mastered dishes at one star below your best, consuming real pantry stock, 12 coins/batch.

### Mastery ladder (from V2, unchanged)
Two 4★+ guided runs unlock memory mode; two 4★+ memory runs = 🏅 MASTERED (gates the chef).

## Architecture notes
- Game state: Zustand `state/game.ts` (phases, economy, pantry, batches, staff, persistence).
- 60fps visuals: mutable singletons outside React — `game/cookViz.ts` (pot), `game/eateryLive.ts` (floor + staff bodies) — sims write, R3F reads.
- Pure logic modules all unit-tested driving production paths: `pour`, `stir`, `burner`, `recipe`, `scoring`, `mastery`, `pantry`, `eatery`, `staff`.
- Dev handles on `window`: `useGame`, `cookViz`, `eatery`, `staffLive`, `__pour`.

## Deploy (exidex showcase)
- exidex.dev/foodventure — `npm run exidex` rebuilds `.exidex/`; commit + push and the Mini pulls it. Card is currently `hidden: true` (Ali's call, pending his playtest).
- Remote: `github.com/AlqattanDev/foodventure`.

## Mobile (Capacitor)
- `npm run ios` / `npm run android` (builds web, `cap sync`, opens IDE). Multi-touch combine stage and haptics need a real-device pass.

## Known gaps / next steps
1. **Ali playtest** — the whole point of V3 was feel; nothing else moves until he plays it (web or device) and verdicts the cook + the floor.
2. Balance pass with real play data (tips vs ingredient costs vs staff cuts are first-guess numbers).
3. Final art/juice pass (Milestone 6 of PLAN.md was cleanup + deploy; the big art polish still waits on validated gameplay).
4. On-device run (signing) — everything is wired.
