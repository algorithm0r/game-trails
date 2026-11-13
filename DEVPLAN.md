# Game Trails — DEVPLAN
*Living document, not frozen. Update as the design evolves.*

## Built
- Scaffolded from engine v2 (vanilla-JS canvas + standard DB client).
- **Stage 1 — core model:** brush grid with regrowth; size-driven game that trample and steer;
  trails from the passage→thinning→attraction loop.
- **Stage 2 — goal-field routing:** bounded grid, central pond + waypoints, thirst-driven
  destinations, per-(goal,size-bucket) Dijkstra-map routing with `drag ∝ thickness/size`,
  big-clears-thick / small-follows, and selectable growth model (logistic = persistent trails).

## Not yet built
- Forage patches with value (animals choosing *where* to go by payoff, not uniformly random).
- Size/energy trade-offs (big game faster + clears but "costs" more; small game cheap).
- Fire / disturbance mechanic to thin brush independent of game.
- Hex grid option.
- ~~Live-browser visual verification; a shipped field budget if smooth interactivity is wanted.~~
  → **Stage 2b** (done 2026-11-13).

## Stages
### Stage 1 — Replace the demo model  [ DONE ]
See DEVLOG 2026-07-03. Smoke asserts game suppresses brush + raises spatial CV vs a no-game control.

### Stage 2 — Goal-directed movement to a water source  [ DONE ]
- [x] Bounded grid, central pond (impassable), bank + interior + edge waypoints
- [x] Thirst counter forces periodic drinking; otherwise random waypoint cycling
- [x] Goal-field (Dijkstra-map) pathfinding, one field per (goal, size-bucket), `fieldsPerTick` budget
- [x] `drag ∝ thickness/size` routing (pioneers vs followers) + big-clears / small-maintains
- [x] Growth models: saturating | linear | logistic (persistence knob)
**Done when:** trails visibly connect waypoints to water and the smoke asserts pond-pull
(ring around the pond more cleared than the map).  ✔ smoke PASS; 1500-tick heatmaps show the network.

### Stage 2b — Live view a first-time viewer can read  [ DONE ] (closed 2026-11-13)
- [x] Open the Observer in a real browser and fix what it shows
- [x] Vendor Claude Basic 0.6.0; page on the `cb-sim` layout, no raw hex, theme picker
- [x] Map legible at a glance: brush ramp, pond, destinations, animal size by radius + tint, legend
- [x] A few labelled controls under the world (rest in a fold), Pause/Reset
- [x] Live charts with current values: mean thickness, cleared share, CV
- [x] "What am I looking at?" panel
- [x] Default field budget (`fieldsPerTick` 16) so trails form within a short watch
**Done when:** someone new can open `index.html`, see trails form within ~30 s, and read what
the map and charts show without being told.  ✓ Met — network visible by tick ~200 (~4 s at the
derived rate); checked by eye in two themes and two widths (DEVLOG 2026-11-13).

### Stage 3 — Ecology / payoff-driven foraging  [ ACTIVE ]
- [ ] Forage patches with value + depletion/regrowth; destination choice weighted by payoff & distance
- [ ] Size/energy budget so body size carries a real trade-off, not just capability
- [ ] A metric that distinguishes a *networked* trail system from diffuse clearing
**Done when:** trail topology and animal routing respond to where the food is, not just the water.

## Backlog
- [ ] fix: browser auto-save at epoch fails (`root is not defined`, `src/db.js:69`); the
  canonical `~/.claude/scaffold/db.js` has the fix, `~/.claude/scaffold/engine/src/db.js` does
  not. Decide first whether the demo page should write packets to the research DB at all.
- [ ] fix: the page loads socket.io from a CDN only for that save; drop it if the browser view
  stops saving.
- [ ] idea: a "no animals" reference line on the mean-brush chart (control reaches 1.0), so the
  suppression reads without the panel text.
- [ ] idea: click-to-place water or destinations (the game-design pitch for TCSS 600).
