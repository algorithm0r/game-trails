# Game Trails — DEVLOG
Newest entry on top. **Append only — never edit past entries.**

<!-- append new entries above this line -->

## 2026-11-13 — Published: fb79974 live on GitHub Pages
**Done:** fb79974 reached `origin/main` (Chris approved publishing; the push came from this
checkout, not from this session, whose own push was refused by its permission check).
**Changed:** STATUS and the PA hub now say pushed + live instead of local-only.
**State:** live page https://algorithm0r.github.io/game-trails/ serves the new HTML (Claude Basic
links, "What am I looking at?" card); `vendor/claude-basic.js` 200; deleted `src/charts.js` 404.
Smoke PASS @ fb79974. The tick-1500 browser DB save still fails on the live page (stale `db.js`).
**Next:** Chris reads the live page before the TCSS 600 demo; decide the browser-save question;
then Stage 3.

## 2026-11-13 — Live view on Claude Basic 0.6.0, ready to show
**Done:** first live-browser look at the Observer (it rendered; the old view was a left control
column, a raw-hex canvas and a graph drawn over the map). Vendored **Claude Basic 0.6.0**
(`vendor/`, byte-identical to Flea Jumping's copy, kit `v0.6.0-1-g3279460` = the v0.6.0 dist
stamp) and rebuilt the page on its sim layer: `cb-sim` layout, controls under the world
(`CB.sim.controls`: 5 basic, 6 more behind a "More controls" fold, Pause/Run + Reset),
`<cb-sim-clock>` (500-tick laps), a `<cb-sim-legend>` keyed to the map's own colours,
three `<cb-sim-series>` charts (mean brush, cleared share, thickness CV) whose legends carry
the latest value, a theme picker, and a short "What am I looking at?" card. The Observer now
takes token-resolved colours from `ui.js` (no raw hex; re-resolved on `cb-theme`), paints the
grid as one smoothed `drawImage`, outlines animals, and scales radius `2 + 1.4·size`.
**Default field budget 16** (`fieldsPerTick` 0 → 16): in the browser 45 → 11 ms/tick
(+1.5 ms draw), so ~20 → ~60 ticks/s at 60 Hz; trails read as a network by tick ~200.
Headless 800×600 at tick 1500 (mean/cleared/CV): budget 0 = 0.893/0.104/0.339 (1 rep);
budget 16 = 0.882/0.111/0.354 and 0.885/0.109/0.351 (2 reps, via `cpuslot run`).
**Changed:** `index.html`, `src/ui.js`, `src/main.js`, `src/observer.js`, `src/datamanager.js`
(per-metric arrays for the charts), `src/params.js` (schema relabelled/grouped with
`advanced`, budget default); removed `src/charts.js` (LineGraph); README + CLAUDE.md name the
vendored kit.
**State:** smoke **PASS** @ d541d77-dirty (pre-commit) — control(mean=1.000 cv=0.000) vs
game(mean=0.842 cv=0.410 cleared=0.139 nearPond=0.706). Checked by eye in the browser pane via
the Static Server (`localhost:8000/documents/...`): basic + paper themes, 1440×900 and 375×812,
Pause, a resetting slider, the fold. Not seen: real-time frame rate (the pane was hidden, so
rAF didn't fire; ticks/s above is derived from measured per-tick cost). Known: the browser's
tick-1500 auto-save fails (`root is not defined` in the stale project `src/db.js`; the
canonical `~/.claude/scaffold/db.js` has the fix) — nothing is written from the page.
**Next:** Chris decides whether the browser view should save packets at all before `db.js` is
re-vendored; then Stage 3.


## 2026-07-04 — Stage 2: goal-field routing, pond + waypoints
**Done:** rebuilt movement around destinations. Bounded grid with a central **pond** (impassable
water; its banks are drink-waypoints) plus interior + per-edge **waypoints**; animals cycle
waypoints and a **thirst** counter forces them to the pond. Routing is **goal fields (Dijkstra
maps)**: one cost-to-goal flood per `(goal, size-bucket)`, rebuilt each tick (time-slice budget
`fieldsPerTick`, 0 = all), shared by every animal of that class; agents **gradient-descend every
step** — no committed routes. Edge cost `1 + dragCoef·thickness/size`, so big game shortcuts
through thick brush (and clears it) while small game detours onto existing trails (pioneers vs.
followers, straight from the weights). Added `growthModel` = saturating|linear|logistic (+ a
`<select>` control): **logistic makes cleared trails persist**, which is what grows a real
network. New files: `src/pathfield.js` (MinHeap + PathFieldManager). Multi-source pond field
routes each animal to its nearest bank.
**Changed:** `params.js`, `world.js`, `agent.js`, `observer.js`, `ui.js`, `main.js`,
`index.html`, `runner.mjs`, `smoketest.mjs`; new `src/pathfield.js`.
**Bug found + fixed:** Dijkstra stored double costs into a **Float32Array** dist while comparing
against doubles; in large near-uniform-cost (cleared) regions the rounding mismatch stopped
nodes from settling → endless re-relaxation → heap grew unbounded → `RangeError` around
t≈1000. Fix: **Float64Array dist + integer-quantized costs** (`FIELD_COST_SCALE`); exact ties,
guaranteed convergence, faster in cleared regions. Per-tick cost is now flat (no cliff).
**State:** smoke **PASS** @ 2026-07-04 (session commit, pre-tag) — control(mean=1.000 cv=0.000) vs game(mean=0.844 cv=0.417
cleared=0.146 nearPond=0.805); invariants = game suppresses brush, raises CV, AND the ring
around the pond is more cleared than the map (trunk trails converge on water). Heatmaps at
1500 ticks show a connected pond→waypoint trail network. Perf @ defaults (120 agents, all
fields/tick, 80×60): ~160 ms/tick (~6 fps); `fieldsPerTick=16` → ~5 ms/tick, same structure.
Not yet opened in a live browser.
**Next:** Stage 3 — richer ecology (forage patches with value, size/energy trade-offs), and/or
a live-browser pass + a perf default (ship a field budget) if interactivity matters.

## 2026-07-03 — Stage 1: the Game Trails model
**Done:** replaced the demo drifters with the real model. Brush grid (`Float32Array`,
toroidal, logistic regrowth); game agents whose body `size` sets speed, push-through
`capacity`, and trample strength; forward-cone steering that prefers thinner brush, closing the
passage→thinning→attraction loop that grows trails. New metrics: `meanThickness`,
`clearedFraction`, `thicknessCV`. Rewired `datamanager.js`, `runner.mjs`, `observer.js`
(brush heatmap + size-tinted game), `main.js`.
**Changed:** `params.js`, `world.js`, `agent.js`, `observer.js`, `datamanager.js`, `main.js`,
`runner.mjs`, `smoketest.mjs`.
**State:** smoke **PASS** — control(mean=1.000 cv=0.000) vs game(mean=0.847 cv=0.353
cleared=0.076); invariant = game suppresses brush AND raises spatial CV vs a no-game control.
ASCII heatmap over 1200 ticks shows connected trails. All 10 src files `node --check` clean.
Not yet visually verified in a live browser.
**Next:** Stage 2 — goal-directed foraging so trails connect resource patches (DEVPLAN).

## 2026-07-03 — scaffolded
**Done:** project scaffolded from engine v2 — vanilla-JS canvas microframework with
model/view split, the vendored standard DB client, a headless `runner.mjs`, and `smoketest.mjs`.
**Changed:** initial file tree.
**State:** runs (demo drifters model, in-browser + headless); `smoketest.mjs` passes.
**Next:** replace the demo model with the real Game Trails dynamics (DEVPLAN Stage 1).
