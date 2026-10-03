# Hearth visual guideline

The working brand book for Hearth. Tokens live in `src/app/globals.css`; this file is the intent behind them.

## How to edit this app

Home is the Duolingo path, in Hearth clothes. Locked reference: Mobbin Duolingo iOS path and `duo-home-2.webp`.

Copy the craft: S-curve of 3D circles, no diagram line, mascot beside the current node, START as a speech card on that node, brand-colored unit banner, vitality strip. Do not copy Section/Unit numbers, lesson-type icons, chests, or XP.

Ember is the only clay object. Flame is the path color. Blue and rose are people only. Never a centered hero with a full-width CTA. Never quiet luxury.

Edit loop:

1. Screenshot the live 390 screen.
2. Circle tells from the list below.
3. Change tokens or one component. Stop inventing looks.
4. Screenshot again and audit. Keep going until the tells are gone.

## Feeling

Cartoon, whimsical, a little loud. Ember is a clay flame with arms and a smirk, not a luxury object. Color you can see from across the room. Gold-cream quiet luxury is a fail here.

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
| crit | `#ef4444` | Destructive, errors |

No raw hex in components. Ember orange must be the loudest action on every screen.

### Person colors

Blue is him. Rose is her. Assigned at join (first seat blue, second seat rose) and never swapped for decoration. Every answer, note, and avatar ring carries the person color so you can read who spoke without reading the name.

### Kind colors

Sage, honey, and plum are for rare state (done node, grace, error-adjacent), not a rainbow chip system. Person color and flame already say enough. Do not add a kind chip unless the screen is unreadable without it.

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

- Ember is the only clay object. Chrome is cut paper: 2px ink, 3px drop, md radius.
- The one loud control is the primary button and START: pill, 3px ink, 6px drop, flame fill.
- Banner is flame, never blue. Blue and rose are people only.
- Chips are vitality only (streak, grace, combo). No category or kind chips.
- Questions use display type. Answers use UI type. Serif stays off the path.
- Motion: Ember float/hop/sway/wiggle. Disabled under reduced motion.

## Tell list (automatic fail)

- Corner pastel blobs or wallpaper gradients
- Quiet luxury gold/cream, thin editorial rules, or metallic accent
- Fake Duo curriculum: Section/Unit/Layer numbers, CHEST, juice chips, lesson-type icons
- Manifesto copy (The record that writes itself, Quest complete, Same thread)
- Kind-color rainbow chips (US / QUESTION / LOAD as decoration)
- The same 3px ink + 6px drop on every decorative box
- Purple, sky, or extra hues that are not paper/ink/flame/blue/rose
- Inter or any generic AI-default face
- Dead duplicate copy that restates the banner
- Ember off-palette or a different face style per screen
- Inventing a new look instead of killing a tell

## Visual pass

Any surface change: run the app, screenshot before, during, after, at 390x844 and desktop. Audit against this file. Self-correct in the same turn.
