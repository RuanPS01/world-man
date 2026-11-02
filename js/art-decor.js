// Cenários de cada época, desenhados por código.

import { createSprite, cloudSprite, poly, circ, ell, rrect, line, glow, neonPoly, neonLine } from './draw.js';
import { roundTree } from './sprites.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- Anos 1900

function windmill() {
  return createSprite(130, 200, 65, 198, (g) => {
    poly(g, [[44, 200], [86, 200], [76, 82], [54, 82]], '#cdb58a');
    poly(g, [[66, 200], [86, 200], [76, 82], [66, 82]], '#b39a6e');
    poly(g, [[48, 84], [82, 84], [65, 56]], '#7a4a2a');
    rrect(g, 58, 172, 14, 28, 6, '#5a3a20');
    rrect(g, 60, 112, 10, 12, 3, '#3a2a1a');
    g.save();
    g.translate(65, 66);
    for (let i = 0; i < 4; i++) {
      g.save();
      g.rotate(0.35 + (i * TAU) / 4);
      rrect(g, -3, -62, 6, 60, 2, '#6b4a2a');
      g.fillStyle = '#efe4c8';
      g.fillRect(3, -60, 13, 46);
      g.strokeStyle = '#6b4a2a';
      g.lineWidth = 1.2;
      for (let y = -56; y < -14; y += 8) line(g, 3, y, 16, y, '#8a6a4a', 1);
      line(g, 9.5, -60, 9.5, -14, '#8a6a4a', 1);
      g.restore();
    }
    circ(g, 0, 0, 6, '#4a2e18');
    g.restore();
  });
}

function cottage(rng) {
  const wall = rng() > 0.5 ? '#e8d6ae' : '#efe2c4';
  return createSprite(130, 110, 65, 108, (g) => {
    rrect(g, 84, 14, 14, 34, 1, '#8a5a3a');
    rrect(g, 18, 56, 94, 54, 2, wall);
    g.fillStyle = 'rgba(0,0,0,0.08)';
    g.fillRect(65, 56, 47, 54);
    poly(g, [[8, 58], [122, 58], [65, 14]], '#9c4a2c');
    poly(g, [[65, 14], [122, 58], [65, 58]], '#843c22');
    rrect(g, 56, 76, 18, 34, 2, '#6b3f22');
    for (const x of [28, 86]) {
      rrect(g, x, 68, 18, 18, 1, '#9cc3d2');
      line(g, x + 9, 68, x + 9, 86, '#6b4a2a', 2);
      line(g, x, 77, x + 18, 77, '#6b4a2a', 2);
    }
  });
}

function gasLamp() {
  return createSprite(30, 90, 15, 88, (g) => {
    rrect(g, 9, 84, 12, 6, 2, '#2a2a2a');
    g.fillStyle = '#2a2a2a';
    g.fillRect(13, 24, 4, 62);
    poly(g, [[6, 8], [24, 8], [21, 24], [9, 24]], '#2a2a2a');
    poly(g, [[8.5, 10], [21.5, 10], [19.5, 22], [10.5, 22]], '#f6e3a0');
    poly(g, [[4, 9], [26, 9], [15, 1]], '#2a2a2a');
  });
}

// ---------------------------------------------------------------- Anos 1940

function factory(rng) {
  return createSprite(250, 240, 125, 238, (g) => {
    // fumaça
    for (const [x, y, r] of [[52, 22, 16], [66, 12, 12], [104, 34, 14], [118, 22, 11], [186, 28, 15], [200, 16, 10]]) circ(g, x, y, r, 'rgba(160,160,160,0.85)');
    for (const [x, w, top] of [[40, 22, 40], [92, 20, 54], [176, 24, 46]]) {
      g.fillStyle = '#7a3e2a';
      g.fillRect(x, top, w, 160);
      g.fillStyle = '#e6e2da';
      g.fillRect(x, top + 10, w, 6);
      g.fillStyle = '#5a2c1c';
      g.fillRect(x - 2, top - 4, w + 4, 6);
    }
    rrect(g, 10, 140, 230, 100, 2, '#8a4a32');
    for (let i = 0; i < 6; i++) poly(g, [[10 + i * 38, 140], [48 + i * 38, 140], [48 + i * 38, 118]], '#5a3424');
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 8; c++) rrect(g, 22 + c * 27, 158 + r * 34, 16, 22, 1, rng() > 0.3 ? '#c9d6dc' : '#f2e2a0');
    }
  });
}

function barn() {
  return createSprite(150, 120, 75, 118, (g) => {
    rrect(g, 16, 48, 118, 72, 2, '#a33a2a');
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(75, 48, 59, 72);
    poly(g, [[8, 52], [30, 24], [75, 8], [120, 24], [142, 52]], '#5a2a20');
    rrect(g, 56, 72, 38, 48, 1, '#f0ece4');
    rrect(g, 60, 76, 30, 40, 1, '#a33a2a');
    line(g, 60, 76, 90, 116, '#f0ece4', 4);
    line(g, 90, 76, 60, 116, '#f0ece4', 4);
    rrect(g, 66, 30, 18, 14, 1, '#f0ece4');
  });
}

function pole() {
  return createSprite(56, 160, 28, 158, (g) => {
    g.fillStyle = '#6b4a2a';
    g.fillRect(26, 12, 5, 148);
    g.fillRect(6, 22, 45, 5);
    g.fillRect(10, 40, 37, 4);
    for (const x of [9, 20, 37, 48]) circ(g, x, 20, 3, '#9bd3e6');
    for (const x of [13, 44]) circ(g, x, 38, 2.6, '#9bd3e6');
  });
}

function sandbags() {
  return createSprite(80, 40, 40, 38, (g) => {
    const bag = (x, y) => {
      ell(g, x, y, 13, 7, '#c8a46a');
      ell(g, x + 2, y + 2, 9, 4, '#b08c56');
    };
    for (const x of [14, 38, 62]) bag(x, 32);
    for (const x of [26, 50]) bag(x, 22);
    bag(38, 12);
  });
}

// ---------------------------------------------------------------- Anos 1970

function tvTower() {
  return createSprite(100, 300, 50, 298, (g) => {
    const seg = 9;
    for (let i = 0; i < seg; i++) {
      const y0 = 300 - (i * 270) / seg;
      const y1 = 300 - ((i + 1) * 270) / seg;
      const w0 = 38 - i * 3.6;
      const w1 = 38 - (i + 1) * 3.6;
      const col = i % 2 ? '#f2f2f2' : '#d8322b';
      line(g, 50 - w0, y0, 50 - w1, y1, col, 3);
      line(g, 50 + w0, y0, 50 + w1, y1, col, 3);
      line(g, 50 - w0, y0, 50 + w1, y1, col, 1.6);
      line(g, 50 + w0, y0, 50 - w1, y1, col, 1.6);
      line(g, 50 - w1, y1, 50 + w1, y1, col, 1.6);
    }
    line(g, 50, 30, 50, 6, '#d8322b', 3);
    circ(g, 50, 6, 4, '#ff5a3a');
  });
}

function house70(rng) {
  const cols = [
    ['#d8a23a', '#b8862a'],
    ['#3a9a9a', '#2e7e7e'],
    ['#d8643a', '#b85030'],
  ];
  const [wall, shade] = cols[Math.floor(rng() * cols.length)];
  return createSprite(170, 110, 85, 108, (g) => {
    // antena de TV
    line(g, 120, 46, 120, 8, '#4a4a4a', 2);
    for (const y of [10, 18, 26]) line(g, 108, y, 132, y, '#4a4a4a', 1.6);
    rrect(g, 10, 50, 150, 60, 2, wall);
    g.fillStyle = shade;
    g.fillRect(110, 50, 50, 60);
    poly(g, [[0, 52], [170, 52], [150, 36], [20, 36]], '#6b3a20');
    rrect(g, 22, 64, 54, 30, 2, '#5a3a20');
    rrect(g, 26, 68, 46, 22, 1, '#a8d8e6');
    line(g, 49, 68, 49, 90, '#5a3a20', 2);
    rrect(g, 116, 66, 38, 44, 1, '#e8e0c8');
    for (let y = 72; y < 108; y += 7) line(g, 116, y, 154, y, '#c8bea0', 1.2);
    rrect(g, 86, 76, 18, 34, 1, '#7a4a2a');
  });
}

function picket() {
  return createSprite(130, 44, 65, 42, (g) => {
    g.fillStyle = '#f4f2ec';
    g.fillRect(2, 18, 126, 5);
    g.fillRect(2, 32, 126, 5);
    for (let x = 6; x < 128; x += 13) poly(g, [[x, 44], [x, 10], [x + 4, 4], [x + 8, 10], [x + 8, 44]], '#f4f2ec');
  });
}

function streetLamp() {
  return createSprite(60, 130, 18, 128, (g) => {
    g.strokeStyle = '#5a5a5a';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(18, 128);
    g.lineTo(18, 30);
    g.quadraticCurveTo(18, 10, 40, 12);
    g.stroke();
    ell(g, 44, 16, 12, 6, '#5a5a5a');
    ell(g, 44, 19, 9, 3.5, '#f6e3a0');
  });
}

// ---------------------------------------------------------------- Anos 2020

function glassTower(rng) {
  const w = 80 + rng() * 40;
  const h = 220 + rng() * 80;
  return createSprite(w + 10, h + 10, (w + 10) / 2, h + 8, (g) => {
    const x0 = 5;
    const y0 = 8;
    const grd = g.createLinearGradient(x0, 0, x0 + w, 0);
    grd.addColorStop(0, '#6fb9de');
    grd.addColorStop(0.55, '#3f86b8');
    grd.addColorStop(1, '#2a5f8a');
    rrect(g, x0, y0 + 14, w, h - 14, 2, grd);
    rrect(g, x0 + w * 0.2, y0, w * 0.6, 18, 2, '#2f6f9a');
    g.strokeStyle = 'rgba(220,244,255,0.45)';
    g.lineWidth = 1;
    for (let y = y0 + 26; y < y0 + h; y += 12) line(g, x0 + 2, y, x0 + w - 2, y, 'rgba(220,244,255,0.4)', 1);
    for (let x = x0 + 10; x < x0 + w; x += 14) line(g, x, y0 + 16, x, y0 + h, 'rgba(20,50,80,0.25)', 1);
    g.save();
    g.beginPath();
    g.rect(x0, y0 + 14, w, h);
    g.clip();
    poly(g, [[x0 + w * 0.1, y0 + h], [x0 + w * 0.35, y0 + h], [x0 + w * 0.9, y0 + 14], [x0 + w * 0.65, y0 + 14]], 'rgba(255,255,255,0.22)');
    g.restore();
  });
}

function turbine() {
  return createSprite(150, 300, 75, 298, (g) => {
    poly(g, [[70, 300], [80, 300], [77, 92], [73, 92]], '#eef2f5');
    poly(g, [[75, 300], [80, 300], [77, 92], [75, 92]], '#cfd6dc');
    rrect(g, 66, 84, 22, 12, 5, '#e4e9ed');
    g.save();
    g.translate(70, 90);
    for (let i = 0; i < 3; i++) {
      g.save();
      g.rotate(-Math.PI / 2 + 0.3 + (i * TAU) / 3);
      poly(g, [[0, -3], [72, -1], [74, 1.5], [0, 4]], '#f6f8fa');
      line(g, 4, 3, 72, 1.2, '#c6ced6', 1);
      g.restore();
    }
    circ(g, 0, 0, 5, '#d6dde3');
    g.restore();
  });
}

function modernHouse() {
  return createSprite(160, 110, 80, 108, (g) => {
    rrect(g, 10, 50, 100, 60, 1, '#f4f4f2');
    rrect(g, 60, 18, 90, 40, 1, '#e8e8e6');
    g.fillStyle = '#2f3a42';
    g.fillRect(56, 14, 98, 5);
    g.fillRect(6, 46, 108, 5);
    rrect(g, 70, 26, 70, 24, 1, '#9fd6ee');
    rrect(g, 18, 62, 54, 40, 1, '#9fd6ee');
    poly(g, [[22, 102], [36, 62], [46, 62], [32, 102]], 'rgba(255,255,255,0.35)');
    rrect(g, 80, 62, 26, 48, 1, '#c8905a');
    for (let x = 84; x < 106; x += 5) line(g, x, 62, x, 110, '#a87442', 1);
  });
}

function hedge(rng) {
  return createSprite(80, 40, 40, 38, (g) => {
    const cs = [
      [18, 26, 14],
      [38, 20, 18],
      [60, 26, 14],
    ];
    for (const [x, y, r] of cs) circ(g, x, y + rng() * 2, r, '#3d9a2a');
    for (const [x, y, r] of cs) circ(g, x - r * 0.3, y - r * 0.35, r * 0.55, '#5cc03a');
    g.fillStyle = '#3d9a2a';
    g.fillRect(6, 30, 68, 10);
  });
}

function modernLamp() {
  return createSprite(50, 120, 10, 118, (g) => {
    rrect(g, 7, 12, 5, 108, 2, '#5a6670');
    rrect(g, 7, 10, 34, 5, 2, '#5a6670');
    rrect(g, 24, 15, 16, 3, 1, '#eaf6ff');
  });
}

// ---------------------------------------------------------------- Anos 2070 (neon)

function neonTower(rng) {
  const w = 80 + rng() * 50;
  const h = 200 + rng() * 110;
  const c1 = rng() > 0.5 ? '#ff3fd2' : '#33e1ff';
  const c2 = c1 === '#ff3fd2' ? '#33e1ff' : '#ffd23f';
  return createSprite(w + 30, h + 30, (w + 30) / 2, h + 26, (g) => {
    const x0 = 15;
    const y0 = 18;
    poly(g, [[x0, y0 + h + 10], [x0, y0 + 30], [x0 + w * 0.2, y0 + 30], [x0 + w * 0.2, y0 + 10], [x0 + w * 0.7, y0 + 10], [x0 + w * 0.7, y0], [x0 + w, y0], [x0 + w, y0 + h + 10]], '#140b26');
    for (let y = y0 + 40; y < y0 + h; y += 11) {
      for (let x = x0 + 8; x < x0 + w - 8; x += 10) {
        const r = rng();
        if (r > 0.55) rrect(g, x, y, 5, 4, 0.5, r > 0.85 ? '#ffd36b' : r > 0.7 ? '#7ad8ff' : '#ff8ae6');
      }
    }
    neonLine(g, x0 + 2, y0 + 32, x0 + 2, y0 + h + 8, c1, 2.5, 10);
    neonLine(g, x0 + w - 2, y0 + 2, x0 + w - 2, y0 + h + 8, c2, 2.5, 10);
    neonPoly(g, [[x0 + w * 0.3, y0 + 50], [x0 + w * 0.75, y0 + 50], [x0 + w * 0.75, y0 + 74], [x0 + w * 0.3, y0 + 74]], c1, 2, 10);
    neonLine(g, x0 + w * 0.36, y0 + 62, x0 + w * 0.69, y0 + 62, c2, 3, 8);
    circ(g, x0 + w * 0.85, y0 - 4, 3, '#ff4a4a');
  });
}

function neonPalm(rng) {
  const lean = rng() * 30 - 15;
  return createSprite(150, 190, 75, 188, (g) => {
    g.strokeStyle = '#1a1030';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(75, 190);
    g.quadraticCurveTo(75 + lean, 110, 75 + lean * 1.4, 46);
    g.stroke();
    const tx = 75 + lean * 1.4;
    const ty = 46;
    const fronds = [-2.6, -2.0, -1.3, -0.6, 0.1, 0.6];
    for (const [i, a] of fronds.entries()) {
      const col = i % 2 ? '#33e1ff' : '#ff3fd2';
      glow(g, col, 10, () => {
        g.strokeStyle = col;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(tx, ty);
        const ex = tx + Math.cos(a) * 62;
        const ey = ty + Math.sin(a) * 30 + 22;
        g.quadraticCurveTo(tx + Math.cos(a) * 34, ty + Math.sin(a) * 34 - 10, ex, ey);
        g.stroke();
      });
    }
    circ(g, tx, ty + 2, 6, '#2a1848');
  });
}

function billboard(rng) {
  const c = rng() > 0.5 ? '#ff3fd2' : '#33e1ff';
  return createSprite(150, 150, 75, 148, (g) => {
    g.fillStyle = '#1a1030';
    g.fillRect(36, 78, 6, 72);
    g.fillRect(108, 78, 6, 72);
    rrect(g, 12, 10, 126, 72, 4, '#0d0620');
    neonPoly(g, [[14, 12], [136, 12], [136, 80], [14, 80]], c, 3, 12);
    glow(g, '#ffd23f', 10, () => {
      g.strokeStyle = '#ffd23f';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(46, 46, 18, 0, TAU);
      g.stroke();
    });
    for (const [y, w] of [[34, 56], [46, 40], [58, 50]]) neonLine(g, 74, y, 74 + w, y, c === '#ff3fd2' ? '#33e1ff' : '#ff3fd2', 4, 8);
  });
}

function neonLamp() {
  return createSprite(40, 110, 20, 108, (g) => {
    rrect(g, 18, 20, 4, 90, 2, '#1a1030');
    glow(g, '#ff8af0', 16, () => circ(g, 20, 16, 8, '#ffb8f4'));
    circ(g, 20, 16, 4, '#ffffff');
  });
}

// ---------------------------------------------------------------- Era digital (Tron)

const CYAN = '#00e5ff';
const ORANGE = '#ff9a1f';

function tronPyramid(rng) {
  const w = 180 + rng() * 80;
  const h = 130 + rng() * 60;
  return createSprite(w + 30, h + 20, (w + 30) / 2, h + 16, (g) => {
    const x0 = 15;
    const base = h + 16;
    const pts = [[x0, base], [x0 + w / 2, 16], [x0 + w, base]];
    poly(g, pts, '#03070e');
    neonPoly(g, pts, CYAN, 2.5, 12);
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      const y = 16 + (base - 16) * t;
      neonLine(g, x0 + w / 2 - (w / 2) * t, y, x0 + w / 2 + (w / 2) * t, y, 'rgba(0,229,255,0.55)', 1.2, 6);
    }
    neonLine(g, x0 + w / 2, 16, x0 + w / 2, base, 'rgba(0,229,255,0.5)', 1.2, 6);
  });
}

function tronTower(rng) {
  const w = 50 + rng() * 40;
  const h = 170 + rng() * 120;
  return createSprite(w + 30, h + 30, (w + 30) / 2, h + 26, (g) => {
    const x0 = 15;
    const y0 = 16;
    rrect(g, x0, y0, w, h + 10, 2, '#03070e');
    neonPoly(g, [[x0, y0 + h + 10], [x0, y0], [x0 + w, y0], [x0 + w, y0 + h + 10]], CYAN, 2.5, 12, false);
    for (let x = x0 + 10; x < x0 + w - 6; x += 12) neonLine(g, x, y0 + 20, x, y0 + h, 'rgba(0,229,255,0.45)', 1, 4);
    for (let y = y0 + 30; y < y0 + h; y += 40) neonLine(g, x0 + 4, y, x0 + w - 4, y, 'rgba(0,229,255,0.6)', 1.2, 5);
    neonLine(g, x0 + 6, y0 + 8, x0 + w - 6, y0 + 8, ORANGE, 3, 10);
  });
}

function tronSpire(rng) {
  const h = 110 + rng() * 70;
  return createSprite(60, h + 20, 30, h + 16, (g) => {
    const pts = [[14, h + 16], [30, 10], [46, h + 16]];
    poly(g, pts, '#03070e');
    neonPoly(g, pts, rng() > 0.7 ? ORANGE : CYAN, 2.2, 10);
  });
}

function tronPost() {
  return createSprite(30, 60, 15, 58, (g) => {
    rrect(g, 10, 12, 10, 48, 1, '#03070e');
    neonPoly(g, [[10, 60], [10, 12], [20, 12], [20, 60]], 'rgba(0,229,255,0.7)', 1.2, 6, false);
    glow(g, CYAN, 12, () => rrect(g, 8, 6, 14, 6, 2, CYAN));
  });
}

// ---------------------------------------------------------------- Fim dos tempos

function ruin(rng) {
  const w = 100 + rng() * 60;
  const h = 170 + rng() * 110;
  return createSprite(w + 20, h + 20, (w + 20) / 2, h + 16, (g) => {
    const x0 = 10;
    const base = h + 16;
    const top = [];
    const steps = 7;
    for (let i = 0; i <= steps; i++) top.push([x0 + (i / steps) * w, 16 + rng() * h * 0.45]);
    poly(g, [[x0, base], ...top, [x0 + w, base]], '#4a4038');
    g.save();
    poly(g, [[x0, base], ...top, [x0 + w, base]]);
    g.clip();
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(x0 + w * 0.6, 0, w, base);
    for (let y = 40; y < base - 14; y += 22) {
      for (let x = x0 + 8; x < x0 + w - 10; x += 18) {
        const r = rng();
        if (r > 0.25) rrect(g, x, y, 10, 13, 1, r > 0.93 ? '#ff7a2a' : '#1a1410');
      }
    }
    g.restore();
    for (let i = 0; i < 4; i++) {
      const [tx, ty] = top[1 + Math.floor(rng() * (steps - 1))];
      line(g, tx, ty, tx + rng() * 12 - 6, ty - 10 - rng() * 12, '#6a5a4a', 1.5);
    }
  });
}

function brokenStack() {
  return createSprite(150, 240, 55, 238, (g) => {
    for (const [x, y, r, al] of [[70, 44, 20, 0.5], [92, 30, 24, 0.42], [118, 22, 22, 0.32], [60, 58, 14, 0.55]]) {
      circ(g, x, y, r, `rgba(80,70,62,${al})`);
    }
    poly(g, [[38, 240], [72, 240], [67, 74], [62, 64], [57, 72], [52, 60], [47, 70], [43, 66]], '#6a4434');
    poly(g, [[56, 240], [72, 240], [67, 74], [62, 64], [57, 72]], '#55362a');
    for (let y = 90; y < 236; y += 16) line(g, 41 + (240 - y) * 0.01, y, 70 - (240 - y) * 0.01, y, 'rgba(30,18,12,0.35)', 1);
    line(g, 50, 110, 58, 140, '#2a1e16', 1.6);
    line(g, 58, 140, 51, 168, '#2a1e16', 1.6);
    rrect(g, 30, 232, 50, 8, 2, '#3a2e26');
  });
}

function deadTree(rng) {
  return createSprite(140, 170, 70, 168, (g) => {
    g.strokeStyle = '#3a2e26';
    const branch = (x, y, ang, len, wdt, depth) => {
      const ex = x + Math.cos(ang) * len;
      const ey = y + Math.sin(ang) * len;
      g.lineWidth = wdt;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(ex, ey);
      g.stroke();
      if (depth <= 0) return;
      const n = 2 + (rng() > 0.6 ? 1 : 0);
      for (let i = 0; i < n; i++) branch(ex, ey, ang + (rng() - 0.5) * 1.3, len * (0.55 + rng() * 0.2), wdt * 0.62, depth - 1);
    };
    branch(70, 170, -Math.PI / 2 + (rng() - 0.5) * 0.2, 62, 8, 4);
  });
}

function pylon() {
  return createSprite(180, 244, 66, 240, (g) => {
    g.save();
    g.translate(66, 242);
    g.rotate(0.14);
    const c = '#3a3632';
    line(g, -34, 0, -8, -210, c, 4);
    line(g, 34, 0, 8, -210, c, 4);
    for (let i = 0; i < 7; i++) {
      const y0 = -i * 30;
      const y1 = -(i + 1) * 30;
      const w0 = 34 - i * 3.7;
      const w1 = 34 - (i + 1) * 3.7;
      line(g, -w0, y0, w1, y1, c, 1.6);
      line(g, w0, y0, -w1, y1, c, 1.6);
    }
    line(g, -46, -160, 46, -160, c, 4);
    line(g, -36, -195, 36, -195, c, 3);
    g.strokeStyle = '#2a2622';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-46, -160);
    g.quadraticCurveTo(-60, -110, -52, -70);
    g.moveTo(46, -160);
    g.quadraticCurveTo(64, -120, 70, -96);
    g.stroke();
    g.restore();
  });
}

function junk(rng, big = false) {
  const w = big ? 80 : 70;
  const h = big ? 44 : 40;
  return createSprite(w, h, w / 2, h - 2, (g) => {
    const cols = ['#6a5a4a', '#8a4a22', '#4a5560', '#7a6a58', '#3a3632', '#9a7a3a'];
    const items = big ? 16 : 12;
    for (let i = 0; i < items; i++) {
      const t = i / items;
      const x = 8 + rng() * (w - 16);
      const y = h - 6 - rng() * (h - 14) * (1 - Math.abs(x - w / 2) / (w / 2)) - t * 2;
      const c = cols[Math.floor(rng() * cols.length)];
      g.save();
      g.translate(x, y);
      g.rotate(rng() * TAU);
      if (rng() > 0.5) rrect(g, -7, -4, 14 + rng() * 6, 8, 1.5, c);
      else circ(g, 0, 0, 4 + rng() * 4, c);
      g.restore();
    }
    poly(g, [[0, h], [w * 0.2, h - 10], [w * 0.5, h - 16], [w * 0.8, h - 10], [w, h]], '#4d3e2f');
  });
}

function tires() {
  return createSprite(60, 44, 30, 42, (g) => {
    for (const [x, y] of [[18, 34], [42, 34], [30, 22], [30, 10]]) {
      ell(g, x, y, 13, 6, '#1e1c1a');
      ell(g, x, y, 6, 2.6, '#3a3632');
    }
  });
}

function barrelDeco(rng) {
  return createSprite(34, 44, 17, 42, (g) => {
    g.save();
    g.translate(17, 42);
    g.rotate((rng() - 0.5) * 0.3);
    rrect(g, -12, -38, 24, 38, 3, '#8a4a22');
    g.fillStyle = '#6a3618';
    g.fillRect(-12, -30, 24, 3);
    g.fillRect(-12, -11, 24, 3);
    ell(g, 4, -20, 4, 6, 'rgba(60,30,10,0.6)');
    g.restore();
  });
}

// ---------------------------------------------------------------- Nuvens por época

function smogCloud(rng) {
  return cloudSprite(rng, 'rgba(48,22,78,0.92)', 'rgba(255,80,200,0.75)');
}

function smokeCloud(rng) {
  return cloudSprite(rng, 'rgba(70,56,46,0.9)', 'rgba(20,12,8,0.9)');
}

// ---------------------------------------------------------------- Banco

export function buildDecor(rng, S) {
  const many = (n, fn) => Array.from({ length: n }, () => fn(rng));
  const p70 = { trunk: '#6a3a1a', leaf: '#d9822b', leafLight: '#e9a43a', leafDark: '#b8641e' };
  const p70b = { trunk: '#6a3a1a', leaf: '#a8a22a', leafLight: '#c8c23a', leafDark: '#868020' };
  const lush = { trunk: '#6a3a18', leaf: '#3fb52a', leafLight: '#7fe04a', leafDark: '#2e9420' };
  return {
    tree: S.trees,
    pine: S.pines,
    mountainCloudy: S.mountains.slice(0, 2),
    mountainSnowy: S.mountains.slice(2),
    hill: S.hills,
    fence: [S.fence],
    windmill: [windmill()],
    cottage: many(2, cottage),
    gasLamp: [gasLamp()],
    factory: many(2, factory),
    barn: [barn()],
    pole: [pole()],
    sandbags: [sandbags()],
    tvTower: [tvTower()],
    tree70: [...many(3, (r) => roundTree(r, p70)), ...many(2, (r) => roundTree(r, p70b))],
    house70: many(3, house70),
    picket: [picket()],
    streetLamp: [streetLamp()],
    glassTower: many(3, glassTower),
    turbine: [turbine()],
    treeLush: many(4, (r) => roundTree(r, lush)),
    modernHouse: [modernHouse()],
    hedge: many(2, hedge),
    modernLamp: [modernLamp()],
    neonTower: many(4, neonTower),
    neonPalm: many(2, neonPalm),
    billboard: many(2, billboard),
    neonLamp: [neonLamp()],
    tronPyramid: many(2, tronPyramid),
    tronTower: many(3, tronTower),
    tronSpire: many(3, tronSpire),
    tronPost: [tronPost()],
    ruin: many(4, ruin),
    brokenStack: [brokenStack()],
    deadTree: many(3, deadTree),
    pylon: [pylon()],
    junk: many(3, (r) => junk(r)),
    tires: [tires()],
    barrelDeco: many(2, barrelDeco),
    clouds: {
      white: S.clouds,
      smog: many(5, smogCloud),
      smoke: many(5, smokeCloud),
    },
  };
}

export { junk };
