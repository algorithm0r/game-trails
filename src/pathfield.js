'use strict';
// Goal-field ("Dijkstra map") pathfinding. For each active (goal, size-bucket) pair we flood a
// cost-to-goal field over the land cells: a Dijkstra outward from the goal cell(s), where the
// cost to enter a cell is `1 + dragCoef * thickness / size`. Agents then gradient-descend the
// field every step (see agent.js) — so routing continuously adapts to brush that changes and
// gets cleared under them, while the expensive search is computed once per (goal,bucket) and
// SHARED by every animal heading there in that size class.
//
// The `/size` is the whole trick: small animals see thick brush as hugely expensive and route
// around it on existing trails; big animals see it as cheap and cut straight through (and clear
// it). Pioneers vs. followers, straight out of the edge weights.
//
// Naive by request: rebuilt from scratch each tick. PARAMETERS.fieldsPerTick caps how many
// fields rebuild per tick (round-robin time-slice); 0 = rebuild all, every tick.

// Costs are quantized to integers at this scale before the search. Integer costs make ties
// EXACT, so Dijkstra settles each node once and the heap can't thrash — a double cost stored
// into a Float32 dist array (as an earlier version did) rounds differently than the double it
// is compared against, which in large near-uniform-cost regions prevents convergence and blows
// the heap up without bound. agent.js uses this same scale for its local step cost.
var FIELD_COST_SCALE = 256;

// Binary min-heap over (cost, node) with parallel arrays.
var MinHeap = class MinHeap {
  constructor() { this.c = []; this.n = []; this.size = 0; }
  push(cost, node) {
    let i = this.size++;
    this.c[i] = cost; this.n[i] = node;
    while (i > 0) { const p = (i - 1) >> 1; if (this.c[p] <= this.c[i]) break; this._swap(i, p); i = p; }
  }
  pop() {
    const cost = this.c[0], node = this.n[0];
    this.size--;
    if (this.size > 0) { this.c[0] = this.c[this.size]; this.n[0] = this.n[this.size]; this._down(0); }
    return [cost, node];
  }
  _down(i) {
    for (;;) {
      let l = 2 * i + 1, r = l + 1, m = i;
      if (l < this.size && this.c[l] < this.c[m]) m = l;
      if (r < this.size && this.c[r] < this.c[m]) m = r;
      if (m === i) break;
      this._swap(i, m); i = m;
    }
  }
  _swap(a, b) {
    const tc = this.c[a]; this.c[a] = this.c[b]; this.c[b] = tc;
    const tn = this.n[a]; this.n[a] = this.n[b]; this.n[b] = tn;
  }
};

var PathFieldManager = class PathFieldManager {
  constructor(world) {
    this.world = world;
    this.cache = new Map();   // key "goalId|bucket" -> Float32Array cost-to-goal (Infinity = unreachable)
    this.cursor = 0;          // round-robin position for time-slicing
  }

  // representative body size for a bucket index (bucket midpoint of the size range)
  bucketSize(b) {
    const P = PARAMETERS, n = Math.max(1, P.sizeBuckets | 0);
    return P.sizeMin + ((b + 0.5) / n) * (P.sizeMax - P.sizeMin);
  }

  // Dijkstra from `sources` (one goal cell, or every pond-bank cell for a multi-source pond
  // field so each animal is routed to its nearest bank). Entry cost uses the cell being
  // stepped into along the forward path, so descending the field is exact shortest-cost.
  build(sources, size) {
    const w = this.world, cols = w.cols, rows = w.rows, N = cols * rows;
    const th = w.thickness, water = w.isWater;
    const dist = new Float64Array(N); dist.fill(Infinity);   // Float64 + integer costs: exact, converges
    const heap = new MinHeap();
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      if (water[s]) continue;
      dist[s] = 0; heap.push(0, s);
    }
    const drag = PARAMETERS.dragCoef, S = FIELD_COST_SCALE;
    while (heap.size) {
      const popped = heap.pop(); const d = popped[0], u = popped[1];
      if (d > dist[u]) continue;
      const ux = u % cols, uy = (u / cols) | 0;
      const enterU = Math.round((1 + drag * th[u] / size) * S);   // quantized cost to enter cell u
      const enterUdiag = Math.round(enterU * Math.SQRT2);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = ux + dx, ny = uy + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const v = ny * cols + nx;
          if (water[v]) continue;
          const nd = d + ((dx && dy) ? enterUdiag : enterU);
          if (nd < dist[v]) { dist[v] = nd; heap.push(nd, v); }
        }
      }
    }
    return dist;
  }

  // `needed` is a Map "goalId|bucket" -> { sources, bucket }. Rebuild up to the tick budget.
  update(needed) {
    const budget = PARAMETERS.fieldsPerTick | 0;
    for (const k of [...this.cache.keys()]) if (!needed.has(k)) this.cache.delete(k);
    const keys = [...needed.keys()];
    let toBuild;
    if (budget <= 0) {
      toBuild = keys;                                   // rebuild all, every tick
    } else {
      const missing = keys.filter((k) => !this.cache.has(k));
      toBuild = missing.slice(0, budget);               // never let an agent go field-less
      const have = keys.filter((k) => this.cache.has(k));
      for (let i = 0; i < have.length && toBuild.length < budget; i++) {
        toBuild.push(have[(this.cursor + i) % have.length]);
      }
      this.cursor = have.length ? (this.cursor + budget) % have.length : 0;
    }
    for (const k of toBuild) {
      const s = needed.get(k);
      this.cache.set(k, this.build(s.sources, this.bucketSize(s.bucket)));
    }
  }

  field(goalId, bucket) { return this.cache.get(goalId + '|' + bucket); }
};
