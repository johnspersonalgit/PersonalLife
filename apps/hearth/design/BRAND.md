# Hearth visual guideline

The working brand book for Hearth. Tokens live in `src/app/globals.css`; this file is the intent behind them.

## Feeling

Cartoon, whimsical, a little loud. Ember is a clay flame with arms and a smirk, not a luxury object. The app should feel like Duolingo fell in love: chunky ink outlines, hoppy motion, color you can see from across the room. Gold-cream quiet luxury is a fail here.

## Palette (locked)

| Token | Hex | Use |
| --- | --- | --- |
| paper | `#fff4e6` | Playground ground |
| cream | `#ffe3c2` | Soft fills |
| card | `#ffffff` | Cards |
| line / ink | `#1f2a55` | Cartoon outlines and type |
| ink-soft | `#4d5b8c` | Secondary text |
| gold / flame | `#f08a3a` | Ember, primary action, streak |
| gold-deep / flame-deep | `#de6a18` | Pressed Ember |
| gold-soft / flame-soft | `#ffd2a3` | Ember tints |
| sage | `#3dbb7a` | Mission kind |
| sage-soft | `#c8f3dc` | Mission tints |
| plum | `#8b5cf6` | Guess-day kind |
| plum-soft | `#e4d7ff` | Guess-day tints |
| honey | `#ffb703` | Milestones |
| honey-soft | `#ffe7a3` | Honey tints |
| blue | `#3d7de0` | His color. Avatar ring, his answers, his notes. |
| blue-soft | `#d5e6ff` | His tints |
| rose | `#e056a0` | Hers. Avatar ring, her answers, her notes. |
| rose-soft | `#ffd4ec` | Her tints |
| sky | `#7eb6ff` | Background blob |
| crit | `#ef4444` | Destructive, errors |

No raw hex in components. Ember orange must be the loudest action on every screen.

### Person colors

Blue is him. Rose is her. Assigned at join (first seat blue, second seat rose) and never swapped for decoration. Every answer, note, and avatar ring carries the person color so you can read who spoke without reading the name.

### Kind colors (the Duolingo move, warmed)

Each activity kind has a signature color, used on its chip and moments of emphasis: question = gold, rapid fire = flame, mission = sage, guess day = plum. Kind colors never replace the gold primary action and never stack two saturated tints on one card.

## Typography

John's files, installed in `src/app/fonts/` and wired via `next/font/local`:

- Display: Bricolage Grotesque (variable). Headlines, questions, streak numerals, the wordmark.
- UI: DM Sans (variable, plus italic). Body, controls, chips.
- Serif accent: Instrument Serif (regular + italic). The tagline, journal prompt lines, and other quiet editorial moments.
- Mono: system mono stack for codes and invite codes only.

Type rules: display for moments, UI for work, serif for whispers, mono for codes. Never more than two families on one screen (display + UI, or serif + UI). Sentence case everywhere except chips and buttons, which stay small-caps tracked.

## Avatars

Each person picks a clay creature, generated in Ember's exact style (template: `design/avatar-prompts.md`). The starter set lives in `public/avatars/`: ember, bear (honey), rabbit (plum), fox (flame), deer (sage). Rules:

- Avatars are busts on cream, always in a circular frame with a line border.
- Fallback is a single initial in a gold-soft circle.
- New creatures must come from the same prompt template. No photos, no off-style art.

## Ember

The mascot is the full-body clay flame John picked (`public/ember.png`). In-app wrapper: `src/components/ember.tsx`. Four moods via motion, never a lecture.

- Moods: happy (float), worried (wiggle), sleepy (sway), celebrate (hop).
- Full body on welcome, celebration, streak. Face crop only when he is smaller than 80px.
- App icon can stay a flame mark. Ember himself lives on the screens.

## Components

- Buttons: pill, 3px ink outline, 6px ink edge, sinks on press. Ember-orange primary, white secondary.
- Cards: white, 3px ink outline, 6px ink drop shadow.
- Chips: fat pills, ink outline, display type.
- Motion: Ember float/hop/sway/wiggle. Disabled under reduced motion.

## Tell list (automatic fail)

- Purple-to-blue gradients, glow borders, dark mode by default
- Inter or any generic AI-default face as the brand type
- Centered hero with a badge above the headline
- Exactly three feature cards as a page
- Accent in tokens but invisible on screen
- Clipped or truncated type left as shipped
- Placeholder copy or fabricated content presented as real
- Ember rendered off-palette or with a different face style per screen

## Visual pass

Any surface change: run the app, screenshot before, during, after, at 390x844 and desktop. Audit against this file. Self-correct in the same turn.
