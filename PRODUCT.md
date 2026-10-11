# Foodventure

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Portfolio visitors, friends and family, usually arriving alone on a phone with no game knowledge. They should understand the game by doing within twenty seconds.

## Product Purpose
A joyful, quick cooking game set at a Bahraini souq stall. Pour karak, fold samboosa, stir halwa, and prepare balaleet and machboos for customers. One short rush has a visible score, stars and a reason to replay.

## Constraints
Foodventure is the title and foodventure is the arcade/storage slug. Keep Bahraini / Khaliji food and the souq identity. No real people, brands, companies, political imagery or graphic violence. Original local assets, touch targets at least 44px, keyboard support, remembered mute, reduced motion, strict TypeScript and pure-rule tests. Initial transfer target below 2 MB. Preserve relative Vite paths and commit the .exidex play page; preserve card.json, thumb.png and shots.

## Delegated decisions for this redo
The owner explicitly delegated game and visual design and requested no questions. Implement a 60-second rush with a short guided first order, five recipe unlocks, combo scoring, automatic visual stall improvements and local best scores. Retain React, TypeScript, Vite and Vitest; use 2D illustrated assets and lightweight CSS/SVG cooking effects instead of the old 3D simulation and business ledger. This is an arcade abstraction, not a real cooking lesson. The previous simulation save is left intact under its old key.
