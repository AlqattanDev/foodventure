# Foodventure

A little taste of Bahrain. Run a colourful souq stall in quick, 60-second cooking rushes: pour karak, fold samboosa, stir Bahraini halwa, toss balaleet and plate machboos. Your first cup is unhurried; the game teaches each action on the food itself. Serve customers before their patience runs out, build a streak and chase three stars.

One star opens the next day. Halwa joins the menu on day 2, balaleet on day 3 and machboos on day 4. Your best stars decorate the stall, from a little counter to a festival trim. Replays use fresh orders; personal bests, progression and mute are saved on this device. The optional exidex arcade receives the score of each completed rush.

## Play

Hold to pour and release at the cup’s gold line. Circle the spoon or hold the stir button. Swipe up to fold, or use the fold button. Tap to finish a dish, then tap **Serve**. You can choose another customer without losing their completed steps.

On a keyboard, Tab selects a control; Space/Enter holds or activates it. Keys 1–3 select customer orders. P/Escape pauses; Escape resumes. Sound is optional. Leaving the tab pauses play. Returning to the stall or refreshing abandons an unfinished rush without recording a score.

## Development

```sh
npm ci
npm run dev
npm test
npm run build
npm run exidex
```

React 18, strict TypeScript, Vite and Vitest. React is the only runtime library. Original SVG food and characters, one original local WebP backdrop, CSS/SVG feedback and optional WebAudio synthesis replace the old 3D simulation. No runtime network requests, remote fonts, external art, purchases or accounts are required by the game.

`src/arcade/rules.ts` owns deterministic rounds and scoring; `progress.ts` owns validated progress; `CookingStation.tsx` owns gesture feedback; `App.tsx` connects them. Core tests cover score/quality, time partitioning, expiry, stars, invalid input and save handling. Art provenance is in `docs/art-provenance.md`. See `docs/VERIFICATION.md` for the delivered verification and limits.

## Deployment and saved data

The portfolio serves `.exidex/index.html` at `/foodventure/`. `npm run exidex` builds and syncs `dist/` into `.exidex/`, preserving `card.json`, `thumb.png`, `shots/` and `content.md`. Vite retains `base: './'`. Commit the rebuilt `.exidex/` with source changes.

The new game uses `foodventure-progress-v1`, `foodventure-best` and `foodventure-first-cup-v1`. Malformed or blocked storage falls back to a playable fresh game. The previous `foodventure-save-v3` tycoon save is left untouched: its economy does not map to this arcade game. Completed rushes submit a higher-is-better integer score through guarded `window.arcade?.submit({ score, meta })`; a missing, throwing or rejecting bridge cannot interrupt play.

The obsolete Capacitor configuration and native scripts/dependencies were removed. This version ships for phone and desktop browsers. Dishes and gestures are joyful arcade abstractions, not cooking instructions.
