// No-DB sanity run. Verifies the model's core causal invariants and prints the numbers that
// belong in the DEVLOG entry (proof coupled to log). Exits non-zero on failure.
//   node smoketest.mjs
//
// Invariants (game carves a trail network to water):
//  1. suppresses  — game holds mean brush below a no-game control grown for the same ticks.
//  2. structures  — game raises spatial thickness CV vs the control (thin trails through thick).
//  3. pond-pull   — because all game must drink, the ring of land around the pond is more
//                   cleared (thinner) than the map overall: trunk trails converge on water.
// Uniform regrowth alone produces none of these. Runs a shrunken grid for a fast test.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function load() {
  const ctx = { Math, console, Date };
  vm.createContext(ctx);
  for (const f of ['util.js', 'params.js', 'engine.js', 'pathfield.js', 'agent.js', 'world.js']) {
    vm.runInContext(readFileSync(path.join(__dirname, 'src', f), 'utf8'), ctx, { filename: f });
  }
  return ctx;
}

function run(nAgents, ticks) {
  const ctx = load();
  const P = ctx.PARAMETERS;
  P.cellSize = 14; P.nAgents = nAgents;      // smaller/lighter grid for a quick smoke
  const world = new ctx.World(700, 500);
  const engine = new ctx.GameEngine();
  for (let t = 1; t <= ticks; t++) { engine.tick = t; world.update(engine); }
  return { world, mean: world.meanThickness(), cv: world.thicknessCV(), cleared: world.clearedFraction() };
}

// mean land thickness within `pad` cells of the pond edge
function ringMean(world, pad) {
  const th = world.thickness, water = world.isWater, cols = world.cols, rows = world.rows;
  const R = world.pondRadiusCells + pad;
  let s = 0, n = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (water[i]) continue;
      const dx = x + 0.5 - world.pondCX, dy = y + 0.5 - world.pondCY;
      if (dx * dx + dy * dy <= R * R) { s += th[i]; n++; }
    }
  }
  return n ? s / n : 0;
}

const TICKS = 600;
const control = run(0, TICKS);
const game = run(55, TICKS);
const nearPond = ringMean(game.world, 4);

const suppresses = game.mean < control.mean - 0.02;
const structures = game.cv > control.cv;
const pondPull = nearPond < game.mean - 0.01;
const ok = suppresses && structures && pondPull;

console.log('smoke: control(mean=' + control.mean.toFixed(3) + ' cv=' + control.cv.toFixed(3) + ')' +
  '  game(mean=' + game.mean.toFixed(3) + ' cv=' + game.cv.toFixed(3) +
  ' cleared=' + game.cleared.toFixed(3) + ' nearPond=' + nearPond.toFixed(3) + ')');
console.log('smoke: suppresses=' + suppresses + ' structures=' + structures +
  ' pondPull=' + pondPull + ' -> ' + (ok ? 'PASS' : 'FAIL'));
process.exit(ok ? 0 : 1);
