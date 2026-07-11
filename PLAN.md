# PLAN — Foodventure V2: Real Recipe + Live Stall

_Agreed with Ali by voice, 2026-07-11. This replaces the old "polish V1" direction._

## Why the pivot

Ali's verdict on V1: **"a rhythm mini-game wearing a cooking costume — boring."** Concretely:

1. The cooking makes no sense as cooking. You "add cardamom" out of nowhere — no recipe, no steps, no process, no idea what you're making or why. There must be a **cookbook** that teaches the real recipe before you cook.
2. Nothing to play after three cooks. After mastering a dish there must be a **tycoon**: customers coming to the stall, serving them, hiring staff.

Design pillars (Ali's words distilled):
- **The real Halwa Bahrainiya process IS the gameplay.** Educational for real — a player walks away knowing how halwa is actually made.
- **Learn → master:** the cookbook guides early cooks; for mastery runs the book is study-before, closed during. Mastery = cooking from memory.
- **After mastery, the stall goes live:** customer queue, serve to keep up, apprentice auto-cooks mastered dishes.
- Scope: **halwa only** (3 variations stay). More dishes later. Existing touch mechanics (hold-pour, circular stir, heat, timed taps) are reused inside the real steps, not thrown away.

## Part A — The recipe rework

Real Halwa Bahrainiya stages → game stages (each reuses an existing mechanic):

| # | Stage | Real process | Mechanic |
|---|-------|--------------|----------|
| 1 | Syrup | Sugar + water + saffron, bring to a simmer without scorching | Heat control (existing Low/Med/High) until simmer band, hold it |
| 2 | Slurry | Cornstarch + cold water, whisk smooth | Hold-to-pour (existing) + stir until "smooth" meter fills |
| 3 | Combine | Pour slurry into syrup slowly, stirring constantly | Hold-pour with one thumb WHILE stirring with the other (or alternating) — pour too fast = lumps |
| 4 | The Long Stir | Stir continuously on medium; add ghee in 3 batches as the mass absorbs it; turns translucent amber | Existing stir rhythm + heat, ghee-add cue = sheen visibly dulls; tap the ghee ladle then |
| 5 | Spices | Cardamom + rosewater in the right window near the end | Existing timed tap, but now it's named, shown in the recipe, and makes sense |
| 6 | Finish | Sprinkle nuts; halwa is done when translucent + glossy — cook decides | Player CALLS doneness (new). Pull early = pale/loose, late = dark/rubbery. Replaces auto-end |

### Cookbook
- **Pre-cook recipe book UI**: real ingredients with real amounts, the steps above, a tip per step. Genuine educational content (halwa Bahrainiya is starch-based, not flour; the stir is long and patient; ghee goes in batches). Bilingual flavor (EN primary, Arabic names).
- **Guided mode** (default): during the cook, current step + next-action hint stay visible.
- **Mastery mode**: unlocked after scoring 4★+ twice on a dish. Book readable before the cook, disappears at pot-on. Only mastery runs advance mastery. Mastery achieved at (say) two 4.5★ memory runs → unlocks that dish for the apprentice + stall progression.
- Per-stage scoring feeding the star rating; the rating card shows which stage cost you.

### Engine
- `game/recipe.ts`: pure stage machine — stages, goals, cues, per-stage scoring. **Fully unit-tested, production path** (UI drives it, tests import it).
- `data/recipes.ts` replaces `data/dishes.ts`: full recipe struct (steps, ingredient list w/ amounts, cue windows, durations, edu text per step). 3 halwa variations = same stages, different spice/ghee windows + ingredients.
- Keep the `cookViz` singleton pattern for 60fps visuals; extend it (sheen-dull ghee cue, translucency progress).

## Part B — Live stall (unlocks at first mastery)

- **Customers** walk up and queue at the counter (spawn rate scales with reputation), each orders a variation they can see is on the menu; patience meter drains.
- **Batches**: one cooked pot = N servings at the batch's star quality. Tap a customer to serve from the pot. Empty pot + growing queue = pressure to cook again. That tension is the game.
- **Apprentice**: hireable with coins once ≥1 dish mastered. Auto-cooks mastered dishes at (your average stars − 0.5). Hand-cooking still wins on quality/tips.
- **Reputation**: from happy customers; drives spawn rate; Saffron/Royal unlock gates become reputation + mastery (replacing pure coin gates).
- Continuous flow for V2 (no day cycle yet).

## Milestones (each: build + tests green → screenshot-verify → commit → push → mini sync)

1. **Recipe engine**: `recipe.ts` stage machine + `recipes.ts` data + tests. No UI yet.
2. **Cookbook + guided cook**: recipe book screen, cook phase rebuilt as the 6 guided stages driving the engine.
3. **Doneness call + mastery**: player-called finish, per-stage rating breakdown, mastery tracking + mastery mode.
4. **Live stall**: customers, queue, serving from batches, reputation.
5. **Apprentice + economy rebalance** (prices, gates on rep+mastery).
6. **Finish the visual pass** on top (half-done art commit already on main: better pot, chef, awning, lanterns, rug, props).

## State when this plan was written

- V1 loop live at exidex.dev/foodventure (commit `ba4728c`).
- Half-done procedural art pass (pot/chef/awning/props) — committed separately before V2 work starts; visuals verified mid-iteration, final polish is Milestone 6.
- Launch a fresh session with: `claude "read PLAN.md and implement it"`
