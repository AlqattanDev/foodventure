# STATUS — Foodventure: Khaliji Edition

**What this is:** Mobile-first, stylized **3D** cooking game. One stall, one dish (Halwa Bahrainiya), hand-cooked via a two-phase mini-game. Visuals are the differentiator: warm, cartoonish, premium.

## Stack
React + TypeScript + Vite · Three.js via React Three Fiber + Drei · postprocessing (bloom / DoF / vignette) · Zustand · Capacitor (mobile packaging, not wired yet).

## Current state (Milestone 1 — mood)
- ✅ Scaffold runs: `npm run dev` → http://localhost:5173 . Typecheck clean.
- ✅ Cozy stall **diorama** with placeholder shapes: plinth, back wall + pillars, counter, stove, **hero copper pot with glossy halwa**, prep plate, ingredient shelf, chef.
- ✅ Warm lighting + hanging lamps, curling steam, soft shadows.
- ✅ Post-processing: bloom, depth-of-field, vignette (the "tiny handheld world" look).
- ✅ Placeholder HUD (coins, dish name, stars, Start Cooking button).

## What's NOT built yet
- Cooking mini-game (Phase 1 prep, Phase 2 stirring) — **Milestone 2–3**.
- Star scoring → price → sell → earn → upgrade/unlock loop.
- 3 halwa variations (Classic → Saffron → Royal).
- Real art assets (everything is placeholder geometry).
- Capacitor mobile build + haptics.

## Next steps
1. Eyeball the mood at localhost:5173; tune palette/lighting to taste.
2. Build Phase 2 stirring mini-game with live halwa cook + star scoring.
3. Phase 1 prep, then wire the full loop.
4. Capacitor pass for iOS/Android.

## Scope discipline
V1 = one stall, one dish, three variations. Everything else (cities, staff, weather, spice souq, events, family legacy) is **roadmap only** → see `docs/VISION.md`.

## Build brief
Full self-contained build prompt (for Fable 5 or any agent): `BUILD_PROMPT.md`.
