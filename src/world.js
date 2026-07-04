'use strict';
// The world: a bounded grid of brush thickness with a central pond, a set of waypoints the
// game cycle through, and the game themselves. Holds all state and advances it; draws nothing
// (the Observer renders). Grid is a flat Float32Array (cols*rows) of thickness in [0,1].
// Same file runs in the browser and headless (no DOM).
var World = class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cols = Math.max(1, Math.floor(width / PARAMETERS.cellSize));
    this.rows = Math.max(1, Math.floor(height / PARAMETERS.cellSize));
    this.cw = width / this.cols;   // actual cell size in px (fills the canvas exactly)
    this.ch = height / this.rows;
    const N = this.cols * this.rows;

    // brush thickness, seeded with uniform noise so there is initial structure to carve
    this.thickness = new Float32Array(N);
    const { initMin, initMax } = PARAMETERS;
    for (let i = 0; i < N; i++) this.thickness[i] = initMin + Math.random() * (initMax - initMin);

    this._carvePond();
    this._placeWaypoints();

    // the game
    this.fieldManager = new PathFieldManager(this);
    this.agents = [];
    for (let i = 0; i < PARAMETERS.nAgents; i++) {
      const size = PARAMETERS.sizeMin + Math.random() * (PARAMETERS.sizeMax - PARAMETERS.sizeMin);
      const c = this._randomLandCell();
      this.agents.push(new Agent((c % this.cols + 0.5) * this.cw, ((c / this.cols | 0) + 0.5) * this.ch, size));
    }
    for (const a of this.agents) a.pickWaypoint(this);   // initial destinations
  }

  // --- construction helpers ---
  _carvePond() {
    const N = this.cols * this.rows;
    this.isWater = new Uint8Array(N);
    this.isBank = new Uint8Array(N);
    this.bankCells = [];
    const ccx = this.cols / 2, ccy = this.rows / 2;
    const r = Math.round(PARAMETERS.pondRadiusFrac * Math.min(this.cols, this.rows));
    this.pondCenterCell = (ccy | 0) * this.cols + (ccx | 0);
    this.pondRadiusCells = r;
    this.pondCX = ccx; this.pondCY = ccy;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const dx = x + 0.5 - ccx, dy = y + 0.5 - ccy;
        if (dx * dx + dy * dy <= r * r) { this.isWater[y * this.cols + x] = 1; this.thickness[y * this.cols + x] = 0; }
      }
    }
    // banks = land cells touching water (the drinking waypoints)
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const i = y * this.cols + x;
        if (this.isWater[i]) continue;
        let touch = false;
        for (let dy = -1; dy <= 1 && !touch; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) continue;
            if (this.isWater[ny * this.cols + nx]) { touch = true; break; }
          }
        }
        if (touch) { this.isBank[i] = 1; this.bankCells.push(i); }
      }
    }
  }

  _placeWaypoints() {
    this.waypoints = [];
    const nSide = PARAMETERS.nEdgeWaypointsPerSide;
    for (let k = 1; k <= nSide; k++) {
      const fx = Math.round((k / (nSide + 1)) * (this.cols - 1));
      const fy = Math.round((k / (nSide + 1)) * (this.rows - 1));
      this.waypoints.push(0 * this.cols + fx);                     // top
      this.waypoints.push((this.rows - 1) * this.cols + fx);       // bottom
      this.waypoints.push(fy * this.cols + 0);                     // left
      this.waypoints.push(fy * this.cols + (this.cols - 1));       // right
    }
    for (let k = 0; k < PARAMETERS.nInteriorWaypoints; k++) this.waypoints.push(this._randomLandCell(true));
  }

  // a random non-water cell; if `inland`, also keep clear of the pond and the borders
  _randomLandCell(inland) {
    for (let tries = 0; tries < 400; tries++) {
      const x = randomInt(this.cols), y = randomInt(this.rows);
      const i = y * this.cols + x;
      if (this.isWater[i]) continue;
      if (inland) {
        const dx = x + 0.5 - this.pondCX, dy = y + 0.5 - this.pondCY;
        if (dx * dx + dy * dy < (this.pondRadiusCells + 3) * (this.pondRadiusCells + 3)) continue;
        if (x < 2 || y < 2 || x >= this.cols - 2 || y >= this.rows - 2) continue;
      }
      return i;
    }
    return this.pondCenterCell; // fallback (should never trigger with sane params)
  }

  // --- grid access ---
  cellOf(x, y) {
    let cx = Math.floor(x / this.cw), cy = Math.floor(y / this.ch);
    if (cx < 0) cx = 0; else if (cx >= this.cols) cx = this.cols - 1;
    if (cy < 0) cy = 0; else if (cy >= this.rows) cy = this.rows - 1;
    return cy * this.cols + cx;
  }

  update(engine) {
    this._grow();
    // 1. each animal resolves arrival / thirst and settles on a goal for this tick
    for (const a of this.agents) a.chooseGoal(this);
    // 2. collect the distinct (goal, bucket) fields anyone needs right now
    const needed = new Map();
    for (const a of this.agents) {
      const k = a.goalId + '|' + a.bucket;
      if (!needed.has(k)) needed.set(k, { sources: a.goalSources, bucket: a.bucket });
    }
    // 3. (re)build the shared goal fields
    this.fieldManager.update(needed);
    // 4. move everyone down their field, trampling as they go
    for (const a of this.agents) a.move(this);
  }

  _grow() {
    const th = this.thickness, water = this.isWater, P = PARAMETERS, r = P.growthRate, m = P.growthModel;
    for (let i = 0; i < th.length; i++) {
      if (water[i]) continue;
      let t = th[i];
      if (m === 'linear') t += r;
      else if (m === 'logistic') t += r * Math.max(t, P.seedFloor) * (1 - t);
      else t += r * (1 - t);                       // saturating (default)
      th[i] = t > 1 ? 1 : (t < 0 ? 0 : t);
    }
  }

  // --- metrics (over land cells only; the pond is not brush) ---
  meanThickness() {
    const th = this.thickness, water = this.isWater; let s = 0, n = 0;
    for (let i = 0; i < th.length; i++) if (!water[i]) { s += th[i]; n++; }
    return n ? s / n : 0;
  }

  clearedFraction() {
    const th = this.thickness, water = this.isWater, thr = PARAMETERS.clearThreshold; let c = 0, n = 0;
    for (let i = 0; i < th.length; i++) if (!water[i]) { n++; if (th[i] < thr) c++; }
    return n ? c / n : 0;
  }

  // spatial coefficient of variation of land thickness: ~0 when brush is uniform, rises as
  // trails (thin ribbons through thick brush) emerge. The signature of trail structure.
  thicknessCV() {
    const th = this.thickness, water = this.isWater; let s = 0, n = 0;
    for (let i = 0; i < th.length; i++) if (!water[i]) { s += th[i]; n++; }
    if (!n) return 0;
    const mean = s / n;
    if (mean <= 1e-9) return 0;
    let v = 0;
    for (let i = 0; i < th.length; i++) if (!water[i]) { const d = th[i] - mean; v += d * d; }
    return Math.sqrt(v / n) / mean;
  }
};
