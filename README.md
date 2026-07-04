# Game Trails

An agent-based model of how animal movement carves trails through vegetation. A grid of brush
grows thicker over time; "game" (animals of varying body size) move through it. Body size sets
each animal's speed, how thick a brush it can push through, and how much it tramples. Passage
thins the brush, and animals steer toward already-thinned cells — so repeated traffic
concentrates into persistent **trails** that fade where unused. Small game can't force through
dense brush and comes to depend on the trails cut by larger game.

A browser-based simulation (vanilla JS + Canvas, no build step), scaffolded from the shared
engine v2.

## Run
- **Browser:** open `index.html`.
- **Headless batch:** `node runner.mjs --reps 50` — runs the same sim core via `vm` and writes
  self-describing packets to MongoDB through the research Server.
- **Smoke test:** `node smoketest.mjs` — no DB; asserts the model invariant and prints metrics.

## Layout
- `src/` — sim core (`engine`, `params`, `world`, `agent`, `observer`, `datamanager`, `charts`,
  `util`) + `db.js` (vendored standard DB client) + `ui.js`/`main.js` (browser-only, all DOM).
- `runner.mjs` / `smoketest.mjs` — headless entry points.
- `DEVPLAN.md` / `DEVLOG.md` — the plan (forward) and the log (backward, append-only).

See `~/.claude/conventions.md` for the shared standards this follows.
