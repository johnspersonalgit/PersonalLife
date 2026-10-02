# Hearth visual guideline

The working brand book for Hearth. Tokens live in `src/app/globals.css`; this file is the intent behind them.

## Feeling

Warm, private, quietly premium. A ritual object, not an app dashboard. Every screen should feel like good paper and firelight.

## Palette (locked)

| Token | Hex | Use |
| --- | --- | --- |
| paper | `#fbf8f3` | Ground |
| cream | `#f6efe4` | Subsurface, sealed states |
| card | `#fffdf9` | Cards |
| line | `#e8dfcf` | Borders, hairlines |
| ink | `#22201c` | Primary text |
| ink-soft | `#6f675b` | Secondary text |
| gold | `#c69a6a` | Primary action, brand accent |
| gold-deep | `#b98f56` | Hover, emphasis |
| gold-soft | `#e3be8f` | Ember inner flame, soft fills |
| flame | `#d9763a` | Streak flame, Ember body |
| flame-deep | `#b85a24` | Flame emphasis |
| flame-soft | `#f6d3b3` | Flame tints, countdown chip |
| sage | `#7d8b6f` | Mission kind, confirmation |
| sage-soft | `#dde3d3` | Mission tints |
| plum | `#8f6e8e` | Guess-day kind |
| plum-soft | `#e6d9e6` | Guess-day tints |
| honey | `#d9a441` | Milestones, best-streak moments |
| honey-soft | `#f3e2b8` | Honey tints |
| blue | `#5b7b9c` | His color. Avatar ring, his answers, his notes. |
| blue-soft | `#dfe8f1` | His tints |
| rose | `#a86e9e` | Hers. Pink-purple. Avatar ring, her answers, her notes. |
| rose-soft | `#eedfeb` | Her tints |
| crit | `#b4552d` | Destructive, errors |

No raw hex in components. Gold must be visible on every screen, not just present in tokens.

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

The mascot is the streak flame, alive. Source of truth in-app: `src/components/ember.tsx` (SVG, four moods). Rendered-asset direction: `design/ember-higgsfield-prompt.md`.

- Moods: happy (default, streak safe), worried (partner waiting on you), sleepy (empty states), celebrate (milestones).
- Ember never lectures, never guilt-trips. Worried is as stern as it gets.
- The face lives on the inner flame. The face never appears on the abstract flame icon.
- App icon stays the abstract flame (`public/icon.svg`); Ember lives inside the app.

## Components

- Buttons: chunky press physics (4px bottom edge, sinks on press). Gold primary, cream secondary. No ghost buttons as primary actions.
- Cards: card background, 1px line border, radius lg, shadow only for elevation.
- Chips: pill, tracked uppercase 10 to 11px. Kind chips are gold-soft; category chips are cream.
- Radius family: sm 10, md 16, lg 24, xl 32. Pick one step per control size and stay.
- Icons: one set, 1.5px stroke, currentColor. No emoji as UI language.
- Motion: intentional only (Ember float/hop/sway, ember rise, rise-in). All disabled under reduced motion.

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
