'use strict';
// The view. Reads world state and draws it; never mutates the model. Paints the brush grid
// (bare ground -> dense green with thickness) so cleared trails read as pale ribbons through
// dark green, the pond as water, the waypoints as rings, then the game on top (radius and
// tint by body size). Keeping all rendering here is what makes the world headless-safe.
//
// Colours come in from ui.js, resolved from Claude Basic's tokens (a canvas can't read
// var()), and are swapped on a theme change. `c` = { brushLut (256×RGBA, thickness 0..1),
// water, ring, edge, sizeLut (256×RGBA, small..large body) }.
var Observer = class Observer {
  constructor(world, colors) {
    this.world = world;
    this.c = colors;
    this.buf = null;      // one pixel per grid cell, scaled up in a single drawImage
  }

  update() {}

  draw(ctx) {
    const w = this.world, c = this.c, th = w.thickness, water = w.isWater, cols = w.cols, rows = w.rows;
    const cw = w.cw, ch = w.ch;

    // terrain: one pixel per cell into a small buffer, then stretched onto the canvas with
    // smoothing on, so trails read as soft ribbons rather than stair-stepped cells
    if (!this.buf || this.buf.width !== cols || this.buf.height !== rows) {
      this.buf = new OffscreenCanvas(cols, rows);
      this.bctx = this.buf.getContext('2d');
      this.img = this.bctx.createImageData(cols, rows);
    }
    const px = this.img.data, lut = c.brushLut, wc = c.water;
    for (let i = 0; i < th.length; i++) {
      const o = i * 4;
      if (water[i]) { px[o] = wc[0]; px[o + 1] = wc[1]; px[o + 2] = wc[2]; }
      else { const k = Math.round(th[i] * 255) * 4; px[o] = lut[k]; px[o + 1] = lut[k + 1]; px[o + 2] = lut[k + 2]; }
      px[o + 3] = 255;
    }
    this.bctx.putImageData(this.img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.buf, 0, 0, cols * cw, rows * ch);
    ctx.restore();

    // waypoints: the inland and edge destinations (drinking spots are the pond's banks)
    ctx.strokeStyle = c.ring; ctx.lineWidth = 2;
    for (const cell of w.waypoints) {
      const x = (cell % cols + 0.5) * cw, y = ((cell / cols | 0) + 0.5) * ch;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.stroke();
    }

    // the game: radius grows with size, tint runs small -> large along the size ramp;
    // a thin dark edge keeps every animal readable against pale trail and dark brush alike
    const span = Math.max(0.001, PARAMETERS.sizeMax - PARAMETERS.sizeMin), sl = c.sizeLut;
    ctx.lineWidth = 1; ctx.strokeStyle = c.edge;
    for (const a of w.agents) {
      const k = Math.round(clamp((a.size - PARAMETERS.sizeMin) / span, 0, 1) * 255) * 4;
      ctx.fillStyle = 'rgb(' + sl[k] + ',' + sl[k + 1] + ',' + sl[k + 2] + ')';
      ctx.beginPath();
      ctx.arc(a.x, a.y, 2 + 1.4 * a.size, 0, TAU);
      ctx.fill(); ctx.stroke();
    }
  }
};
