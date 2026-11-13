'use strict';
// Single source of truth for every tunable. Serialized verbatim into every saved data
// packet (see datamanager.js) so any run reconstructs from its stored parameters.
// Declared `var` so it's a global in the browser AND in the headless vm context.
var PARAMETERS = {
  // --- grid / brush ---
  cellSize: 10,          // px per grid cell; cols/rows derive from canvas size (bounded, no wrap)
  growthModel: 'logistic', // 'saturating' | 'linear' | 'logistic' — logistic makes cleared trails PERSIST
  growthRate: 0.02,      // regrowth rate per tick
  seedFloor: 0.02,       // logistic only: lets a fully-cleared cell start recovering (else t*(1-t)=0)
  initMin: 0.4,          // initial brush thickness range (uniform)
  initMax: 0.9,
  clearThreshold: 0.15,  // a cell counts as "cleared" (trail) below this thickness

  // --- pond (central water; all game must drink) ---
  pondRadiusFrac: 0.12,  // pond radius as a fraction of min(canvas w,h); its cells are impassable

  // --- waypoints (destinations game cycle through) ---
  nInteriorWaypoints: 6,      // scattered inland destinations
  nEdgeWaypointsPerSide: 3,   // destinations spaced along each of the 4 borders

  // --- game (the moving agents) ---
  nAgents: 120,          // number of game animals
  sizeMin: 0.6,          // body-size range; size drives speed, drag, and clearing
  sizeMax: 3.0,
  sizeBuckets: 5,        // size classes: one routing field is shared per (goal, bucket)
  baseSpeed: 3.0,        // px/tick base; speed = baseSpeed * size * mobility
  dragCoef: 3.0,         // brush drag: cost/slowdown scales as dragCoef * thickness / size
  capacityCoef: 0.4,     // an animal clears a cell only if capacityCoef*size > its thickness
  clearPct: 0.3,         // when it clears, thickness drops by this fraction
  thirstThreshold: 350,  // ticks before an animal is forced to route to the pond to drink

  // --- pathfinding (goal fields, a.k.a. Dijkstra maps) ---
  fieldsPerTick: 16,     // max fields rebuilt per tick (time-slice budget); 0 = rebuild ALL.
                         // 16 (2026-11-13): ~4x faster per tick than 0, same trails at 1500 ticks
                         // (DEVLOG); set 0 for exact every-tick routing.

  // --- engine ---
  updatesPerDraw: 1,     // fast-forward: sim updates per rendered frame

  // --- data collection ---
  reportingPeriod: 20,   // sample the metrics every N ticks
  epoch: 1500,           // a run ends (and ships a packet) at N ticks

  // --- database (the standard vendored client, src/db.js) ---
  db: {
    transport: 'socket',
    server: 'https://research.climbinggiants.com:8888',
    mongoUrl: 'mongodb://127.0.0.1:27017',
    db: 'gameTrailsDB',
    run: 'run',
  },
};

// Schema drives the auto-generated control panel (ui.js). One entry per live-tunable.
// `resets: true` rebuilds the world when the control changes (needed when the change alters
// agent count or the size-bucketing, both baked in at construction).
var PARAM_SCHEMA = [
  // the strip under the world: the few knobs a first-time viewer needs
  { key: 'nAgents', label: 'Animals', min: 0, max: 400, step: 5, resets: true },
  { key: 'growthRate', label: 'Regrowth rate', min: 0, max: 0.08, step: 0.002 },
  { key: 'dragCoef', label: 'Brush drag', min: 0, max: 8, step: 0.5 },
  { key: 'growthModel', label: 'Regrowth model', type: 'select',
    options: ['saturating', 'linear', 'logistic'] },
  { key: 'updatesPerDraw', label: 'Steps per frame', min: 1, max: 20, step: 1 },
  // `advanced: true` puts a control behind the "More controls" fold (ui.js)
  { key: 'sizeBuckets', label: 'Size classes', min: 1, max: 10, step: 1, resets: true, advanced: true },
  { key: 'baseSpeed', label: 'Base speed', min: 0.5, max: 8, step: 0.5, advanced: true },
  { key: 'capacityCoef', label: 'Clear capacity', min: 0.1, max: 1, step: 0.05, advanced: true },
  { key: 'clearPct', label: 'Clear amount', min: 0, max: 0.8, step: 0.05, advanced: true },
  { key: 'thirstThreshold', label: 'Thirst interval', min: 50, max: 1500, step: 50, advanced: true },
  { key: 'fieldsPerTick', label: 'Route maps rebuilt per tick (0 = all)', min: 0, max: 120, step: 1, advanced: true },
];
