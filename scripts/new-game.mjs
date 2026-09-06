#!/usr/bin/env node
/**
 * Put a new game on the wall.
 *
 *   npm run new-game -- <id> "<Title>" [--color #hex]
 *   npm run new-game -- hot-cold "Hot or Cold" --color #ffb74d
 *
 * Writes a small, complete, playable starter game — a number-guessing round
 * with pure rules, a screen, tests, and styles — under `src/games/<id>/`, and
 * makes every edit outside that folder a game needs: the registry line, the
 * icon, the ticket colour, a screenshot, a poster. The result passes every
 * gate as written, so the first thing a contributor does is play it, and the
 * second is replace its rules with their own.
 *
 * The starter is a template, not a generator with options: it shows the one
 * shape a game here has (docs/development/adding-a-game.md), and the
 * placeholders are the only things that vary.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TEMPLATES = path.join(ROOT, 'scripts', 'templates', 'game');

/** Ticket colours for games that did not choose one, in the order they arrive. */
const PALETTE = ['#ffb74d', '#4dd0e1', '#ba68c8', '#aed581', '#f06292', '#7986cb'];

function fail(message) {
  console.error(`new-game: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  let color;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--color') color = argv[++i];
    else if (argv[i].startsWith('--')) fail(`unknown option ${argv[i]}`);
    else positional.push(argv[i]);
  }
  const [id, title] = positional;
  if (!id || !title) fail('usage: npm run new-game -- <id> "<Title>" [--color #hex]');
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) {
    fail(`id "${id}" must be lowercase letters, digits and single hyphens, starting with a letter`);
  }
  if (color && !/^#[0-9a-f]{6}$/i.test(color)) fail(`--color wants a six-digit hex colour, not "${color}"`);
  return { id, title: title.trim(), color };
}

/** hot-cold → HotCold */
const pascal = (id) => id.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
/** hot-cold → hotCold */
const camel = (id) => pascal(id).replace(/^[A-Z]/, (c) => c.toLowerCase());

function fill(text, vars) {
  return text.replace(/__(id|camel|Name|title|color)__/g, (_, key) => vars[key]);
}

/** Insert `line` before the first `closer` that follows `opener` in a file. */
function insertInto(file, opener, closer, line) {
  const full = path.join(ROOT, file);
  const src = fs.readFileSync(full, 'utf8');
  const from = src.indexOf(opener);
  if (from < 0) fail(`could not find "${opener}" in ${file}`);
  const at = src.indexOf(closer, from);
  if (at < 0) fail(`could not find the end of "${opener}" in ${file}`);
  fs.writeFileSync(full, `${src.slice(0, at)}${line}${src.slice(at)}`);
  console.log(`  edited:  ${file}`);
}

/** Append `text` to a file, after its last line. */
function appendTo(file, text) {
  const full = path.join(ROOT, file);
  const src = fs.readFileSync(full, 'utf8');
  fs.writeFileSync(full, `${src.replace(/\s*$/, '\n')}${text}`);
  console.log(`  edited:  ${file}`);
}

/** The starter game's files, from the templates, with the placeholders filled. */
function writeGame(vars) {
  const dest = path.join(ROOT, 'src', 'games', vars.id);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const from = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(from);
        continue;
      }
      const rel = fill(path.relative(TEMPLATES, from).replace(/\.tmpl$/, ''), vars);
      const to = path.join(dest, rel);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.writeFileSync(to, fill(fs.readFileSync(from, 'utf8'), vars));
      console.log(`  wrote:   ${path.relative(ROOT, to)}`);
    }
  };
  walk(TEMPLATES);
}

/**
 * A poster for the ticket until the game has a real one: the ticket colour
 * over the carnival's midnight, 16:9 at the size `npm run previews` makes.
 * Step two on the way out replaces it with a screenshot of the real thing.
 */
async function writePoster(vars) {
  const to = path.join(ROOT, 'src', 'games', vars.id, 'assets', 'preview.webp');
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${vars.color}" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#g)"/>
    <circle cx="500" cy="120" r="70" fill="#0f172a" fill-opacity="0.25"/>
    <circle cx="150" cy="260" r="110" fill="#ffffff" fill-opacity="0.12"/>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 78 }).toFile(to);
  console.log(`  wrote:   ${path.relative(ROOT, to)} (placeholder poster)`);
}

async function main() {
  const { id, title, color: chosen } = parseArgs(process.argv.slice(2));
  const gameDir = path.join(ROOT, 'src', 'games', id);
  if (fs.existsSync(gameDir)) fail(`src/games/${id} already exists`);
  const registry = fs.readFileSync(path.join(ROOT, 'src/app/registry.ts'), 'utf8');
  if (registry.includes(`@games/${id}'`)) fail(`the registry already lists "${id}"`);

  // The next unused palette colour, so two scaffolded games don't match.
  const css = fs.readFileSync(path.join(ROOT, 'src/app/styles/app.css'), 'utf8');
  const color = chosen ?? PALETTE.find((c) => !css.includes(c)) ?? PALETTE[0];
  const vars = { id, camel: camel(id), Name: pascal(id), title, color };

  console.log(`Adding ${title} (${id}) to the wall…`);
  writeGame(vars);
  await writePoster(vars);

  // The one line in the registry (the import stays alphabetical).
  insertInto(
    'src/app/registry.ts',
    'export const GAMES: GameDescriptor[] = [',
    '];',
    `, ${vars.camel}`,
  );
  {
    const file = path.join(ROOT, 'src/app/registry.ts');
    const src = fs.readFileSync(file, 'utf8');
    const imports = [...src.matchAll(/^import \{ \w+ \} from '@games\/[\w-]+';$/gm)];
    const line = `import { ${vars.camel} } from '@games/${id}';`;
    const after = imports.find((m) => m[0] > line) ?? null;
    const at = after ? after.index : imports[imports.length - 1].index + imports[imports.length - 1][0].length + 1;
    fs.writeFileSync(file, `${src.slice(0, at)}${line}\n${src.slice(at)}`);
  }

  // A placeholder icon, in the shared line style, until the game draws its own.
  appendTo(
    'src/shared/ui/icons.tsx',
    `
/** ${title} — a question in a circle until the game draws its own. */
export const ${vars.Name}Icon = (p: IconProps) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1 1-1 1.7M12 17h.01" />
    </>,
    p,
  );
`,
  );

  // The ticket's colour on the wall.
  insertInto(
    'src/app/styles/app.css',
    '.tk.game-yahtzee {',
    '\n.tk:hover,',
    `\n.tk.game-${id} { --c: ${color}; } /* ${title} */`,
  );

  // A screenshot of the page, and the poster made from it.
  insertInto(
    'scripts/screenshots.mjs',
    'const SHOTS = [',
    '\n];',
    `
  {
    name: '${id}',
    path: '/#/${id}',
    viewport: TABLET,
    expect: '[data-testid="${id}-page"]',
  },`,
  );
  insertInto(
    'scripts/game-previews.mjs',
    'const PREVIEWS = {',
    '\n};',
    `\n  '${id}': { from: '${id}.png', to: 'src/games/${id}/assets/preview.webp' },`,
  );

  console.log(`
Done. ${title} is on the wall at /#/${id}.

  1. npm run dev              play it; then make it yours in src/games/${id}/
  2. npm run shots -- ${id}   a real screenshot of the page …
     npm run previews -- ${id}   … and the ticket's poster from it
  3. npm run check            the gates — plus npx vitest run, npm run build

Every step is in docs/development/adding-a-game.md.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
