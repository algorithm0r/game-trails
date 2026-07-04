# Game Trails — DEVLOG
Newest entry on top. **Append only — never edit past entries.**

<!-- append new entries above this line -->

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
