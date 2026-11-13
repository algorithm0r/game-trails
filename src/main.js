'use strict';
// Browser entry + wiring (not loaded headlessly). reset() rebuilds the world from the
// current PARAMETERS; the boot sequence is straight — no AssetManager gate.
var gameEngine, world, dataManager, observer, db, paused = false;

function reset() {
  gameEngine.clear();
  const cv = gameEngine.ctx.canvas;
  world = new World(cv.width, cv.height);
  db = createDB(PARAMETERS.db);
  dataManager = new DataManager(world, db);
  observer = new Observer(world, worldColors());
  gameEngine.add(world);
  gameEngine.add(observer);
  gameEngine.add(dataManager);
  gameEngine.add(new UiPump(gameEngine, dataManager));
  wireCharts(dataManager);
  if (paused) gameEngine.draw();   // a reset while paused still shows the new world
}

function togglePause() {
  paused = !paused;
  if (paused) gameEngine.stop(); else gameEngine.start();
}

window.onload = function () {
  $('picker').appendChild(CB.theme.picker());
  buildLegend();
  gameEngine = new GameEngine();
  gameEngine.init($('gameWorld').getContext('2d'));
  buildControls();
  reset();
  gameEngine.start();
};
