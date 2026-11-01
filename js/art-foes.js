// Inimigos, projéteis e obstáculos de cada época.

import { createSprite, poly, circ, ell, rrect, line, glow, neonPoly, neonLine } from './draw.js';
import { rocket, missile } from './sprites.js';
import { junk } from './art-decor.js';

const CYAN = '#00e5ff';
const PINK = '#ff3fd2';

// ---------------------------------------------------------------- Céu antigo

function zeppelin() {
  return createSprite(204, 86, 102, 40, (g) => {
    poly(g, [[170, 20], [196, 4], [200, 26]], '#8a9098');
    poly(g, [[170, 46], [196, 64], [200, 40]], '#8a9098');
    const grd = g.createLinearGradient(0, 6, 0, 60);
    grd.addColorStop(0, '#e0e3e7');
    grd.addColorStop(0.6, '#b4b9c0');
    grd.addColorStop(1, '#8c929a');
    ell(g, 100, 34, 92, 27, grd);
    g.save();
    g.beginPath();
    g.ellipse(100, 34, 92, 27, 0, 0, Math.PI * 2);
    g.clip();
    for (const x of [40, 70, 100, 130, 160]) {
      g.strokeStyle = 'rgba(90,96,104,0.35)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.ellipse(x, 34, 8, 30, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
    line(g, 90, 58, 88, 66, '#5a4a30', 1.5);
    line(g, 114, 58, 116, 66, '#5a4a30', 1.5);
    rrect(g, 80, 64, 44, 14, 4, '#6b5a40');
    for (let x = 86; x < 120; x += 9) rrect(g, x, 67, 5, 5, 1, '#e8d79a');
  });
}

function fighter() {
  return createSprite(132, 52, 66, 26, (g) => {
    poly(g, [[106, 22], [118, 4], [128, 6], [126, 24]], '#4f5a30');
    const body = new Path2D();
    body.moveTo(10, 22);
    body.quadraticCurveTo(16, 14, 40, 15);
    body.lineTo(110, 19);
    body.lineTo(128, 22);
    body.lineTo(128, 28);
    body.lineTo(110, 31);
    body.lineTo(40, 35);
    body.quadraticCurveTo(14, 35, 10, 28);
    body.closePath();
    g.fillStyle = '#5f6b3a';
    g.fill(body);
    g.save();
    g.clip(body);
    g.fillStyle = '#4a5530';
    g.fillRect(0, 27, 140, 20);
    g.fillStyle = '#d8c23a';
    g.fillRect(92, 0, 6, 40);
    g.restore();
    rrect(g, 108, 25, 24, 5, 2.5, '#4a5530');
    ell(g, 66, 30, 36, 6, '#4f5a30');
    ell(g, 54, 15, 13, 6, '#9fc6d6');
    line(g, 54, 9, 54, 21, '#3a4426', 1.2);
    ell(g, 9, 25, 6, 7, '#3a3a3a');
  });
}

function sandbag() {
  return createSprite(22, 26, 11, 14, (g) => {
    ell(g, 11, 16, 9, 9, '#c8a46a');
    ell(g, 13, 18, 5, 5, '#a8844e');
    poly(g, [[7, 8], [15, 8], [13, 3], [9, 3]], '#b8945a');
    line(g, 7, 8, 15, 8, '#7a5a30', 1.5);
  });
}

function barricade() {
  return createSprite(60, 36, 30, 34, (g) => {
    const bag = (x, y) => {
      ell(g, x, y, 11, 6, '#c8a46a');
      ell(g, x + 2, y + 2, 7, 3, '#a8844e');
    };
    for (const x of [10, 30, 50]) bag(x, 29);
    for (const x of [20, 40]) bag(x, 19);
    bag(30, 9);
  });
}

// ---------------------------------------------------------------- Anos 1970

function ufo() {
  return createSprite(124, 62, 62, 34, (g) => {
    glow(g, 'rgba(120,255,160,0.9)', 14, () => ell(g, 62, 46, 20, 5, '#7affa8'));
    const disc = g.createLinearGradient(0, 22, 0, 48);
    disc.addColorStop(0, '#e2e7ec');
    disc.addColorStop(1, '#7a848c');
    g.save();
    g.globalAlpha = 0.9;
    const dome = g.createLinearGradient(0, 4, 0, 30);
    dome.addColorStop(0, '#d8fff4');
    dome.addColorStop(1, '#7ad0bc');
    g.beginPath();
    g.ellipse(62, 28, 24, 22, 0, Math.PI, Math.PI * 2);
    g.fillStyle = dome;
    g.fill();
    g.restore();
    ell(g, 54, 16, 6, 4, 'rgba(255,255,255,0.7)');
    ell(g, 62, 34, 58, 13, disc);
    ell(g, 62, 38, 58, 5, '#5a646c');
  });
}

function plasma(color) {
  return createSprite(30, 30, 15, 15, (g) => {
    const grd = g.createRadialGradient(15, 15, 1, 15, 15, 14);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.35, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    circ(g, 15, 15, 14, grd);
  });
}

// ---------------------------------------------------------------- Anos 2020

function helicopter() {
  return createSprite(162, 72, 80, 40, (g) => {
    poly(g, [[88, 34], [150, 31], [150, 38], [88, 47]], '#3b4650');
    poly(g, [[143, 18], [152, 18], [155, 40], [146, 40]], '#2e3840');
    ell(g, 60, 42, 40, 21, '#3b4650');
    g.save();
    g.beginPath();
    g.ellipse(60, 42, 40, 21, 0, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = '#2e3840';
    g.fillRect(0, 48, 120, 20);
    g.restore();
    poly(g, [[24, 34], [46, 26], [52, 42], [26, 47]], '#8fc8e0');
    poly(g, [[28, 36], [38, 31], [36, 37]], 'rgba(255,255,255,0.5)');
    rrect(g, 56, 16, 10, 8, 2, '#2e3840');
    line(g, 44, 60, 44, 68, '#2a2f34', 2.5);
    line(g, 78, 60, 78, 68, '#2a2f34', 2.5);
    line(g, 30, 68, 92, 68, '#2a2f34', 3);
    circ(g, 96, 44, 2.5, '#ff4a3a');
  });
}

function drone(k) {
  return createSprite(74, 38, 37, 19, (g) => {
    const arm = k.arm;
    rrect(g, 6, 12, 62, 4, 2, arm);
    rrect(g, 4, 8, 10, 4, 1, arm);
    rrect(g, 60, 8, 10, 4, 1, arm);
    const draw = () => rrect(g, 22, 10, 30, 16, 6, k.body);
    if (k.glow) glow(g, k.glow, 10, draw);
    else draw();
    if (k.edge) neonPoly(g, [[24, 10], [50, 10], [52, 26], [22, 26]], k.edge, 1.5, 8);
    if (k.patch) {
      rrect(g, 26, 13, 8, 6, 1, k.patch);
      line(g, 40, 12, 46, 20, '#3a2a1a', 1);
    }
    circ(g, 37, 28, 6, '#1e1e22');
    glow(g, k.eye, 10, () => circ(g, 37, 28, 2.6, k.eye));
    rrect(g, 30, 32, 14, 3, 1, arm);
  });
}

function roadblock() {
  return createSprite(66, 40, 33, 38, (g) => {
    line(g, 12, 38, 16, 12, '#4a4a4a', 3);
    line(g, 54, 38, 50, 12, '#4a4a4a', 3);
    for (const [y, h, x, w] of [[10, 12, 4, 58], [24, 9, 8, 50]]) {
      g.save();
      g.beginPath();
      g.rect(x, y, w, h);
      g.clip();
      g.fillStyle = '#f4f4f2';
      g.fillRect(x, y, w, h);
      g.fillStyle = '#f06a1a';
      for (let sx = x - 20; sx < x + w + 20; sx += 14) poly(g, [[sx, y + h], [sx + 7, y + h], [sx + 7 + h, y], [sx + h, y]], '#f06a1a');
      g.restore();
    }
    glow(g, '#ffb22e', 8, () => circ(g, 33, 6, 3.5, '#ffb22e'));
  });
}

// ---------------------------------------------------------------- Anos 2070

function hovercar() {
  return createSprite(136, 50, 68, 25, (g) => {
    neonLine(g, 14, 38, 122, 38, PINK, 3, 14);
    poly(g, [[8, 30], [26, 18], [62, 13], [106, 15], [128, 24], [126, 34], [12, 36]], '#1a1030');
    poly(g, [[126, 34], [128, 24], [106, 15], [96, 15], [110, 34]], '#24163e');
    glow(g, CYAN, 10, () => poly(g, [[32, 19], [60, 15], [86, 16], [82, 24], [36, 25]], '#33e1ff'));
    glow(g, '#ff2a4a', 8, () => rrect(g, 122, 24, 5, 6, 1, '#ff2a4a'));
    glow(g, '#fff2b0', 8, () => rrect(g, 8, 28, 6, 4, 1, '#fff2b0'));
  });
}

function neonBarrier() {
  return createSprite(62, 44, 31, 42, (g) => {
    g.fillStyle = 'rgba(255,63,210,0.28)';
    g.fillRect(10, 8, 42, 32);
    for (const y of [12, 20, 28, 36]) neonLine(g, 10, y, 52, y, PINK, 1.6, 8);
    for (const x of [2, 52]) {
      rrect(g, x, 6, 8, 38, 2, '#1a1030');
      glow(g, PINK, 10, () => rrect(g, x, 2, 8, 5, 1.5, '#ff8ae6'));
    }
  });
}

// ---------------------------------------------------------------- Era digital

function sentinel() {
  return createSprite(176, 104, 88, 50, (g) => {
    const pts = [[12, 30], [42, 10], [134, 10], [164, 30], [152, 62], [124, 50], [112, 92], [94, 70], [82, 70], [64, 92], [52, 50], [24, 62]];
    poly(g, pts, '#03070e');
    neonPoly(g, pts, CYAN, 2.4, 12);
    neonLine(g, 58, 30, 118, 30, '#ff9a1f', 3, 12);
    neonLine(g, 70, 40, 106, 40, 'rgba(0,229,255,0.6)', 1.4, 6);
  });
}

function disc() {
  return createSprite(40, 20, 20, 10, (g) => {
    ell(g, 20, 10, 15, 5, '#02060c');
    glow(g, CYAN, 10, () => {
      g.strokeStyle = CYAN;
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(20, 10, 15, 5, 0, 0, Math.PI * 2);
      g.stroke();
    });
    ell(g, 20, 10, 4, 1.6, '#dffcff');
  });
}

function lightJet() {
  return createSprite(124, 44, 62, 22, (g) => {
    const pts = [[4, 22], [50, 9], [118, 7], [102, 22], [118, 37], [50, 35]];
    poly(g, pts, '#03070e');
    neonPoly(g, pts, CYAN, 2.2, 10);
    neonLine(g, 40, 22, 100, 22, '#ff9a1f', 2.5, 10);
  });
}

function energyWall() {
  return createSprite(48, 44, 24, 42, (g) => {
    g.fillStyle = 'rgba(0,229,255,0.16)';
    g.fillRect(5, 4, 38, 38);
    for (let x = 12; x < 42; x += 8) neonLine(g, x, 6, x, 40, 'rgba(0,229,255,0.55)', 1, 4);
    for (let y = 12; y < 40; y += 8) neonLine(g, 6, y, 42, y, 'rgba(0,229,255,0.55)', 1, 4);
    neonPoly(g, [[5, 42], [5, 4], [43, 4], [43, 42]], CYAN, 2.4, 12, false);
  });
}

// ---------------------------------------------------------------- Fim dos tempos

function barrel() {
  return createSprite(32, 32, 16, 16, (g) => {
    circ(g, 16, 16, 14, '#5a2e12');
    circ(g, 16, 16, 11.5, '#8a4a22');
    g.save();
    g.beginPath();
    g.arc(16, 16, 11.5, 0, Math.PI * 2);
    g.clip();
    for (const o of [-6, 6]) poly(g, [[16 + o - 3, 0], [16 + o + 3, 0], [16 + o + 3 - 10, 32], [16 + o - 3 - 10, 32]], '#d8b02a');
    g.restore();
    circ(g, 16, 16, 3, '#3a1e0c');
  });
}

function debris() {
  return createSprite(40, 40, 20, 20, (g) => {
    const pts = [[6, 16], [14, 5], [26, 6], [35, 15], [33, 28], [22, 35], [9, 30]];
    poly(g, pts, '#5a4a3a');
    poly(g, [[14, 5], [26, 6], [24, 16], [12, 15]], '#7a6a58');
    glow(g, '#ff7a2a', 8, () => {
      line(g, 12, 22, 20, 18, '#ff8a3a', 1.6);
      line(g, 20, 18, 27, 25, '#ff8a3a', 1.6);
    });
  });
}

// ---------------------------------------------------------------- Banco

export function buildFoes(rng, S) {
  return {
    balloon: S.balloon,
    biplane: S.plane,
    rocket: S.rocket,
    missile: S.missile,
    bomb: S.bomb,
    zeppelin: zeppelin(),
    fighter: fighter(),
    sandbag: sandbag(),
    barricade: barricade(),
    ufo: ufo(),
    plasmaGreen: plasma('#5aff8a'),
    plasmaPink: plasma(PINK),
    plasmaCyan: plasma(CYAN),
    helicopter: helicopter(),
    drone: drone({ body: '#e8ecef', arm: '#9aa3aa', eye: '#d6322b' }),
    neonDrone: drone({ body: '#1a1030', arm: '#3a2a5a', eye: PINK, glow: PINK }),
    tronDrone: drone({ body: '#03070e', arm: '#0a1828', eye: CYAN, edge: CYAN }),
    scavenger: drone({ body: '#7a5a3a', arm: '#4a3a2a', eye: '#ff7a2a', patch: '#5a3a22' }),
    roadblock: roadblock(),
    hovercar: hovercar(),
    neonMissile: missile({ fin: '#33e1ff', body: '#2a1a40', light: '#4a2a70', band: PINK, nose: PINK, tip: '#ffffff', glow: PINK }),
    neonBarrier: neonBarrier(),
    sentinel: sentinel(),
    disc: disc(),
    lightJet: lightJet(),
    energyWall: energyWall(),
    trash: junk(rng, true),
    barrel: barrel(),
    debris: debris(),
    rustRocket: rocket({
      body: '#b8a48a',
      shade: '#9a8870',
      red: '#7a3a1a',
      redDark: '#5a2a12',
      rim: '#5a5048',
      glass: '#4a6a6a',
      nozzle: '#3a3632',
      rust: 'rgba(110,50,20,0.55)',
    }),
  };
}
