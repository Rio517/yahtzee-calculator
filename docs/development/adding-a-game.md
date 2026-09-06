# Adding a game

A game is one folder under `src/games/` and one line in the registry. The
landing page prints its ticket, the router mounts its page behind the player
gate, and the party pill and the Save Station learn its name — none of that
is written per game. This is the whole path from an empty folder to a pull
request.

## 1. Scaffold

```bash
npm run new-game -- <id> "<Title>"            # e.g. hot-cold "Hot or Cold"
npm run new-game -- <id> "<Title>" --color "#ffb74d"
```

`<id>` is lowercase with hyphens; it becomes the route (`/#/<id>`), the CSS
class, the test-id prefix and the `game` on a history row. The scaffold
writes the starter game and makes every edit outside the folder a game
needs:

| Written | What it is |
|---|---|
| `src/games/<id>/index.ts` | The descriptor: title, players, route, poster, icon, page |
| `src/games/<id>/domain/rules.ts` + test | The rules, pure — no DOM, storage, or clock |
| `src/games/<id>/components/<Name>Page.tsx` + test | The screen |
| `src/games/<id>/styles/<id>.css` | The screen's own styles, on the shared tokens |
| `src/games/<id>/assets/preview.webp` | A placeholder poster, until step 5 |

| Edited | The line |
|---|---|
| `src/app/registry.ts` | The import and the entry in `GAMES` |
| `src/shared/ui/icons.tsx` | `<Name>Icon`, a placeholder in the shared line style |
| `src/app/styles/app.css` | `.tk.game-<id> { --c: … }`, the ticket's colour |
| `scripts/screenshots.mjs` | A `SHOTS` entry for the page, with `expect` |
| `scripts/game-previews.mjs` | A `PREVIEWS` entry, poster from that screenshot |

`npm run dev`, open `/#/<id>`, play a round. The starter is a number-guessing
game: a secret between 1 and 20, six guesses, higher or lower. It passes
every gate as written, and CI scaffolds one on every pull request to keep it
that way.

## 2. The shape

```
src/games/<id>/
  index.ts        the GameDescriptor — the only thing the app imports
  domain/         rules: pure functions over plain data, tested on their own
  components/     the page and its parts; React only, no rules
  styles/         one stylesheet, scoped under .<id>
  assets/         the poster (and models, sounds — all bundled)
  state/          hooks that hold a running game (bigger games)
  storage/        saves, under keys like `<id>:save:v1` (bigger games)
```

The line between `domain/` and `components/` is the one that matters. Rules
take state and return state; randomness comes in as a function
(`seededRng` from `@shared/rng` in tests, `Math.random` in the app — ADR
0005), so a test can replay any round. The screen calls the rules and shows
what comes back. Magic Coins (`src/games/unicorn/`) is the same shape at
full size; read it when the starter feels too small.

## 3. Make it yours

**Rules.** Replace `domain/rules.ts` and its test. Keep the functions pure and
the state plain data. Every rule you write gets a test in the same folder.

**Screen.** Replace the body of `<Name>Page.tsx`. What the starter shows and a
review will look for:

- `data-testid` on everything a finger or a test touches; a keyboard path to
  every control (buttons, not clickable divs); `:focus-visible` styling.
- Dialogs close on Escape through `useDismissOnEscape`; backdrop click is
  the mouse convenience, the close button is the keyboard path.
- Every animation sits behind `@media (prefers-reduced-motion: no-preference)`.
- Text 14px or larger. Icons from `@shared/ui/icons`, never emoji.
- Colours and controls from `@shared/styles/tokens.css` (`.btn`, `.panel`,
  `.modal`, `.topbar`, `.back-link`); the game's own stylesheet lays out
  what is particular to it.

**Copy.** Warm, short, for a child who will not read a manual. The `blurb`
and `facts` on the descriptor are what a player sees when they open the
ticket to look before playing.

**Icon.** `<Name>Icon` in `src/shared/ui/icons.tsx` is a question mark until
you draw one: a 24×24 line drawing in `currentColor`, through the file's
`svg()` helper.

## 4. Players and points

The router puts every game behind the player gate, so someone is always
signed in. The starter reads them with `useProfile()` and credits the round
with `recordResultFor(userId, {...})` from `@shared/profile/results` — the
history row, points and the win/loss tally follow from that. Whether a solo
game should record at all is the game's call: the racer's time trial records
nothing; Ship Battle's computer captains count as opponents.

Pass-and-play games seat several tickets on one device:
`useSeats('<id>', count)` from `@shared/profile/useSeats` plus `<SeatPicker>`
from `@shared/profile/SeatPicker`, then `table.remember()` when the game
starts. Magic Coins shows the pattern. Games
never import identity directly (`useIdentity`, the users store) — ESLint
blocks it; profiles and seats are the way in.

## 5. Screenshot and poster

```bash
npm run shots -- <id>       # builds, serves, screenshots the page into docs/screenshots/<id>.png
npm run previews -- <id>    # the ticket's poster, cut from that screenshot
```

Open the screenshot and look at it: the page you meant, nothing clipped, no
scrollbar. The shot's `expect` fails the run if the page is not there; add
`fits: true` if the page is meant to fill the screen without scrolling. If
the poster crops badly (it takes the top 16:9 of the shot), add a `prep`
step to the `SHOTS` entry that scrolls or opens what should be in frame.
Commit both files with the game.

## 6. The gates

```bash
npm run check        # tsc -b, ESLint (jsx-a11y, react-hooks), knip dead code
npx vitest run
npm run build
```

- `check` reports a known count of warnings from React's compiler-readiness
  rules; the number must not go up. Silencing an accessibility rule is done
  per line, with a comment saying why.
- Tests run in jsdom: no WebGL (a 3D scene must catch the error and render a
  `*-fallback` element), no layout (`getBoundingClientRect` is zeros), and
  `matchMedia` may be missing — guard it.
- knip flags exports nothing imports. Export what is used.

## 7. Beyond a single device

Not covered here, each with an example to read:

- **Online play** — a `net/protocol.ts` with a type guard, the shared peer
  transport, and "longer log wins" reconciliation (ADR 0003; Rainbow Racer
  is the smallest example). Undo and custom starts stay local-only.
- **The party** — a game opens its table with `party.openTable('<id>')` and a
  guest arrives through `usePartyDoor` (ADR 0008; Chess).
- **3D** — three.js behind `React.lazy`, procedural geometry or meshopt GLBs
  through `npm run glb` (ADR 0006; Rainbow Racer's arena).
- **Computer players** — a pure, seeded policy in the game's own `domain/`
  and `computer: true` on the descriptor (ADR 0009; Risk's generals).

## 8. The pull request

Lead with what the family gets. Link the screenshot by commit SHA
(`https://raw.githubusercontent.com/<owner>/<repo>/<sha>/docs/screenshots/<id>.png`),
say what it shows, and add a line for the game to the list at the top of
`README.md`. CI runs the gates and scaffolds a fresh starter beside them.
