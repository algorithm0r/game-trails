'use strict';
// ALL DOM lives here (and in index.html). The sim classes never touch the document, which
// is what keeps them headless. Builds the control strips from PARAM_SCHEMA, resolves the
// world's colours from Claude Basic's tokens, keys the legend to those same colours, and
// wires each chart once to the datamanager's arrays.
var $ = (id) => document.getElementById(id);

// The world's colours, as token expressions. The legend shows these strings directly; the
// canvas gets them resolved to rgb (worldColors). One table, so the key can't drift from
// the picture, and a theme change moves both.
var WORLD_TOKENS = {
  bare: 'color-mix(in srgb, var(--cb-warn) 45%, var(--cb-text))',         // trail: pale ground
  mid: 'var(--cb-ok-dim)',                                                // thinned brush
  dense: 'color-mix(in srgb, var(--cb-ok-dim) 55%, var(--cb-sunken))',    // thick brush
  water: 'color-mix(in srgb, var(--cb-info) 55%, var(--cb-sunken))',
  ring: 'var(--cb-text)',
  edge: 'var(--cb-sunken)',
  small: 'var(--cb-gold)',
  large: 'var(--cb-bad)',
};

// The world canvas can't read CSS variables, so resolve the tokens it uses to colours.
function worldColors() {
  let c;
  CB.sim.palette(document.body, (res) => {
    const T = WORLD_TOKENS;
    c = {
      brushLut: CB.sim.lut([res(T.bare).rgb, res(T.mid).rgb, res(T.dense).rgb]),
      sizeLut: CB.sim.lut([res(T.small).rgb, res(T.large).rgb]),
      water: res(T.water).rgb,
      ring: res(T.ring).css,
      edge: res(T.edge).css,
    };
  });
  return c;
}

function buildLegend() {
  const T = WORLD_TOKENS;
  $('legend').data = [
    { label: 'dense brush', mark: 'swatch', color: T.dense },
    { label: 'thinned', mark: 'swatch', color: T.mid },
    { label: 'trail', mark: 'swatch', color: T.bare },
    { label: 'pond', mark: 'swatch', color: T.water },
    { label: 'destination', mark: 'ring', color: T.ring },
    { label: 'small animal', mark: 'dot', color: T.small },
    { label: 'large animal', mark: 'dot', color: T.large },
  ];
}

function buildControls() {
  const basic = PARAM_SCHEMA.filter((s) => !s.advanced);
  const more = PARAM_SCHEMA.filter((s) => s.advanced);
  CB.sim.controls($('controls'), basic, PARAMETERS, {
    onReset: reset,
    buttons: [
      { label: 'Pause', onClick: (e) => { togglePause(); e.target.textContent = paused ? 'Run' : 'Pause'; } },
      { label: 'Reset', primary: true, onClick: reset },
    ],
  });
  // the fold gets no buttons of its own: the ones above serve both strips
  CB.sim.controls($('moreControls'), more, PARAMETERS, { onReset: reset, buttons: [] });
}

// Each chart's one line carries its latest value in the legend ("now 0.842").
var LIVE_CHARTS = { brush: 'mean', cleared: 'cleared', cv: 'cv' };

function wireCharts(dm) {
  const dx = PARAMETERS.reportingPeriod;   // chart x is ticks
  $('brush').data = { dx: dx, series: [{ name: 'mean', values: dm.series.mean, color: 'var(--cb-ok)' }] };
  $('cleared').data = { dx: dx, series: [{ name: 'cleared', values: dm.series.cleared, color: 'var(--cb-warn)' }] };
  $('cv').data = { dx: dx, series: [{ name: 'CV', values: dm.series.cv, color: 'var(--cb-series-1)' }] };
  refreshLegends();
}

function refreshLegends() {
  for (const id in LIVE_CHARTS) {
    const el = $(id), d = el.data;
    for (const s of d.series) {
      const v = s.values.length ? s.values[s.values.length - 1] : null;
      s.label = v == null ? s.name + ' —' : s.name + ' ' + v.toFixed(3);
    }
    el.data = d;   // re-renders the head
  }
}

// browser-only entity: keeps the dial and the legends' latest values current
var UiPump = class UiPump {
  constructor(engine, dm) { this.engine = engine; this.dm = dm; this.seen = -1; }
  update() {}
  draw() {
    $('clock').value = this.engine.tick;
    if (this.dm.series.mean.length !== this.seen) { this.seen = this.dm.series.mean.length; refreshLegends(); }
  }
};

// a theme change re-resolves the world's colours (the kit's charts do their own)
document.addEventListener('cb-theme', () => { if (observer) observer.c = worldColors(); });
