# Hearth

Two people. One small ritual. A private, Duolingo-mechanics daily check-in for John and his wife: one question a day, sealed until both answer, a shared streak, grace days, notes, and nudges. Built so the app carries the initiative, not either person.

## Run

```bash
npm install
node scripts/seed-demo.mjs   # optional demo couple (code HEARTH; PINs: John 1111, Partner 2222)
npm run dev
```

Open http://localhost:3000. Onboarding creates a real couple and a six-letter invite code; each person sets a 4 to 6 digit PIN, and the PIN is what reconnects a seat on a new device. Settings has "Switch to ... (same device)" for single-device use.

Data lives in `.data/hearth.db` (SQLite, gitignored). Override with `HEARTH_DB`.

## Demo simulator

`node scripts/mock-two-weeks.mjs` replays fourteen synthetic days (both partners answering, notes, a nudge, milestone celebrations at days 7 and 14) and screenshots each day to `/opt/cursor/artifacts/mock`. Run it against a dev server started with `HEARTH_DEMO=1 npm run dev`; the simulator writes `.data/demo-clock` to move "today" day by day. Never set `HEARTH_DEMO` in production. Local demo seed: `node scripts/seed-demo.mjs`.

## Notifications

Web push is wired end to end: a service worker (`public/sw.js`), subscription storage, a nudge push to the partner, and a nightly reminder for whoever has not answered by their reminder time.

- Env (see `.env.local`, regenerate for production with `npx web-push generate-vapid-keys`): `HEARTH_VAPID_PUBLIC`, `HEARTH_VAPID_PRIVATE`, `HEARTH_VAPID_CONTACT`, `HEARTH_CRON_SECRET`.
- Schedule `POST /api/notify` with header `Authorization: Bearer $HEARTH_CRON_SECRET` every 15 minutes (any cron: Render Cron, GitHub Actions schedule, or a system crontab).
- iPhone receives web push only when the app is installed to the Home Screen (iOS 16.4+). Enable from the card on the Today tab.

## Path to our phones (tonight)

Live at **https://hearth-gc8u.onrender.com**. Install page: **https://hearth-gc8u.onrender.com/install**. Render Docker, starter, Virginia, 1 GB disk at `/app/.data`, `TZ=America/New_York`. Reminders run via the `hearth-notify` cron every 15 minutes. Auto-deploys on every push to `main`.

John and Ariana, on both iPhones:

1. Open https://hearth-gc8u.onrender.com/install in **Safari**, not Chrome.
2. Tap Share, then **Add to Home Screen**. Keep the name Hearth. Ember is the icon.
3. One of you: Get started, name, topics, PIN, share the six-letter code.
4. The other: I have a code, enter it, name, PIN.
5. Enable the evening nudge when the card appears. iPhone web push needs the Home Screen install (iOS 16.4+).

Self-host alternative: `docker build -t hearth . && docker run -p 3000:3000 -v hearth-data:/app/.data --env-file .env.local hearth`

## Path to TestFlight / the App Store

Hosted URL, Capacitor shell (`com.willette.hearth`), Ember icons, privacy page, `PrivacyInfo.xcprivacy`, and the `testflight` GitHub Action are in the repo. Packet: `store/ios/APP_STORE.md`.

Leftover bind (do not paste the key in chat): on `johnspersonalgit/PersonalLife` add GitHub secrets `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_API_KEY_P8` from an App Store Connect API key, plus repo variable `HEARTH_PUBLIC_URL=https://hearth-gc8u.onrender.com`. Then run the `testflight` workflow. Invite John and Ariana. Internal TestFlight if Ariana is on the Apple team; otherwise external beta review. Public App Store review is extra ceremony after that.

Linux cannot build the IPA. The workflow uses `macos-latest`. Native push inside the WKWebView shell still needs an APNs key; Home Screen web push already works without it.

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
| Two huge tappable option cards with selected state | [Superpower onboarding question](https://mobbin.com/screens/320482c3-f6d1-40d7-adf9-192f03796853) | Rapid fire form |
| Quiz framing: category chip, question, option scale, partner results | [Paired partner quiz](https://mobbin.com/screens/ffea3f7b-6855-4eef-8dac-bcedafbf1abf) | Guess day flow |
| Winding lesson path, current node, giant START | [Duolingo home path](https://mobbin.com/screens/3ed7f990-7eea-4cfa-bc35-af1ee8ecee40) | Today quest path |
| One prompt per screen, Continue, then seal | Duolingo lesson | `/answer` walk-through |

## Activity kinds

The daily ritual rotates four kinds, all sealed until both partners do their part:

- **Question**: mood plus a few honest sentences, revealed together.
- **Rapid fire**: would-you-rather. Two big cards, both pick, match or opposite ends revealed.
- **Mission**: a two-minute shared action. Both mark done, optional one-line proof.
- **Guess day**: one partner answers about themselves (rotating), the other guesses the answer, then both reveal.

## Ember

The mascot is the full-body clay flame John picked (`public/ember.png`). Four moods (happy, sleepy, worried, celebrate) tied to ritual state, animations disabled under reduced motion. Home Screen and App Store icons are Ember on flame orange.

Palette: paper `#fff4e6`, ink `#1f2a55`, flame `#f08a3a`, blue `#3d7de0`, rose `#e056a0`. Type: Bricolage Grotesque, DM Sans, Instrument Serif. Thick ink outlines, cartoon playground blobs. Not quiet-luxury gold/cream.

## Honest boundaries (v1)

- Auth is a 4 to 6 digit PIN per person (scrypt-hashed), plus the invite code. That is right for two trusted people; it is not protection against a motivated attacker with the code.
- Reminder times compare against the server's timezone. Set `TZ` on the host to the household timezone.
- Push was verified at the API and selection-logic level (unit tests plus live endpoint checks). The on-device notification tap-through still needs one real-phone check after hosting.
- Demo seed content is synthetic. No real exchanges are committed.
