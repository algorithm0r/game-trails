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
- Live-browser visual verification; a shipped field budget if smooth interactivity is wanted.

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

### Stage 3 — Ecology / payoff-driven foraging  [ ACTIVE ]
- [ ] Forage patches with value + depletion/regrowth; destination choice weighted by payoff & distance
- [ ] Size/energy budget so body size carries a real trade-off, not just capability
- [ ] A metric that distinguishes a *networked* trail system from diffuse clearing
**Done when:** trail topology and animal routing respond to where the food is, not just the water.
