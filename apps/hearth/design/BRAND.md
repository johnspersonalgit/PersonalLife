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
| sage | `#7d8b6f` | Confirmation |
| crit | `#b4552d` | Destructive, errors |

No raw hex in components. No second palette. Gold must be visible on every screen, not just present in tokens.

## Typography

Pending John's font files. When they land:

- Display face: headlines, questions, numbers that matter (streak count). Fraunces is the placeholder.
- UI face: body, controls, chips. Work Sans is the placeholder.
- Mono: codes and clocks only (system mono stack, no file needed).

Files go in `src/app/fonts/`, wired through `next/font/local` in `src/app/layout.tsx`, mapped to `--font-display` and `--font-ui` in `globals.css`. Nothing else changes.

Type rules that do not change with the files: display for moments, UI for work, mono for codes. Never a third family on one screen. Sentence case everywhere except chips and buttons, which stay small-caps tracked.

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
