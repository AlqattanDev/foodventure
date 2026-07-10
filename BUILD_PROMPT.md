# Build Prompt — Foodventure: Khaliji Edition (V1)

_Self-contained brief for an AI agent (Fable 5 or any) picking up this repo. The scaffold already exists and runs (`npm run dev`); this defines what to build on top of it._

You are building a **mobile-first, stylized 3D cooking game**. After "it works," your #1 job is that **it looks stunning** — cartoonish, warm, premium. Visuals are the entire differentiator. Treat the art direction as law.

## Stack (already set up — use it, don't swap)
- React + TypeScript + Vite
- Three.js via React Three Fiber (`@react-three/fiber`) + Drei
- Post-processing via `@react-three/postprocessing` (bloom, DoF, vignette)
- Zustand for game state
- Capacitor for iOS/Android packaging (not wired yet)
- Target: **portrait phone**, touch controls, 60fps on a mid-range phone. Low polycounts; beauty comes from lighting + post FX, not geometry.

## The game (V1 — build only this)
A single street-food stall. One dish: **Halwa Bahrainiya** (real Bahraini halwa). The player cooks it by hand, earns a **1–5 star** rating on execution, sells it, earns money, upgrades. The whole loop: **cook → rate → sell → earn → unlock → cook a harder version.** Nothing outside this loop.

### Scene / camera
Fixed, gently top-down camera on a cozy stall **diorama** (already built with placeholders): plinth, back wall + pillars, counter, stove with **hero copper pot + glossy halwa**, prep plate, ingredient shelf, chef. Reads as a warm handheld little world. Only subtle idle camera drift.

### The dish: 3 variations = the progression ladder
1. **Classic Halwa** — unlocked at start.
2. **Saffron Halwa** — unlocks after a star threshold on Classic.
3. **Royal Halwa** (nuts + rose water) — unlocks after Saffron; hardest, highest price.
Each harder to cook, worth more. Use a **real halwa method and real ingredients** (cornflour/starch, sugar, ghee, saffron, cardamom, rose water, nuts) — no invented steps.

### Cooking mini-game — two phases (this is the fun; make it juicy)
**Phase 1 — Prep:** drag/tap real ingredients from the shelf onto the prep plate in the right amounts (simple targets). Wrong amounts lower the score. Everything animates with satisfying squash/pop.

**Phase 2 — Cook (the heart):** **stir by dragging a finger in circles** in the pot, keeping a steady rhythm so it doesn't burn; manage heat; **tap to add saffron / rose water at the right moment** (clear timing cue). Burning or bad timing lowers the score. Rich feedback: halwa changes color + sheen as it cooks, steam curls, it bubbles, gentle haptics.

**Result:** combined execution → **1–5 stars** with a satisfying rating flourish. Stars set the price. Burnt batch = penalty/waste.

### Sell & progress (keep dead simple)
After cooking, a couple of cute customers buy; **price scales with stars**; money accumulates. Spend on a short upgrade track: **better pot** (more forgiving stir), **better stove** (finer heat control), and the **unlocks** for Saffron and Royal. No supply chain, no staff, no inventory in V1.

## ART DIRECTION (the differentiator — do not cut corners)
- **Cartoonish, not realistic.** Chunky, rounded, readable shapes; premium cozy-diorama feel.
- **Warm Khaliji palette:** golden ambers, terracotta, cream, deep saffron, soft teal accents. One cohesive set.
- **Lighting is the magic:** soft warm key + gentle ambient/baked-feel GI, cozy shadows, warm rim light on halwa + chef.
- **Post-processing:** tasteful bloom on lights + glistening halwa, mild depth-of-field for the "tiny world" look, subtle vignette. Cozy, never blown out.
- **Juice everywhere:** squash-and-stretch on every interaction, springy easing, sparkles on a nailed step, steam/sizzle, chef reaction on 5 stars.
- **Materials:** stylized toon-ish shading; the **halwa is the hero — make it gooey, glossy, delicious.** Spend polish budget there.
- Respectful, authentic Khaliji atmosphere. No pay-to-win, no grind.

## Milestones (ship in order; verify each before the next)
1. ✅ **Diorama + camera + lighting/post** looking gorgeous with placeholders (done — mood proven).
2. **Phase 2 stirring** mini-game with the halwa cooking visually + star scoring.
3. **Phase 1 prep**, then wire the full **cook → rate → sell → earn → upgrade/unlock** loop across all 3 variations.
4. **Capacitor** mobile build + touch/haptics pass.

Prove the cooking *feels* fun and *looks* stunning on a phone before anything else. Provide a runnable dev build and screenshots at each milestone.

## Out of scope for V1 (do NOT build — roadmap only, see `docs/VISION.md`)
More dishes/stations, supply chain, staff/hiring, restaurant expansion, multiple cities, reputation/reviews, events, family legacy, spice trading, weather/time system.
