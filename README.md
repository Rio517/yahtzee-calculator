# Yahtzee Logger

A mobile-first single-page Yahtzee score logger. You roll real dice — this just keeps the scorecard.

**Use it:** https://rio517.github.io/yahtzee-calculator/

## Features

- Tap any row to log that category's score
- Constrained pickers: only valid scores are offered (no typos)
- Toggle pickers (0 / 25 / 30 / 40 / 50) for fixed-value categories
- Auto upper-section subtotal + bonus (+35 at ≥63)
- Yahtzee bonus tracking (+100 each additional Yahtzee)
- Live grand total in the header
- Persists in `localStorage` so refreshing keeps your game
- Tap a locked row to change the score (or clear it)
- Works fully offline after first load
- One file: `index.html` (no build, no dependencies)

## Local

Just open `index.html` in a browser.

## Deploy

Push to `main`; GitHub Pages serves `index.html` from the repo root.
