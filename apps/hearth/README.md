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

## Notifications

Web push is wired end to end: a service worker (`public/sw.js`), subscription storage, a nudge push to the partner, and a nightly reminder for whoever has not answered by their reminder time.

- Env (see `.env.local`, regenerate for production with `npx web-push generate-vapid-keys`): `HEARTH_VAPID_PUBLIC`, `HEARTH_VAPID_PRIVATE`, `HEARTH_VAPID_CONTACT`, `HEARTH_CRON_SECRET`.
- Schedule `POST /api/notify` with header `Authorization: Bearer $HEARTH_CRON_SECRET` every 15 minutes (any cron: Render Cron, GitHub Actions schedule, or a system crontab).
- iPhone receives web push only when the app is installed to the Home Screen (iOS 16.4+). Enable from the card on the Today tab.

## Path to our phones (recommended)

1. Host the Docker image anywhere with a persistent disk mounted at `/app/.data` (Render Starter + 1 GB disk, Fly.io volume, or a home server). `docker build -t hearth . && docker run -p 3000:3000 -v hearth-data:/app/.data --env-file .env.local hearth`
2. Open the URL on both phones, join with the code, set PINs.
3. Add to Home Screen. Enable the evening nudge. Done. No Apple review, no store, works today.

## Path to the App Store

Status: Apple Developer account active (gate cleared 2026-10-02). The repo now contains the complete Capacitor scaffold: `capacitor.config.ts`, generated `ios/` (Xcode project, SPM layout) and `android/` projects, the push-notifications plugin, and `native-shell/` as the offline fallback page. `npx cap sync` is verified; `npx cap doctor` reports Android green and iOS ready pending Xcode.

Remaining lane, in order:

1. Host the app (Docker section above) so it has a public URL.
2. Set `HEARTH_PUBLIC_URL` to that URL and run `npx cap sync`.
3. Build the IPA on a Mac lane: any Mac with Xcode (`npx cap open ios`, archive, upload), or a cloud Mac builder (Codemagic, GitHub Actions macos runner) with your signing assets. Bundle ID is `com.willette.hearth`; match it in App Store Connect.
4. Native push inside the shell needs the APNs path: create an APNs key in the Apple Developer portal, then wire `@capacitor/push-notifications` registration to a token endpoint. Web push does not run inside the native WKWebView shell; the PWA path already delivers notifications without any of this.
5. Distribute via TestFlight. Public App Store review for a two-person app is ceremony with no distribution benefit.

Note: the Dockerfile was verified as a production `next build` plus standalone output assembled exactly as the Dockerfile assembles it, but the image itself was not built locally (no Docker daemon on the dev machine).

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

- Auth is a 4 to 6 digit PIN per person (scrypt-hashed), plus the invite code. That is right for two trusted people; it is not protection against a motivated attacker with the code.
- Reminder times compare against the server's timezone. Set `TZ` on the host to the household timezone.
- Push was verified at the API and selection-logic level (unit tests plus live endpoint checks). The on-device notification tap-through still needs one real-phone check after hosting.
- Demo seed content is synthetic. No real exchanges are committed.
