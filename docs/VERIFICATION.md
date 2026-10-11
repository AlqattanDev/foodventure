# Foodventure redo verification

Verified on 11 October 2026, starting from
`57c2e71c85554716c90059c3e170dc5f6772613b` on `cgpt/foodventure-redo`.

## Automated rules and build

- `npm ci --ignore-scripts --no-audit --no-fund`: the committed lockfile installs successfully.
- `npm test`: **31 passing tests** across the pure round/scoring and progress suites.
- `npm run build`: strict TypeScript checking and Vite production build pass.
- `npm run exidex`: production output rebuilt and synchronized into `.exidex/`.
- `git diff --check`: clean.

The rule tests cover deterministic seeded orders, all recipe unlocks, retained
steps when changing orders, customer expiry, capped streak multipliers, accuracy
and speed tips, exact star thresholds, duplicate serving, round-end boundaries,
equivalent clock partitions, invalid numeric input, and immutable state. Progress
tests cover corrupt/hostile saves, best-score retention, duplicate result handling,
sequential day unlocks, remembered mute, and cosmetic stall levels.

## Browser play

Playwright drove a real headless Chromium 153 browser using mouse, keyboard, and
trusted Chrome touch input. The clock ran normally throughout both full rounds.

| Check | Observed result |
| --- | --- |
| First visit | Open stall → untimed pour → cardamom → Serve → timed rush |
| Complete touch-played day 1, seed 93 | 21 dishes, 6,492 points, 3 stars; halwa and day 2 unlocked |
| Arcade contract | Exactly one submission with score 6,492 and short day/stars/served/combo/version metadata; a rejected bridge promise caused no unhandled error |
| Persistence | Best score, completed first cup, stars, and mute survived reload |
| Pause | Remaining time stayed fixed during pause; Escape resumed; window blur paused |
| Keyboard | Pour and finishing actions worked; repeated held Enter could not accidentally activate the newly focused Serve button |
| Zero-score round | Bell produced 0 stars and Try again; retry began a fresh round at score 0 |
| Unavailable optional APIs | Blocking localStorage and throwing from AudioContext still allowed first-cup play with reduced motion enabled |
| Gesture component | Pour, tap, circular/held stir, and swipe/button fold checked; pointer cancellation, blur, unmount and disabled-state cleanup checked |
| Food feedback | All ten recipe steps visually inspected, including the completed balaleet omelette |

The final production test served the committed play-page layout under
`/foodventure/` from `.exidex/`. All requested production resources loaded from
that subpath, with **no external resource requests, missing resources, or captured
page errors**. It exercised the actual generated JavaScript and CSS, rather than
the Vite development server.

## Phone layout and visual review

Home, first pour, active rush, and pause were captured at **320 × 568**, **375 ×
667**, **390 × 844**, and **1440 × 900**. Each measured home/game document fit its
viewport with no horizontal overflow. Measured gameplay targets were at least
44px; the shortest-screen primary action was 264 × 50px and fully visible.

An independent visual review inspected all initial captures. Its one material
finding, a clipped primary action at 320 × 568, was fixed with compact-height
spacing. The reviewer inspected the corrected short-phone screens and adjacent
375 × 667 layouts and cleared the finding. The style detector's speech-bubble
tail finding was reviewed as a false positive.

## Payload and timing

| Measurement | Result |
| --- | ---: |
| First-screen HTML + JS + CSS + requested art, uncompressed body bytes | **345,003 bytes** |
| Complete playable `dist/`, including every dish and customer asset | **361,385 bytes** |
| Production JavaScript file | **191,665 bytes** |
| Pinned original JavaScript file | 1,455,489 bytes |
| JavaScript reduction | **86.8%** |
| Original local artwork, all 14 files | 140,400 bytes |
| Vite-reported gzip JS / CSS | approximately 61.91 KB / 7.29 KB |

In a local production-path run with Chromium's **4× CPU throttle**, the first
action was found after navigation/network-idle in **771ms**; DOM content loaded
in approximately **74ms**. A 180-frame sample during the active rush measured
**16.7ms median / 16.8ms p95** animation-frame intervals. These are local desktop
simulation observations, not network benchmarks or proof of physical-phone 60fps.

The preserved portfolio thumbnail is approximately 1.82 MB. It is not requested
by the game page and is excluded from playable-payload measurements. `card.json`
and `thumb.png` were compared byte-for-byte with the pinned commit and remain
unchanged; the screenshot folder was not modified.

## Remaining verification limits

Physical midrange Android hardware, iOS Safari, screen-reader operation, audio
quality through phone speakers, and the live portfolio's injected shared
leaderboard were not available for direct verification. The guarded leaderboard
contract was exercised with an instrumented bridge. The game is delivered as a
browser build; the old Capacitor configuration and native scripts/dependencies
were removed. Existing tycoon saves are preserved under their original key and
are not migrated into the new rules.
