# PLAN — Foodventure V3: Hands-On Cooking + Souq Eatery Tycoon

_Ali's verdict on V2 (2026-07-19): the cook still plays like UI, not cooking — "realistic measurement, not clicking on a bar", "no stupid circular movement", "I want to feel like I am actually cooking", "animation, color changes". And the tycoon must be real: "tables and servers and chefs, not just this", plus "storage and supermarket to purchase and store items". Ali delegated the setting call: mix of stall + restaurant — I chose the souq eatery below. World pauses only for practice cooks; service cooks run live._

## Design pillars

1. **Hands, not bars.** Every measurement is done by manipulating the actual thing — tilt a vessel and watch the level rise to an etched line. No fill-gauges, no green bands, no tap-the-cue buttons.
2. **Stir like a cook, not a metronome.** Free paddle movement; the pot bottom scorches where you neglect it. Coverage matters, not choreography. The circular-tempo mechanic is deleted.
3. **Read the pot.** Color (pale starch → glossy amber), translucency, sheen dulling (= ghee time), rim bubbles (= simmer), creeping dark patches (= scorching) are the game's feedback. Meter bars during the cook are deleted.
4. **A real floor.** The stall grows into an open-air souq eatery: low tables on rugs in front of the counter, customers seated and served, hired server + chef. Upgrade adds a covered majlis section.
5. **A real economy.** Ingredients are bought at the souq market, stored in the pantry, consumed by the exact amounts the cookbook teaches. No stock = no cooking.

## Part A — Cooking rebuilt (the feel)

### New pure sims (tested, production path)

- `game/pour.ts` — vessel pour physics. Input: tilt 0..1 per frame. Flow starts past a threshold tilt, scales up; when you right the vessel the stream dribbles off over ~0.25s (you must anticipate the cut). Fill level vs an etched target line; overshoot recoverable by slow scoop-back (costs time). Output: final fill for scoring (existing `scorePour` curve).
- `game/stir.ts` — the scorch grid. Pot bottom = cells inside a circle. Each cell accumulates `stick` proportional to heat × time-since-swept; the paddle (finger position mapped into the pot) sweeps cells it passes over. Stick past a threshold becomes visible darkening, then scorch (permanent this cook). Outputs per tick: coverage quality 0..1, motion, total scorch, worst-cell for smoke/visuals.

### Stages, redesigned

| # | Stage | Interaction now |
|---|-------|-----------------|
| 1 | Syrup | Drag the **gas knob** (vertical slider, flame animates). No heat gauge — you read the **rim bubbles**: none = cold, small beads at the rim = simmer, rolling = too hot. Hold the simmer. |
| 2 | Slurry | **Tilt-pour** starch then cold water into the measuring bowl to their etched lines. Then free-stir the bowl until the visible lumps dissolve to silky. |
| 3 | Combine | Two hands: one finger holds the bowl tilted — tilt angle = stream width (too steep = glug = lumps) — while the other finger stirs the pot. Multi-touch. |
| 4 | Long stir | Free-stir with the scorch grid live + gas knob. When the sheen dulls, **drag the ghee ladle over the pot** and tilt it in — not a tap. |
| 5 | Spices | **Pinch-and-drop**: drag cardamom/rose/nuts from the spice rack onto the pot in the timing window. |
| 6 | Calling it | Unchanged in spirit — you read translucency/gloss and call it. Now with zero UI besides the call button. |

Recipe engine keeps its stage/summary/scorer shape; summaries change inputs: stir quality = coverage-based (from `stir.ts`), pour amounts from `pour.ts` fills, heat-hold band = the simmer band read from the gas/bubble sim. `scoring.ts` loses `idealTempo`/`tempoQuality` once nothing uses them.

### Animation pass (cookViz extended)

`cookViz` gains: scorch grid (Float32Array + dims), paddle position, pour stream (active vessel color/rate/pot-or-bowl), ghee pool amount. `Halwa.tsx` renders: scorch dark patches via a CanvasTexture on the halwa dome, smoke wisps off the worst cell, visible pour stream (thin cylinder + splash ripples), ghee pools melting outward then absorbed, sheen/translucency curve, rim-bubble ring tied to heat.

## Part B — Souq eatery (tables, servers, chefs)

- **Scene**: the existing stall becomes the kitchen/counter; the camera pulls back to a floor of low souq tables on rugs (start 2 tables → buy up to 6; tables 5-6 sit in a new covered majlis wing — the "mix of both").
- **Sim** `game/eatery.ts` (pure, tested): spawn (rate ← reputation) → queue at host stone → seat at free table → order an unlocked dish → patience drains → served → eat → pay + tip (quality × patience left) → leave. Unserved patience-out = reputation hit.
- **Batches**: a finished cook = N servings at that run's stars, stored at the counter. Serving: without a server, tap counter then table. **Server** (hire) auto-carries. **Chef** (hire, needs ≥1 mastered dish) auto-cooks mastered dishes at (your avg stars − 0.5), consuming pantry stock.
- **Live cook rule**: cooking a batch for service leaves the sim running (queue badge visible while you cook — that's the tension; staff are what keep you afloat). A **practice cook** (from the cookbook, no batch produced, half ingredients) pauses the world.
- **Reputation** 0..5 drives spawn rate and gates Saffron/Royal unlocks (with mastery), replacing pure coin gates.

## Part C — Pantry + souq market

- `game/pantry.ts`: stock per ingredient in recipe-units. Each cook consumes the cookbook amounts. Pantry capacity per ingredient, shelf upgrades raise it.
- **Market screen**: souq stalls (grain / dairy / spice / nuts), unit prices, buy with coins. Softlock guard: if you can't afford the Classic basics and can't cook anything, the basics restock is free ("Umm Khalid lends you sugar").
- Cookbook page shows have/need per ingredient; cook button blocked without stock.
- **Persistence**: full game state to localStorage (mandatory now the economy is real).

## V3 milestones M1–M6: BUILT (on main, 2026-07-19). See STATUS.md.

## Part D — The REAL tycoon layer — ALL BUILT (T1–T6 on main, 2026-07-19)

_(Ali, 2026-07-19: "it's not a tycoon, I want real tycoon experience." What
follows is the design as built; STATUS.md has the current state. Remaining:
Ali's playtest → balance → art pass → device run.)_

The M4/M5 floor was service-sim-lite: an always-on trickle, invisible wages,
no business decisions. The tycoon loop that replaces it:

**prep → open the stall (timed service day, world runs hot) → close →
LEDGER (revenue − ingredients − wages − rent = net) → reinvest → repeat.**

- **Day cycle (T1):** the world only runs while the stall is OPEN (~3 min
  day, close early allowed; practice cooks still pause, service cooks
  mid-day keep it running). Close-out pays per-day wages + rent and shows
  the P&L ledger card. Ingredient buys attribute to the day's costs
  (pending spend rolls into the next day if bought while closed).
- **Menu & pricing (T2):** per-dish price multiplier (0.6x–1.6x) + on/off
  menu toggles. Demand model: overpriced vs batch stars → fewer orders +
  unhappy serves; underpriced → crowds but thin margins.
- **Staff roster (T3):** up to 3 servers / 2 chefs, each with a real daily
  wage (tip cuts and chef fees die). Second stove enables the 2nd chef;
  big-pot upgrade = 7-serving batches.
- **Expansion (T4):** Majlis wing — a visible walled, carpeted build-out
  with +4 tables, higher rent, higher-tipping customers.
- **Business panel (T5):** last-7-days profit bars, all-time stats, souq
  rating, milestone goals with coin rewards (serve 50, first 100-profit
  day, full staff, open the majlis, master all dishes).
- **Market depth + balance + deploy (T6):** bulk discounts, light daily
  price wobble, whole-loop balance, docs, exidex redeploy.

Numbers (first guess, T6 balances): day 180s · wages server 15/chef 25 per
day · rent terrace 10, majlis 25 · big pot +2 servings.
