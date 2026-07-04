# Game Trails — STATUS
*One screen. The current pulse. Overwritten, never appended — for history read DEVLOG.*

**Updated:** 2026-07-04 (Stage 2 built) — refreshed every session close; may carry unverified claims
**Verified:** 2026-07-03 (scaffold) — last cold audit (`/audit`); the State section is trusted only as of this date

## Stage
DEVPLAN Stage 3 — Ecology / payoff-driven foraging  `[ ACTIVE ]`
(Stage 1 core model + Stage 2 goal-field routing — `[ DONE ]`)

## State
Full model runs headless: bounded grid, central pond + waypoints, thirst-driven destinations,
goal-field (Dijkstra-map) routing with `drag ∝ thickness/size`, big-clears / small-follows, and
selectable growth model. Animals gradient-descend a per-(goal,size-bucket) field every step
(no committed routes). Logistic regrowth is default (cleared trails persist → a real network).
Smoke PASS @ 2026-07-04 (session commit). Not yet opened in a live browser (Observer is
syntax-clean, not eyeballed on canvas — unverified).

## Metrics
- `meanThickness` — mean brush over land; game holds it ~0.84 vs no-game ~1.0
- `clearedFraction` — trail cells below threshold; ~0.12–0.15 at defaults
- `thicknessCV` — spatial structure; ~0.4 with game vs ~0 brush-only
- pond-pull — ring around the pond is markedly more cleared than the map (trunk trails to water)

## Branches
- `main`

## Open
- **Perf:** default is naive all-fields/tick (~160 ms/tick, ~6 fps @ 120 agents, 80×60). The
  `Field budget` slider (`fieldsPerTick≈16`) → ~5 ms/tick, same emergent result. Ship a default
  budget if interactivity matters.
- Live-browser visual check of the Observer (terrain + water + waypoints + game).
- Stage 3: payoff-driven forage patches; size/energy trade-off.
- No git remote yet (deferred by request).

## Next action
Open `index.html` to confirm the render; decide on a default field budget; then start Stage 3.

## Blockers
- none
