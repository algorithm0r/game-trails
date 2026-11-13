'use strict';
// Samples the world's metrics every reportingPeriod ticks, keeps one array per metric for the
// live charts (ui.js wires them by reference; DOM-free here), and ships
// a self-describing packet (full PARAMETERS + samples) to the DB at epoch. The packet()
// helper (db.js) embeds PARAMETERS verbatim so every run reconstructs from its own record.
//
// NOTE: in the browser this auto-flushes at epoch (fire-and-forget, errors logged). The
// headless runner (runner.mjs) drives ticks and flushes explicitly so it can await the write.
var DataManager = class DataManager {
  constructor(world, db) {
    this.world = world;
    this.db = db;
    this.samples = [];
    this.series = { mean: [], cleared: [], cv: [] };   // parallel to samples, for the charts
    this.run = (PARAMETERS.db && PARAMETERS.db.run) || 'run';
    this.flushed = false;
  }

  update(engine) {
    if (engine.tick % PARAMETERS.reportingPeriod === 0) {
      const s = {
        tick: engine.tick,
        meanThickness: this.world.meanThickness(),
        clearedFraction: this.world.clearedFraction(),
        thicknessCV: this.world.thicknessCV(),
      };
      this.samples.push(s);
      this.series.mean.push(s.meanThickness);
      this.series.cleared.push(s.clearedFraction);
      this.series.cv.push(s.thicknessCV);
    }
    if (!this.flushed && engine.tick >= PARAMETERS.epoch) {
      this.flushed = true;
      this.flush();
    }
  }

  async flush() {
    if (!this.db) return { ok: false };
    const pkt = this.db.packet(PARAMETERS, {
      run: this.run, samples: this.samples,
      finalMeanThickness: this.world.meanThickness(),
      finalClearedFraction: this.world.clearedFraction(),
      finalThicknessCV: this.world.thicknessCV(),
    });
    try {
      const res = await this.db.insert(this.run, pkt);
      if (typeof console !== 'undefined') console.log('[data] saved', JSON.stringify(res));
      return res;
    } catch (e) {
      if (typeof console !== 'undefined') console.error('[data] save failed:', e.message);
      return { ok: false, error: e.message };
    }
  }

  draw() {}
};
