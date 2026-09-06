# Contributing

The arcade is a family game console: games for children, played on iPads and
phones, installed as an offline app. New games are welcome. So are fixes.

## What fits

- A game a child can start without a manual, that a family can finish in one
  sitting on one device. Pass-and-play is fine; so is solo.
- Kid-facing copy that is warm and plain. Icons are line SVGs, never emoji.
- Everything bundled. No fonts, models, images or scripts fetched from a URL —
  the app has to work on a plane. (The Caribbean map's tiles are the one
  agreed exception; do not add another.)
- Nothing that phones home. No analytics, accounts, ads, or third-party
  scripts. Profiles live in the browser and nowhere else.
- Art, sounds and models you made or hold a licence for. Name a game after
  what it is, not after a trademark.

Online play, 3D scenes and computer opponents exist here and have their own
patterns; start single-device, and see the pointers at the end of the
walk-through before adding those.

## Start

Node 20 (`mise` and `nvm` pick it up from the repo). Then:

```bash
npm ci
npm run new-game -- <id> "<Title>"   # a small, complete starter game on the wall
npm run dev                          # play it at /#/<id>
```

The starter is a number-guessing round — pure rules, a screen, tests, styles,
a ticket on the landing page — and it passes every gate as written. Replace
its rules and its screen with yours; keep the shape.
[docs/development/adding-a-game.md](docs/development/adding-a-game.md) walks
through every file.

## Before a pull request

```bash
npm run check      # tsc, ESLint (with the accessibility rules), knip
npx vitest run
npm run build
npm run shots -- <id>   # a real screenshot of the page, into docs/screenshots/
```

All four clean. `check` carries a known count of warnings from React's
compiler-readiness rules; a new one is yours to remove, not to add to. Commit
the screenshot with the change, open it first, and say in the PR what it
shows. Lead the PR with what the family gets.

CI runs the same gates, and scaffolds a fresh starter game to be sure the
on-ramp still works.

## Review

The owner reads and merges. Expect edits to copy — the audience is young —
and questions about anything that moves, records, or fetches. Small PRs land
faster than large ones; a game that arrives playable and grows in later PRs
is easier to take than one that arrives finished.
