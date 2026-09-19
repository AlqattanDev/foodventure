# Build Foodventure — learn the pot, earn the stall

Build a complete mobile-first cooking-and-eatery game. A young Gulf chef starts with a small souq stall, learns to make Halwa Bahrainiya by hand, serves real customers in the game world and grows the business through earned mastery.

Two experiences must work together: **I am actually cooking**, and **I am actually running this stall**. Deliver both, not an attractive pot disconnected from an idle income counter.

Own the creative details, implementation, integration and finish. Make ordinary decisions and work autonomously through building, playing, testing and improving. Choose the tools that serve the game. In an existing repository, inspect and preserve working systems and unrelated changes; in an empty repository, this brief provides a complete product to build.

## The first meaningful session

Guide the player through a halwa cook, let them understand the result, then open a service day. Customers arrive, place orders, wait, eat and pay or leave dissatisfied. Close the stall, read a clear ledger, buy ingredients, make one meaningful business decision and start a better second day.

That loop should be playable before a large recipe collection, multiple cities or event calendar. One excellent signature dish connected to a real business is stronger than ten dishes that are the same progress bar.

## Hands, not quick-time events

Use the source's seven-stage halwa structure, including measuring, syrup/slurry preparation, combining, sustained stirring, ghee/aromatics and the player's doneness call. Preserve the actual recipe data and stage ordering in the repository when available. Authenticity is a content responsibility: use real Khaliji dish identities and ingredients, and ground any expanded recipe in a credible culinary source rather than inventing an exotic-sounding ingredient.

Measuring means tilting a vessel and watching a visible level rise toward an etched mark. The stream should respond to the gesture, stop with understandable dribble and permit the source's modest spoon-back correction. Stirring means moving a paddle across the pot: neglected areas heat and scorch rather than the player merely keeping time with an animation.

Heat has inertia. The player reads bubbles, viscosity, sheen, translucency, steam and scorching to decide what to do. Ghee and spices are physical additions made at meaningful moments. A finger-driven paddle, visible stream, changing mixture and spatial scorch response should agree with the underlying simulation.

Success is not secretly a stopwatch with a beautiful pot painted over it. Cooking quality should come from the actual actions and state: measurements, heat management, coverage, additions and finish. Give specific feedback that helps the next attempt—what was overdone, neglected or called too soon—without replacing the visual cooking task with a dashboard of green bars.

Keep multitouch stages comfortable on a phone. Cancelling a drag, moving a finger outside a control or pausing must not leave a vessel pouring forever or a paddle stuck in a hidden state.

## Mastery makes automation meaningful

Use the guided → memory → mastered ladder. Guidance teaches observable cooking cues, then steps back. A hired chef can cook a dish the player has mastered, using real ingredients, at a quality related to the player's demonstrated ability rather than a free perfect score.

Practice cooking pauses the business world; service cooking during an open day does not. Make that distinction visible before the player enters the pot view. The waiting-customer pressure should create an interesting decision, not an unexplained penalty for opening a cooking screen.

## The stall is a small business, not a fake number

Run a concentrated service day, with the source's approximately three-minute day as a starting point. Orders consume portions, portions require batches and batches require pantry stock. Customers have patience and react to the value they received. Servers visibly carry plates; chefs visibly work. Two staff members cannot deliver and charge for the same order.

Let the player change menu availability and prices. Higher prices influence demand and expectations; a poor dish sold as premium should hurt reputation. Bargains can attract customers while thinning the margin. Make these effects understandable through the queue, verdicts and close-out, not only hidden coefficients.

Close the day with a clear ledger: revenue, ingredient cost, wages, rent, net result and reputation change. Reconcile that display with the chosen cash/stock accounting model; buying stock and consuming it must not silently charge the same expense twice. A repeated close action or reload must not run payroll or pay a customer twice.

Provide a souq market with real ingredient quantities, finite purchasing limits where appropriate, understandable price variation and useful bulk choices. Hiring, a second stove, a larger pot and additional tables should change service capacity in visible ways. Expansion into a roofed majlis wing should change the scene, clientele and operating costs—not only unlock a new menu icon.

Preserve a bounded, clearly explained broke-morning recovery path such as the source's Umm-Khalid assistance. A bad day may hurt; an empty pantry must not permanently destroy the save. That kindness must not become unlimited free inventory through repeated reloads.

## Make the place desirable

Create a coherent, warm stylized 3D diorama: the working pot, steam, rugs, low tables, souq materials, staff motion and evening light. The active cooking view needs enough detail to read the mixture; the stall view needs enough space to understand service. Neither should be buried under panels.

Phone controls come first, with usable desktop equivalents. Provide safe-area-aware layouts, deliberate targets, sound/mute and sensible graphics/motion settings. Keep cultural detail specific and respectful. Original or properly licensed assets are welcome; record provenance. Strong material response and a readable composition matter more than piling effects onto a default scene.

## Persistence and complete outcomes

Save pantry, money, menu, mastery, staff, equipment, reputation and business history. Define and implement a consistent mid-cook and mid-day resume policy. Reloading should neither erase the stall nor duplicate ingredients, dishes, wages or rewards. Make aborting a cook, burnt food, stock shortage, an impatient customer and an unaffordable hire normal, understandable game states.

## Demonstrate the connected loop

Perform a guided cook, an imperfect cook with explainable feedback and a successful independent cook. Check pouring, overshoot correction, neglected scorch regions, heat lag, additions, doneness and interrupted touch input.

Then serve a complete day, reconcile the ledger, buy stock, change a price, hire staff and show a visible capacity improvement. Verify practice pauses the world while a service cook does not. Test insufficient stock, duplicate order handling, a broke morning, closing early, repeat reward claims and refresh during the day.

Use actual input and the rendered game, not only direct state injections. Separate simulation tests, browser observation and genuine phone/multitouch verification. Do not call first-guess balance “proven” because the build succeeds.

## Deliver

Leave a runnable game, short startup instructions, controls, a concise explanation of mastery and the ledger, and a factual handoff of what was checked and what remains uncertain. Finish the first cook, first day and next-day reinvestment before treating a larger empire as completion.

**Finish when the player can read a pot better, run a day better, and see their stall become more theirs.**

---

### Repository alignment

Reviewed against `STATUS.md`, `docs/VISION.md` and the supplied prompt on 2026-09-19. STATUS describes tactile cooking, the mastery ladder, timed service, pantry consumption, staff, pricing, ledger and the majlis expansion. VISION identifies broader recipes/cities/events as later ambition, not already shipped features. Exact-once economy, resume and input checks above are strengthened build criteria, not tests executed by this documentation update.
