# Foodventure: GPT-6 one-shot build

You are GPT-6, the game director, food/world artist and implementation owner. Build a complete mobile-first Khaliji cooking-and-eatery game. The player learns to cook halwa through physical gestures and visible food changes, then runs a real service-day economy around the food they made.

Deliver the running game, not a beautiful pot with no business behind it or a management dashboard with cooking reduced to a progress bar. Make ordinary decisions autonomously and continue through implementation, rendered play, visual refinement and fixes. Preserve existing working systems, saves and unrelated work in a supplied checkout. In an empty project, this is the whole-game brief. Use suitable tools and original or properly licensed assets.

**The food, cooking animation and souq presentation are core gameplay deliverables. They must not be deferred as later polish.**

## 1. The complete experience

A young Gulf chef starts with a small souq stall. Learn a dish, cook a batch, judge the result, open a service day, seat and serve customers, close the books and reinvest. Better cooking unlocks more valuable recipes and competent staff automation. Good business decisions produce a visibly larger, busier eatery.

Preserve the source's three-dish ladder: **Classic Halwa, Saffron Halwa and Royal Halwa**. These are variants with different ingredient sets, difficulty and finish, not one dish advertised as an enormous cuisine simulation. Broader Khaliji recipes, cities and events belong to the longer vision; they are not a substitute for completing this connected game.

The opening session must include a full cook, an explained result, a full service day, a readable ledger and a meaningful purchase or next-day choice. The player should understand both how to improve the food and how the stall earned or lost money.

## 2. Visual target: an inviting souq and food with material life

Use a coherent **warm stylized 3D diorama**. The scale is intimate: a working stove, rounded copper pot, wooden paddle, ingredient vessels, serving dishes, low tables, rugs, shade and surrounding souq architecture. It should look like an authored little place, not isolated props floating on a flat plane.

**Composition.** The eatery view shows the kitchen, customer seating, serving routes and expansion space in a clear three-quarter arrangement. Roofs, awnings and columns frame the scene but do not hide the business. The cooking view moves into a stable, useful angle where the pot surface, paddle, vessel and relevant control are large enough to read and manipulate. Frame each aspect ratio intentionally; do not shrink a desktop layout until the player is stirring a thumbnail.

**Materials.** The source's copper pot has a rounded belly, flared lip and brass handles. Make those forms catch broad warm highlights, with restrained surface wear and a darker interior edge. Distinguish metal from the dark iron stove, matte wooden paddle, ceramic bowls, glass/measuring vessels, cloth and stone. Contact shadows attach cookware to the counter and tables to the floor. Avoid default shiny primitives, paper-thin handles and food that looks like a glowing plastic ball.

Use warm stone/plaster, aged timber, woven rug patterns and limited brass accents. Patterns should be specific and controlled, not wallpaper over every surface. Add useful, proportionate details: folded cloths, ingredient storage, a serving ledge, work utensils and market signage. Keep the kitchen navigable and the active controls visually separate from decorative props.

**Lighting.** Warm local light shapes the stove and food, with cooler soft fill retaining the surrounding forms. Window/lantern warmth and canopy shadow can give the souq depth. Steam catches light selectively rather than becoming a white cloud that hides the pot. Bright highlights belong to metal, wet food and genuine light sources; the halwa itself should not appear self-illuminated. Preserve readable color differences between pale mixture, cooked amber and burnt patches.

**People and service.** Customers and staff share a consistent stylized character language, believable proportions and readable silhouettes. Seating, waiting, carrying, cooking, eating and departing need different poses. A server carries a visible plate along a valid route; the dish does not simply vanish into a customer while currency floats up. Clothing and gestures should fit the game's Gulf setting without caricature. Art and names must remain coherent across portraits, scene models and menus.

## 3. The pot is the interface

Food state must be visually inspectable. Do not make the same brown mound pulse for every recipe stage while hidden gauges decide the result.

**Measuring.** A held vessel tilts, a stream follows its lip and the amount rises against an etched target mark. The stream responds to the player's gesture. It narrows as they right the vessel, leaves an understandable dribble and supports the source's modest spoon-back correction. Grain and liquid should not look identical. The measure remains readable through the hand/control layout.

**The syrup and simmer.** Show a changing liquid surface and small rim bubbles. Too little heat, an appropriate simmer and excessive heat need distinguishable behavior. The gas knob and flame react coherently, with thermal lag in the pot rather than instant temperature changes. The player reads bubbles and movement, not a giant replacement thermometer.

**The slurry and combine.** The cold starch mixture should look different from the syrup. During combination, a thin stream enters the pot while the paddle moves under the other finger. The mixture changes where it is being worked. Keep both touch actions usable at once; one finger must not cancel the other or rotate the camera. Communicate interrupted stirring or a heavy pour through the mixture, not only a red popup.

**The long stir.** The paddle tracks the actual input position and sweeps a meaningful area. The food thickens and moves with a viscous, cohesive character rather than spinning as one rigid texture. Use convincing visual approximation appropriate to the device; a complete fluid solver is not required to show folds, a paddle wake and slow settling. Neglected regions darken locally and produce localized smoke. A hidden scorch grid must have a visible consequence in the corresponding part of the food, not merely reduce a final star count.

**Ghee and aroma.** A ladle or ingredient is physically brought to the pot. Ghee briefly forms a distinct pool or sheen, then incorporates. The food's change in shine is a useful cue. Aromatic additions have distinct, restrained visuals; do not substitute a generic sparkle explosion for every ingredient. Any success accent should quickly yield back to the food so the next cue remains readable.

**Calling doneness.** The finished mass is glossy and translucent in appearance, with a coherent amber body and a visible tendency to pull together from the sides. Pale/loose, ready and dark/overworked states must be distinguishable without reading the result first. Broad highlights and subtle internal color variation should make the food appetizing, not metallic. Burnt patches stay dull and localized instead of being hidden by the final gloss.

**The three dishes.** Classic moves from pale cream toward warm amber. Saffron Halwa has a more golden finish and its saffron/rose-water identity. Royal Halwa develops the richer amber-red source palette with visible almond/pistachio additions. Preserve ingredient identity and variation; changing a label while serving the same identical blob is not three finished dishes. Plated portions should resemble the food the player cooked.

## 4. Seven stages and earned mastery

Use the in-game cookbook's seven-stage structure: the syrup base; the simmer; the cold slurry; combining slurry and syrup; the long stir with ghee batches; late aromatic additions; and the player's finish call. Classic uses starch, sugar, water, ghee and cardamom. Saffron adds saffron and rose water. Royal adds the nut finish and a more demanding process. Follow the source recipe content rather than inventing an exotic ingredient or silently changing it from a simplified description.

Cooking quality comes from actual measurement, heat, coverage, additions and finish state. Give specific result feedback tied to those actions. A score secretly based only on elapsed time would undermine the entire game. Show the finished batch and a concise explanation: what was measured poorly, scorched, mistimed or called early/late. Preserve failures as normal recoverable play, not technical errors.

Mastery progresses guided, memory and mastered. Guidance points out observable cues, then steps back. Staff chefs can prepare dishes the player has mastered, consuming real ingredients and producing quality related to the player's demonstrated result, not automatic perfect food.

Classic begins unlocked. The source unlock ladder asks for three stars on the preceding dish plus 150 coins for Saffron and 400 for Royal. Preserve the ladder and make requirements visible. Practice pauses the business world; cooking during service does not. Explain that distinction before entering the pot, with a readable waiting-customer indication during a service cook.

## 5. A visually connected business

Open the stall for the source's approximately 180-second service day. Customers arrive, sit, order, wait, receive a portion, react and leave. Patience and value judgments should be readable through a small order indicator, posture and concise feedback. Do not rely on a sea of floating numbers to explain the business.

Menu availability and prices are player choices. Preserve the source's price-multiplier range of 0.6–1.6 as the initial design. Higher prices affect demand and expectations; weak food sold as premium damages reputation. Explain consequences through orders, customer feedback and the ledger. Prices displayed to the player must match what the economy actually charges.

The pantry contains real quantities. Cooking consumes stock at the proper transition; portions are finite; staff cannot conjure dishes. The souq market has finite shelves, understandable daily price variation and bulk buying. Preserve the bounded Umm-Khalid recovery path so a broke morning does not permanently strand the save. It must not become infinite free ingredients through repeated reloads.

Staff are a visible capacity decision: up to three servers and two chefs in the existing design. Servers do not target or charge the same order twice. Chef two requires the second stove. A larger pot changes batch capacity, with the source's seven-serving Big Pot. Equipment upgrades should alter the scene and what happens there, not only an invisible statistic.

Begin with terrace tables and expand to the **majlis wing**: a visible roofed/carpeted addition with further tables, richer customers and higher rent. Preserve the initial six-table terrace and four-table wing shape, with the existing 500-coin/three-star reputation requirement. Reframe the camera to accommodate the addition without making kitchen interaction tiny. Construction/installation can be a short satisfying sequence, but the final layout must remain usable for seating and service paths.

## 6. Interface and sound that support the place

Use ingredient, dish and equipment illustrations that form one family. A compact cookbook presents recipe context without covering the active pot. Controls resemble understandable kitchen tools, while business sheets remain efficient to read. Keep labels large enough for actual phone use; ornament and Arabic/English text must not be distorted to fit a decorative sign.

The menu board, pantry, staff roster, upgrade view and books need distinct headings/icons while sharing typography and materials. The day close-out is a clear ledger: revenue, ingredient cost, wages, rent, net result and reputation change. Reconcile inventory purchases and ingredient expenses so money is not silently charged twice. Show unserved customers and other losses honestly. Preserve the source's recent history, milestone rewards and trend view; rewards are claimed once.

Use simmer, paddle drag, pour, stove and serving sounds that follow the actual actions. Localized crowd/souq ambience supports the diorama without overwhelming cooking cues. Provide mute/volume, reduced motion and suitable quality options. The player must still read heat and doneness with sound disabled.

Persist money, pantry, dishes, mastery, menu, staff, equipment, reputation and history. Define a consistent mid-cook/mid-day resume policy. Timer expiry, closing early, insufficient stock, a burnt batch and unpaid costs must have readable outcomes. Reloading must not duplicate stock, servings, payroll or rewards.

## 7. Completion and visual proof

Complete all three recipes, including imperfect and successful cooks with explainable results. Exercise measuring, correction, simultaneous combine input, heat lag, local scorching, ghee, aromatics and doneness. Check that changing the visual quality does not change the cooking outcome.

Play a complete service day, reconcile the ledger, purchase stock, alter a price, hire staff, improve capacity and open another day. Check practice pause versus ongoing service, duplicate delivery prevention, early closure, day-end during a cook, recovery from an empty pantry and refresh-safe rewards.

Inspect a close-up of each recipe, a pale/simmering stage, a glossy ready batch, a scorched region, a busy service view, the expanded majlis and the ledger. The differences must be visible in ordinary play, not only selected promotional stills. Check utensil alignment, food texture, lighting, customer paths and readable UI together. Compare equivalent before/after views where a baseline exists and report performance only for actually tested hardware/settings.

Deliver the runnable game, concise start/controls, cookbook and business explanations, useful captures and factual verification notes. Separate source inspection, automated checks, browser play and real-device multitouch evidence.

**The standard: the player can read the food, feel the work, understand the books and see their stall become a place worth running.**

---

### Source basis and target distinction

Based on `STATUS.md`, `docs/VISION.md`, `src/data/recipes.ts`, `src/data/dishes.ts` and `src/scene/Halwa.tsx`. The current game contains three halwa variants, not only the first dish. Recipe stages, unlocks and core business systems are source-derived; the richer food deformation, material response, service animation and diorama presentation are the requested visual target. Culinary descriptions are retained from the in-game cookbook, not independently verified as real cooking guidance. No live cook or physical-device service-day test was performed during this prompt rewrite.
