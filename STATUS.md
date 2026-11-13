# Game Trails — STATUS
*One screen. The current pulse. Overwritten, never appended — for history read DEVLOG.*

**Updated:** 2026-11-13 (live view on Claude Basic) — refreshed every session close; may carry unverified claims
**Verified:** 2026-07-03 (scaffold) — last cold audit (`/audit`); the State section is trusted only as of this date

## Stage
DEVPLAN Stage 3 — Ecology / payoff-driven foraging  `[ ACTIVE ]` (not started)
(Stage 1 core model, Stage 2 goal-field routing, Stage 2b live view — `[ DONE ]`)

## State
Full model runs headless and in the browser. The browser view is on **Claude Basic 0.6.0**
(vendored `vendor/`): map with brush ramp, pond, destinations and size-scaled animals; legend;
5 controls under the map (+6 in a fold), Pause/Reset; time dial; live charts of mean
thickness, cleared share and CV with current values; a "What am I looking at?" card; theme
picker. Checked by eye 2026-11-13 (basic + paper, 1440×900 + 375×812). Default field budget
is now 16 (~11 ms/tick in the browser vs 45 at 0). Smoke PASS @ d541d77-dirty (the session
commit). Real-time frame rate not observed (hidden pane); derived ~60 ticks/s.

## Metrics
- `meanThickness` — mean brush over land; ~0.88 at 1500 ticks (800×600) vs no-game 1.0
- `clearedFraction` — trail cells below threshold; ~0.10–0.14
- `thicknessCV` — spatial structure; ~0.35–0.41 with game vs 0 brush-only
- pond-pull — ring around the pond markedly more cleared than the map (trunk trails to water)

## Branches
- `main` (remote `origin` = public GitHub repo; this session's commit is local, not pushed)

## Open
- Browser auto-save at tick 1500 fails (`root is not defined`, stale `src/db.js`); nothing is
  written from the page. Fix by re-vendoring the canonical `db.js`, but decide first whether a
  demo page should write to the research DB (Backlog).
- Stage 3: payoff-driven forage patches; size/energy trade-off.

## Next action
Chris looks at the page (http://localhost:8000/documents/Research/Game%20Trails/sim/) and
approves a push; then decide the browser-save question; then Stage 3.

## Blockers
- none
