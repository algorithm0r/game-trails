'use strict';
// One game animal. Holds state only; it does not draw itself (the Observer renders). Body
// `size` sets three coupled things — mobility (fast in the open, but drag ~ thickness/size, so
// big animals barely notice brush that mires small ones), routing (via its size-bucket's goal
// field), and clearing (it knocks brush down only where capacityCoef*size exceeds the local
// thickness — so big game cuts through and clears thick brush, small game only maintains thin
// trails). Movement is gradient descent on the current goal field: no committed route, every
// step re-picks the cheapest neighbour against brush as it stands right now.
var Agent = class Agent {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.thirst = randomInt(PARAMETERS.thirstThreshold);  // stagger so they don't all drink at once
    const n = Math.max(1, PARAMETERS.sizeBuckets | 0);
    this.bucket = clamp(Math.floor((size - PARAMETERS.sizeMin) /
      Math.max(1e-6, PARAMETERS.sizeMax - PARAMETERS.sizeMin) * n), 0, n - 1);
    this.routeSize = PARAMETERS.sizeMin + ((this.bucket + 0.5) / n) * (PARAMETERS.sizeMax - PARAMETERS.sizeMin);
    // goal state set by pickWaypoint/setPond
    this.goalId = 'W0';
    this.goalCell = -1;
    this.goalSources = [];
  }

  pickWaypoint(world) {
    const idx = randomInt(world.waypoints.length);
    this.goalId = 'W' + idx;
    this.goalCell = world.waypoints[idx];
    this.goalSources = [this.goalCell];
  }

  setPond(world) {
    this.goalId = 'P';                    // multi-source field over all banks -> routes to nearest
    this.goalCell = -1;
    this.goalSources = world.bankCells;
  }

  // resolve arrival and thirst, settle on this tick's goal
  chooseGoal(world) {
    this.thirst++;
    const cell = world.cellOf(this.x, this.y);
    if (this.goalId === 'P') {
      if (world.isBank[cell]) { this.thirst = 0; this.pickWaypoint(world); }  // drank -> forage on
    } else {
      if (this.thirst >= PARAMETERS.thirstThreshold) this.setPond(world);     // must drink now
      else if (cell === this.goalCell) this.pickWaypoint(world);              // reached -> next waypoint
    }
  }

  move(world) {
    const P = PARAMETERS, cols = world.cols, rows = world.rows;
    const cur = world.cellOf(this.x, this.y);
    const thHere = world.thickness[cur];
    const field = world.fieldManager.field(this.goalId, this.bucket);

    // pick the neighbour that minimises (cost to enter it) + (its cost-to-goal)
    let best = -1, bestScore = Infinity;
    if (field) {
      const cx = cur % cols, cy = (cur / cols) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const nc = ny * cols + nx;
          if (world.isWater[nc]) continue;
          const fv = field[nc];
          if (!isFinite(fv)) continue;
          // local step cost on the SAME integer scale the field was built with (pathfield.js)
          const base = Math.round((1 + P.dragCoef * world.thickness[nc] / this.routeSize) * FIELD_COST_SCALE);
          const sc = ((dx && dy) ? Math.round(base * Math.SQRT2) : base) + fv;
          if (sc < bestScore) { bestScore = sc; best = nc; }
        }
      }
    }

    // target: chosen neighbour's centre, or (fallback) straight at the goal
    let tx, ty;
    if (best >= 0) {
      tx = (best % cols + 0.5) * world.cw; ty = ((best / cols | 0) + 0.5) * world.ch;
    } else {
      const g = this.goalId === 'P' ? world.pondCenterCell : this.goalCell;
      tx = (g % cols + 0.5) * world.cw; ty = ((g / cols | 0) + 0.5) * world.ch;
    }

    // move: fast in the open, dragged by thickness (less so the bigger the animal)
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
    const mobility = 1 / (1 + P.dragCoef * thHere / this.size);
    const stepDist = Math.min(P.baseSpeed * this.size * mobility, d);
    const nx = this.x + (dx / d) * stepDist, ny = this.y + (dy / d) * stepDist;
    if (!world.isWater[world.cellOf(nx, ny)]) {        // never wade into the pond
      this.x = clamp(nx, 0, world.width - 0.001);
      this.y = clamp(ny, 0, world.height - 0.001);
    }

    // clearing: knock the brush down here if this animal is big enough to push through it
    const c2 = world.cellOf(this.x, this.y);
    if (!world.isWater[c2]) {
      const t = world.thickness[c2];
      if (P.capacityCoef * this.size > t) world.thickness[c2] = t - P.clearPct * t;
    }
  }
};
