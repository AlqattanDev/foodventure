# STATUS — Foodventure: Khaliji Edition

**What this is:** Mobile-first, stylized **3D** cooking game. One stall, one dish (Halwa Bahrainiya) in three variations, hand-cooked via a two-phase mini-game. Visuals are the differentiator: warm, cartoonish, premium.

## Stack
React + TypeScript + Vite · Three.js via React Three Fiber + Drei · postprocessing (bloom / DoF / vignette) · framer-motion (2D UI juice) · Zustand · vitest · Capacitor (mobile packaging — Milestone 4, next).

## Current state (Milestones 1–3 done — the full loop plays)
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

## What's NOT built yet
- **Milestone 4:** Capacitor iOS/Android packaging + native haptics + touch-target/safe-area pass on device.
- Real art assets (still stylized placeholder geometry — but the cooking halwa is a proper hero now).

## Next steps
1. Capacitor: add `@capacitor/core cli ios android haptics`, `capacitor.config.ts`, `npx cap add ios/android`, build + run on a device/simulator.
2. Tune stir/burn balance on a real phone; verify haptics fire natively.

## Scope discipline
V1 = one stall, one dish, three variations. Everything else (cities, staff, weather, spice souq, events, family legacy) is **roadmap only** → see `docs/VISION.md`.

## Build brief
Full self-contained build prompt: `BUILD_PROMPT.md`.
