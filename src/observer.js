'use strict';
// The view. Reads world state and draws it; never mutates the model. Paints the brush grid
// (bare soil -> lush green with thickness) so cleared trails read as pale ribbons through dark
// green, the pond as water, the waypoints as rings, then the game on top (sized/tinted by body
// size). Keeping all rendering here is what makes the world headless-safe.
var Observer = class Observer {
  constructor(world) { this.world = world; }

  update() {}

  // brush thickness -> colour. 0 = bare packed earth, 1 = dense green.
  brushColor(t) {
    const r = Math.round(107 - 76 * t);
    const g = Math.round(90 + 50 * t);
    const b = Math.round(62 - 28 * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  draw(ctx) {
    const w = this.world, th = w.thickness, water = w.isWater, cols = w.cols, rows = w.rows;
    const cw = w.cw, ch = w.ch;
    // terrain (+1px overdraw kills seams between cells)
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const i = cy * cols + cx;
        ctx.fillStyle = water[i] ? '#2f6d8c' : this.brushColor(th[i]);
        ctx.fillRect(cx * cw, cy * ch, cw + 1, ch + 1);
      }
    }
    // waypoints (drink banks are implicit around the pond; these are the forage points)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
    for (const c of w.waypoints) {
      const x = (c % cols + 0.5) * cw, y = ((c / cols | 0) + 0.5) * ch;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.stroke();
    }
    // the game: small = pale yellow, large = deep red; radius grows with size
    const span = Math.max(0.001, PARAMETERS.sizeMax - PARAMETERS.sizeMin);
    for (const a of w.agents) {
      const f = clamp((a.size - PARAMETERS.sizeMin) / span, 0, 1);
      ctx.fillStyle = 'rgb(' + Math.round(235 - 90 * f) + ',' + Math.round(210 - 150 * f) + ',' + Math.round(90 - 40 * f) + ')';
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.5 + a.size, 0, TAU);
      ctx.fill();
    }
  }
};
