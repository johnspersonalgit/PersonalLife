# Hearth

Two people. One small ritual. A private, Duolingo-mechanics daily check-in for John and his wife: one question a day, sealed until both answer, a shared streak, grace days, notes, and nudges. Built so the app carries the initiative, not either person.

## Run

```bash
npm install
node scripts/seed-demo.mjs   # optional demo couple (code HEARTH, members John + Partner)
npm run dev
```

Open http://localhost:3000. Onboarding creates a real couple and a six-letter invite code; the second phone joins with "I have a code". Settings has "Switch to ... (same device)" for single-device use.

Data lives in `.data/hearth.db` (SQLite, gitignored). Override with `HEARTH_DB`.

## Design receipt

Owner direction 2026-10-01: Duolingo style, Mobbin references mandatory, no hollow shell.

Adopted patterns (adapted, not pasted; no third-party code, assets, fonts, or trackers were taken):

| Pattern | Source | Where it landed |
| --- | --- | --- |
| Vitality strip (streak flame + count, always visible) | [Duolingo home](https://mobbin.com/screens/3ed7f990-7eea-4cfa-bc35-af1ee8ecee40) | Home top strip |
| Giant streak hero, week dots S M T W T F S, chunky CONTINUE | [Duolingo streak detail](https://mobbin.com/screens/b7578a37-b5f0-4921-a9c2-3b42bad94eb9) | Streak page, celebration |
| Milestone ladder with locked states ("unlocks at N days") | [Duolingo streak milestone](https://mobbin.com/screens/e319cd42-df5e-4862-ad4a-9cffdc5234d2) | Streak page milestones |
| Welcome with one primary + one secondary CTA; goal-picker multi-select cards | [Duolingo onboarding flow](https://mobbin.com/flows/b0b4f93f-5637-46ec-9d77-49ecda6b991d) | Onboarding steps |
| Chunky pressable buttons (bottom edge, press sink) | Duolingo home, above | `.btn-primary` / `.btn-secondary` |
| "Answer to see your partner's response" sealed mechanic | [Paired daily question](https://mobbin.com/screens/a6d44089-3a2e-4909-9d96-7179ef99938e) | Home today card |
| Mood row (five faces) | Paired daily question, above | Answer form |
| Streak-at-risk countdown | Paired daily question, above | Countdown chip on home |

Palette and type are original to this repo: warm paper `#fbf8f3`, ink `#22201c`, gold `#c69a6a`, flame `#d9763a`; Fraunces display, Work Sans UI. Duolingo's cartoon green and mascot were deliberately not carried over.

## Honest boundaries (v1)

- No passwords. The invite code is the only gate: it creates the second seat and reconnects either person on a new device. Profile identity is a device cookie. Before real phones, add passcodes or magic links.
- Reminders are stored preferences only; no push or SMS is wired yet.
- Streak days use the server's local timezone.
- Demo seed content is synthetic. No real exchanges are committed.
