# STATUS — Foodventure: Khaliji Edition

**What this is:** Mobile-first, stylized **3D** cooking game. One stall, one dish (Halwa Bahrainiya) in three variations, hand-cooked via a two-phase mini-game. Visuals are the differentiator: warm, cartoonish, premium.

## Stack
React + TypeScript + Vite · Three.js via React Three Fiber + Drei · postprocessing (bloom / DoF / vignette) · framer-motion (2D UI juice) · Zustand · vitest · Capacitor 6 (iOS + Android shells wired).

## Current state (Milestones 1–4 done — full loop + mobile shells)
`npm run dev` → the game runs; `npm run build` and `npm test` are green (15 tests).

**The loop works end to end:** cook → rate → sell → earn → upgrade/unlock, across all three halwa.

- ✅ Cozy stall **diorama** with a live **hero halwa** (`Halwa.tsx`) that cooks in real time — pale starch → glossy amber, bubbles with the stir, scorches if burnt, sparkles on a nailed spice add.
- ✅ **Camera rig** (`CameraRig.tsx`) eases between per-phase framings; DoF backs off for the close-up mini-games.
- ✅ Reactive **chef** (`Chef.tsx`) — bobs while cooking, hops on a 4–5★ result.
- ✅ **Phase 1 Prep** (`PrepGame.tsx`) — hold-to-pour each real ingredient, release in the green band.
- ✅ **Phase 2 Cook** (`CookGame.tsx`, the heart) — drag in circles at a steady rhythm; keep it moving or it burns; manage heat (Low/Med/High); tap the spice cue on time. Live meters + tempo ring.
- ✅ **Rating** flourish, **Sell** (cute customers + coins), **Upgrade shop** (Copper Pot / Brass Stove, 3 tiers each) and **recipe unlocks** (Saffron needs 3★ on Classic + coins; Royal needs 3★ on Saffron).
- ✅ Pure, tested scoring (`game/scoring.ts` + `scoring.test.ts`).

## Architecture notes
- Game state: Zustand store `state/game.ts` (phases, economy, upgrades, results).
- 60fps cook visuals share a mutable singleton `game/cookViz.ts` (the sim writes, the 3D reads) — deliberately outside React to avoid re-render churn.
- Haptics wrapper `game/haptics.ts` (Web Vibration now; swaps to Capacitor Haptics in the native build).
- All 2D screens live under `src/ui/` and switch on phase via `ui/GameUI.tsx`.
- Dev-only: `window.useGame` / `window.cookViz` are exposed for manual verification.

## Deploy (exidex showcase)
- Live at **exidex.dev/foodventure** — the Mac Mini showcase serves `.exidex/` (built game + `card.json`) straight from the repo.
- `npm run exidex` rebuilds and stages `dist/` into `.exidex/` (keeps `card.json`); commit + push, then the Mini's sync pulls it.
- Remote: `github.com/AlqattanDev/foodventure`.

## Mobile (Capacitor)
- `capacitor.config.ts` (appId `dev.exidex.foodventure`, webDir `dist`), plugins: haptics, app, status-bar.
- `native.ts` runs at boot — sets the status bar / overlay on device, no-ops on web.
- iOS + Android native projects live in `ios/` and `android/` (gitignored — regenerate with `npx cap add ios android`).
- Run on device: `npm run ios` / `npm run android` (builds web, `cap sync`, opens Xcode/Studio). `npm run cap:sync` to just push web changes.

## What's NOT built yet
- On-device run: open in Xcode/Studio and run on a simulator/phone (needs signing). Everything is wired for it.
- Real art assets (still stylized placeholder geometry — but the cooking halwa is a proper hero now).

## Direction: V2 redesign (see PLAN.md)
Ali's verdict on the V1 loop: a rhythm mini-game in a cooking costume — boring, and "add cardamom" makes no sense without a recipe. **PLAN.md** defines V2: the real Halwa Bahrainiya recipe as gameplay (cookbook → guided stages → mastery from memory) plus a live-stall tycoon (customer queue, serving, apprentice). Build proceeds by PLAN.md milestones.

A first procedural art pass is on main (rounded copper pot + paddle, expressive chef, striped awning + bunting, lanterns, rug, tiled floor, spice sacks, dallah, glowing arch window); final art polish is PLAN.md Milestone 6.

**V2 Milestones 1–3 are done.** The game now plays the real recipe:
- `game/recipe.ts` — pure staged-cook engine (6 stage kinds, per-stage scorers, weighted rating, no-skippable-stage cap), 21 tests.
- `data/recipes.ts` — 3 halwa recipes, real ingredients/amounts, educational step text.
- **Cookbook** (`ui/RecipeBook.tsx`) — warm paper page: ingredients w/ amounts (EN+AR), the method with tips; flow is select → book → cook.
- **Staged cook** (`ui/StagedCook.tsx`) — syrup simmer-hold, slurry pours+stir, feathered combine pour while stirring, the long stir with ghee-ladle cues on sheen-dull, timed spices, player-called doneness. Old PrepGame/CookGame deleted.
- Rating card shows the six-stage breakdown + "work on X next time".
- **Mastery ladder** (`game/mastery.ts`, tested): two 4★+ guided runs unlock "from memory" mode (picked on the book page; book closes at pot-on, no instructions/hints, no doneness signal — you read the pot). Two 4★+ memory runs = 🏅 MASTERED (badge on rating, book, dish card).
- Verified in-browser end-to-end with synthetic touch: a neglected pot burns to 0★, a skilled run lands 5★, a missed spice caps at 2★ (engine floor rule); memory mode confirmed to strip all guidance.

## Known gaps
- No persistence — progress resets on reload (add before the stall makes grinding meaningful).

## Next steps
1. PLAN.md Milestone 4: the live stall — customers queue, serve from cooked batches, reputation. (Mastery now gates it: apprentice comes in Milestone 5.)
2. (Parallel, Ali) `npm run ios` on a simulator/device; verify touch + haptics + safe areas.

## Scope discipline
V1 = one stall, one dish, three variations. Everything else (cities, staff, weather, spice souq, events, family legacy) is **roadmap only** → see `docs/VISION.md`.

## Build brief
Full self-contained build prompt: `BUILD_PROMPT.md`.
