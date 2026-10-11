# Foodventure artwork

All artwork in `public/art/` was created for this rewrite. No stock art, external
fonts, logos, real people, existing game assets, or remote asset URLs are used.

## Background

`souq.webp` is an original illustration made on 11 October 2026 using the built-in
image generation tool. The selected output was inspected, resized to 960 × 1440,
and encoded as WebP at quality 82. Its shipped size is 110,492 bytes. The image is
an atmospheric background layer; all game controls, customers, and cooking
feedback are rendered separately.

Generation prompt:

> Use case: stylized-concept
> Asset type: original production background for a portrait mobile casual cooking game, no interface.
> Primary request: An inviting Bahraini / Khaliji souq seen from inside a small food stall, looking out into a sunny shaded market lane. Polished joyful casual-game illustration, warm terracotta and coral striped awning across the very top, honey-colored plaster arches, pistachio and deep teal painted wood, tasteful brass lanterns, distant date palms, cream ceramic pots clustered near the lower corners. A little brass kettle tucked to one side. Warm late afternoon glow. Clean rounded dimensional shapes, crisp appetizing painterly illustration, coherent restrained texture, soft shaped shadows; sophisticated illustrated game art, not photorealistic.
> Composition: portrait 1024x1536. An upper canopy frames an open central arch with quiet softly lit background. Keep middle 60% of the picture spacious and low contrast for floating customers/game elements. Simple wood counter edge only across bottom 12%; leave the large central work/play area open. Buildings and props concentrated along side edges and upper third. No large foreground food, no people, no characters, no interface, no numbers, no writing, no logos, no brands, no text of any language, no watermark. Avoid busy detail and strong central focal objects. This is a usable backdrop layer, not a mockup or a screenshot.

## Food, props, and customers

The SVG files are original hand-authored vector illustrations. They contain only
local paths, shapes, and gradients, with transparent backgrounds and no embedded
text, fonts, scripts, external references, or bitmap payloads.

| Assets | View box | Purpose |
| --- | --- | --- |
| `karak.svg`, `samboosa.svg`, `halwa.svg`, `balaleet.svg`, `machboos.svg` | 240 × 200 | Recipe and finished-dish illustrations |
| `kettle.svg`, `egg.svg` | 240 × 200 | Cooking interaction props |
| `customer-1.svg` through `customer-6.svg` | 180 × 200 | Six fictional customer busts |

Karak's liquid surface is centered at (122, 78). The kettle's spout outlet is
centered at (214, 75), pointing right; horizontal mirroring moves it to (26, 75).
These coordinates allow the animated pour to connect to the illustrated props.

All 14 art files total **140,400 bytes** before HTTP compression. The complete
food and customer sets were rendered into contact sheets for visual inspection;
the smallest vector file is 986 bytes and the largest is 3,264 bytes.
