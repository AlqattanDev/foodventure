---
name: Foodventure
description: A sunlit Bahraini souq, an inviting serving tray, and food you make with your hands.
colors:
  ink: "#234e44"
  teal: "#276c5b"
  coral: "#b84736"
  cream: "#fff4de"
  quiet: "#705945"
  canvas: "#e8c08b"
  worktop: "#fff5e2"
  ceramic: "#fff9e9"
  cook-green: "#225846"
  serve-green: "#286c58"
  star-gold: "#f6bf4c"
  order-selected: "#fff5d5"
  order-outline: "#b57528"
  trim: "#cb664b"
typography:
  display:
    fontFamily: "Avenir Next, Trebuchet MS, system-ui, sans-serif"
    fontSize: "clamp(42px, 7vw, 78px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Avenir Next, Trebuchet MS, system-ui, sans-serif"
    fontSize: "35px"
    fontWeight: 900
    letterSpacing: "-.035em"
  title:
    fontFamily: "Avenir Next, Trebuchet MS, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 850
    letterSpacing: "-.02em"
  body:
    fontFamily: "Avenir Next, Trebuchet MS, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 650
  label:
    fontFamily: "Avenir Next, Trebuchet MS, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 750
  action-primary:
    fontFamily: "Avenir Next, Trebuchet MS, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 850
  action-cook:
    fontFamily: "Avenir Next, Trebuchet MS, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.4
rounded:
  text-action: "10px"
  sign: "12px"
  order: "13px"
  action: "16px"
  gesture: "18px"
  panel: "24px"
  worktop: "18px 18px 24px 24px"
  circle: "50%"
spacing:
  close: "8px"
  related: "12px"
  mobile-gutter: "16px"
  section: "24px"
  desktop-gutter: "30px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "#fff7e8"
    typography: "{typography.action-primary}"
    rounded: "{rounded.action}"
    padding: "16px 26px"
  button-primary-hover:
    backgroundColor: "#a23f30"
  button-serve:
    backgroundColor: "{colors.serve-green}"
    textColor: "#fff7e8"
    typography: "{typography.action-primary}"
    rounded: "{rounded.action}"
    padding: "16px 26px"
  button-cook:
    backgroundColor: "{colors.cook-green}"
    textColor: "{colors.ceramic}"
    typography: "{typography.action-cook}"
    rounded: "{rounded.action}"
    padding: "14px 22px"
    width: "100%"
  button-icon:
    backgroundColor: "#fff4e8ed"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    width: "46px"
    height: "46px"
  button-text:
    backgroundColor: "transparent"
    textColor: "#356657"
    typography: "{typography.label}"
    rounded: "{rounded.text-action}"
    padding: "10px 14px"
  order-bubble:
    backgroundColor: "{colors.ceramic}"
    textColor: "{colors.ink}"
    rounded: "{rounded.order}"
    padding: "2px 8px 5px 2px"
    width: "125px"
    height: "51px"
  worktop:
    backgroundColor: "{colors.worktop}"
    textColor: "{colors.ink}"
    rounded: "{rounded.worktop}"
    padding: "24px 30px 22px"
---

# Design System: Foodventure

## Overview

**Creative North Star: "The Saffron Tray"**

A warm serving tray sits inside a sunlit Bahraini souq. Cream ceramic, painted teal wood, coral fabric, and brass accents frame generous food illustrations. The background supplies place and atmosphere; the food and the current action hold attention.

The interface is friendly and tactile, with rounded system lettering, short instructions, and controls that visibly press. Original local SVG dishes and fictional customers sit over one generated souq illustration. English action labels and Arabic recipe names carry the setting without requiring prior game knowledge.

**Key Characteristics:**

- Appetizing food silhouettes on warm, quiet surfaces.
- One active recipe, one short instruction, and one large action.
- Tactile buttons, clear selection, and visible changes to the food.
- Brief celebrations supported by score, stars, and remembered progress.

This document records `src/styles.css`, `src/components/cooking.css`, and the implemented components. `PRODUCT.md`, `docs/REDO-DIRECTION.md`, and `docs/art-provenance.md` supply the product and artwork context. The sidecar adds component previews and extensions; its synthesized tonal ramps are preview aids, not additional CSS tokens.

## Colors

### Primary

**Coral** marks opening the stall and the next rush. **Cook green** identifies the current cooking action; **serve green** identifies the finished dish's handoff.

### Secondary

**Teal** carries the stall sign, success toast, and completed-order badge. **Star gold** and the warmer **order outline** distinguish earned rewards and the chosen customer.

### Neutral

**Ink** is the principal lettering color. **Quiet** supports secondary labels. **Canvas**, **cream**, **ceramic**, and **worktop** provide warm layers; selected orders use the slightly stronger **order selected** surface. **Trim** starts coral, then changes with cosmetic stall levels.

**The Food Contrast Rule.** Keep the cooking area quiet and pale so ingredient changes, the pouring line, and the selected order remain readable against the illustrated souq.

## Typography

The entire interface uses the installed Avenir Next / Trebuchet MS / system sans-serif stack; it downloads no fonts. Heavy display lettering gives the wordmark and results their character. Compact, medium-weight supporting copy keeps actions quick to read.

The frontmatter records desktop defaults. Display is the welcome wordmark; headline is the result heading; title is the recipe name; body is the serving instruction; label is the score caption. Score and timer numerals use tabular figures. Arabic names remain secondary in the recipe heading and disappear only at the narrowest breakpoint.

**The One Instruction Rule.** Keep the active instruction to one short sentence. The action button states the action or its immediate feedback: “Hold to pour,” “Release!,” or “Lovely!”

## Layout

The page is centered within a maximum width of 1060px. The welcome composition is capped at 670px, the kitchen at 600px, and the cooking control at 420px. The kitchen stacks score/time, star progress, customers, and the worktop. It supports two customer slots on day 1 and three thereafter.

At widths up to 600px, outside gutters become 16px and controls remain large. At 360px and below, gutters become 12px and customer labels tighten. Short phones have additional 730px and 620px height rules; these reduce portraits, artwork height, and vertical spacing while preserving the action. The cooking component also compacts at 740px height. Safe-area insets protect the top and bottom edges. At 900px and above, the backdrop receives a wider crop while the kitchen stays centered.

## Elevation & Depth

Depth comes from cream surfaces, illustrated shading, warm diffuse shadows, and a slightly overhanging counter trim. Results use the shared ambient elevation; the worktop has a deeper structural shadow; buttons have a small lift that compresses when pressed. Exact shadows, motion values, and focus treatments live in the sidecar snippets.

Food arrivals and completion effects use brief settling or overshoot. Steam stays behind the action. Reduced motion removes CSS animation and transitions, suppresses confetti and delivery effects, and still displays the changed food and explicit completion labels.

## Shapes

Buttons use generously rounded rectangles; sound and pause controls are circles. Order bubbles use a small speech tail and a warm outline for selection. The worktop has softer lower corners and a narrow stitched trim. Rounded plates, cups, pans, and customer silhouettes repeat the same friendly form language.

Stall improvements change trim, cloth, and worktop decoration. They preserve the controls and the position of the cooking action.

## Components

**Primary, serving, and cooking buttons.** Coral advances the session; green performs food actions. Primary buttons have a 58px minimum height, serving buttons 56px, and cooking buttons 56px before compact rules. The smallest compact cooking/serving buttons remain 50px high. Hover darkens or lifts on hover-capable devices; pressing moves the button down slightly. Cooking progress fills behind its label, and completion switches it to gold without fading the finished food.

**Icon and text buttons.** Pause and mute use circular targets, 46px on desktop and 44px on phones. Secondary text actions use a 46px minimum height. Visible keyboard focus uses a 3px teal outline; cooking artwork places that outline inside its bounds.

**Customer orders.** Each customer shows a dish, recipe name, patience bar, and selected state. Finished steps add a check badge. The interface uses text and shape alongside color. Desktop number hints correspond to keyboard selection; mobile hides those hints.

**Cooking station and the first twenty seconds.** The opening screen presents “Open my stall” beside large finished dishes. A first visit then enters an untimed cup: hold and release the tea at the gold line, tap the cardamom, and press Serve. Only that handoff starts the 60-second rush. Returning players go directly to the rush. This is the intended learning path, not a timed tutorial deadline.

Pouring raises visible tea; stirring moves the spoon through halwa or noodles; a swipe folds samboosa; taps visibly add or finish ingredients. Every gesture has a keyboard or button equivalent. Completed recipe steps stay with their order when switching customers; an unfinished gesture is canceled. Pause, focus loss, and hidden tabs stop the active gesture.

**Results and pause.** Results put stars and score first, then served guests, streak, perfect dishes, and the next reward. The primary action opens the next day or retries; secondary actions replay or return home. Pause uses a centered cream dialog over a deep teal scrim, with the game surface inert and focus contained in the dialog.

## Do's and Don'ts

### Do:

- Do preserve the Bahraini food, Arabic recipe labels, and original souq artwork.
- Do keep food changes visible beneath a single clear instruction.
- Do pair status colors with text, position, or a check mark.
- Do retain keyboard, touch, mute, pause, and reduced-motion behavior.
- Do use the existing system font stack and local artwork.

### Don't:

- Don't make hover or sound the only way to understand an action.
- Don't add decorative overlays that obscure the food or pouring line.
- Don't shrink interactive targets below the established 44px minimum.
- Don't replace the illustrated cooking world with a business ledger or dense dashboard.
