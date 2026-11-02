// As épocas do mundo. O tempo de jogo atravessa a história: começa no cinema
// antigo em sépia e termina num futuro destruído, que se repete para sempre
// ficando cada vez mais rápido.

export const ERA_DURATION = 20; // segundos por época

const NATURAL = {
  far: '#69a015',
  farDark: '#5d9410',
  band1: '#449123',
  band2: '#88c50d',
  band3: '#9ccb28',
  core: '#703a1b',
  coreDeep: '#4e2611',
  stone: '#86501f',
  stoneDark: '#6b3d17',
  edge: '#3c8220',
  edgeGlow: false,
  bumps: true,
  stones: true,
  grid: null,
};

const NO_POST = {
  gray: 0,
  sepia: 0,
  grain: 0,
  scratch: 0,
  flicker: 0,
  jitter: 0,
  scan: 0,
  chroma: 0,
  crt: 0,
  bloom: 0,
  sat: 1,
  contrast: 1,
  tint: [1, 1, 1],
  vig: 0.9,
  vigColor: [0.05, 0.23, 0.33],
  blur: 1,
};

const post = (o) => ({ ...NO_POST, ...o });

export const ERAS = [
  {
    id: 'sepia',
    label: 'Anos 1900',
    palette: { ...NATURAL, far: '#76a226', farDark: '#69951c', band2: '#90c021', band3: '#a6c63a' },
    dial: { color: '#e6c56e', glow: 0, style: 'roman' },
    sky: { stops: ['#6b9cbe', '#a8cedb', '#d4e5da', '#dde8ca'], stars: 0, clouds: 'white' },
    decor: { big: ['mountainCloudy', 'hill'], mid: ['tree', 'pine', 'tree', 'windmill', 'cottage'], small: ['fence', 'gasLamp'] },
    density: { big: 1, mid: 0.95, small: 0.8 },
    post: post({
      gray: 1,
      sepia: 1,
      grain: 0.17,
      scratch: 1,
      flicker: 0.08,
      jitter: 1,
      contrast: 1.08,
      vig: 1.05,
      vigColor: [0.17, 0.11, 0.05],
      blur: 1.5,
    }),
    audio: { hp: 380, lp: 2600, peakF: 1600, peakG: 5, crackle: 0.16, rate: 1 },
    foes: [
      ['balloon', 3, { drop: null }],
      ['zeppelin', 2, { drop: 'sandbag' }],
      ['biplane', 1, { drop: null }],
    ],
    particles: null,
    hands: { glow: null },
    player: null,
    bullet: 'dark',
  },
  {
    id: 'bw',
    label: 'Anos 1940',
    palette: { ...NATURAL },
    dial: { color: '#f0f0f0', glow: 0, style: 'roman' },
    sky: { stops: ['#3b8fc4', '#8fcfe6', '#c8e8ee', '#d6edd6'], stars: 0, clouds: 'white' },
    decor: {
      big: ['mountainSnowy', 'factory', 'hill'],
      mid: ['tree', 'pine', 'barn', 'pole', 'tree'],
      small: ['fence', 'sandbags'],
    },
    density: { big: 1, mid: 0.95, small: 0.85 },
    post: post({
      gray: 1,
      grain: 0.12,
      scratch: 0.45,
      flicker: 0.05,
      jitter: 0.5,
      contrast: 1.16,
      vig: 1,
      vigColor: [0.03, 0.03, 0.035],
      blur: 1.3,
    }),
    audio: { hp: 200, lp: 4300, peakF: 1800, peakG: 2, crackle: 0.06, rate: 1 },
    foes: [
      ['balloon', 1, { drop: 'sandbag' }],
      ['zeppelin', 1, { drop: 'bomb' }],
      ['fighter', 3, { drop: 'bomb' }],
      ['barricade', 2],
    ],
    particles: null,
    hands: { glow: null },
    player: null,
    bullet: 'dark',
  },
  {
    id: 'tv',
    label: 'Anos 1970',
    palette: {
      ...NATURAL,
      far: '#7fa52a',
      farDark: '#72981f',
      band1: '#5b962c',
      band2: '#b4c832',
      band3: '#d8b23c',
      core: '#7a3e1d',
      coreDeep: '#4f2812',
      stone: '#a0602a',
      edge: '#4b8424',
    },
    dial: { color: '#f6ecd2', glow: 0, style: 'roman' },
    sky: { stops: ['#2f86c6', '#7fc3e4', '#f0d9a2', '#f4c48c'], stars: 0, clouds: 'white' },
    decor: {
      big: ['hill', 'tvTower', 'mountainCloudy'],
      mid: ['tree70', 'house70', 'house70', 'pine'],
      small: ['picket', 'streetLamp'],
    },
    density: { big: 1, mid: 0.95, small: 0.85 },
    post: post({
      grain: 0.07,
      flicker: 0.03,
      scan: 1,
      chroma: 1,
      crt: 1,
      bloom: 0.12,
      sat: 1.2,
      contrast: 1.03,
      tint: [1.03, 1, 0.95],
      vig: 1,
      vigColor: [0.02, 0.025, 0.03],
      blur: 1,
    }),
    audio: { hp: 240, lp: 7000, peakF: 2600, peakG: 3, crackle: 0, rate: 1 },
    foes: [
      ['rocket', 3],
      ['missile', 3],
      ['ufo', 2, { drop: 'plasmaGreen' }],
    ],
    particles: null,
    hands: { glow: null },
    player: null,
    bullet: 'dark',
  },
  {
    id: 'hd',
    label: 'Anos 2020',
    palette: {
      ...NATURAL,
      far: '#5fae1c',
      farDark: '#4f9d14',
      band1: '#3d9a2a',
      band2: '#7fd21a',
      band3: '#a6dc34',
      core: '#6f3a1b',
      coreDeep: '#43210f',
    },
    dial: { color: '#f8d977', glow: 0, style: 'roman' },
    sky: { stops: ['#2a8fd6', '#79c9f0', '#c3ecf7', '#c6f0c4'], stars: 0, clouds: 'white', sun: true },
    decor: {
      big: ['mountainCloudy', 'glassTower', 'turbine'],
      mid: ['treeLush', 'modernHouse', 'pine', 'treeLush'],
      small: ['hedge', 'modernLamp'],
    },
    density: { big: 1, mid: 0.95, small: 0.85 },
    post: post({ bloom: 0.25, sat: 1.14, contrast: 1.05, vig: 0.8 }),
    audio: { hp: 20, lp: 20000, peakF: 1000, peakG: 0, crackle: 0, rate: 1 },
    foes: [
      ['helicopter', 2, { drop: 'bomb' }],
      ['drone', 3],
      ['missile', 2],
      ['roadblock', 2],
      ['rocket', 1],
    ],
    particles: null,
    hands: { glow: null },
    player: null,
    bullet: 'dark',
  },
  {
    id: 'neon',
    label: 'Anos 2070',
    palette: {
      far: '#1f1040',
      farDark: '#170b32',
      band1: '#2a0f52',
      band2: '#3a1672',
      band3: '#4a1c8c',
      core: '#140a2e',
      coreDeep: '#060212',
      stone: '#ff3fd2',
      stoneDark: '#33e1ff',
      edge: '#ff3fd2',
      edgeGlow: true,
      bumps: true,
      stones: true,
      grid: null,
    },
    dial: { color: '#ff5ce0', glow: 1, style: 'digital' },
    sky: { stops: ['#07021a', '#2a0a4a', '#7a1a7a', '#ff5aa8'], stars: 0.5, clouds: 'smog' },
    decor: { big: ['neonTower'], mid: ['neonPalm', 'billboard', 'neonTower'], small: ['neonLamp'] },
    density: { big: 1, mid: 0.8, small: 0.8 },
    post: post({
      bloom: 0.8,
      sat: 1.25,
      contrast: 1.08,
      chroma: 0.25,
      grain: 0.03,
      vig: 0.9,
      vigColor: [0.06, 0.0, 0.11],
    }),
    audio: { hp: 20, lp: 18000, peakF: 90, peakG: 4, crackle: 0, rate: 1 },
    foes: [
      ['hovercar', 3, { drop: 'plasmaPink' }],
      ['neonDrone', 3],
      ['neonMissile', 2],
      ['neonBarrier', 2],
    ],
    particles: 'rain',
    hands: { glow: '#ff3fd2' },
    player: null,
    bullet: 'pink',
  },
  {
    id: 'tron',
    label: 'Era Digital',
    palette: {
      far: '#040a12',
      farDark: '#03070e',
      band1: '#050c16',
      band2: '#07111e',
      band3: '#0a1828',
      core: '#02060d',
      coreDeep: '#000205',
      stone: '#00e5ff',
      stoneDark: '#ff9a1f',
      edge: '#00e5ff',
      edgeGlow: true,
      bumps: false,
      stones: true,
      grid: '#00e5ff',
    },
    dial: { color: '#00e5ff', glow: 1, style: 'digital' },
    sky: { stops: ['#000308', '#000a16', '#001b2e', '#00435c'], stars: 0.9, clouds: null, grid: true },
    decor: { big: ['tronPyramid', 'tronTower'], mid: ['tronSpire', 'tronTower'], small: ['tronPost'] },
    density: { big: 0.9, mid: 0.55, small: 0.8 },
    post: post({ bloom: 1.05, sat: 1.15, contrast: 1.1, scan: 0.12, vig: 0.85, vigColor: [0, 0.02, 0.05] }),
    audio: { hp: 20, lp: 16000, peakF: 85, peakG: 5, crackle: 0, rate: 1 },
    foes: [
      ['sentinel', 2, { drop: 'plasmaCyan' }],
      ['disc', 3],
      ['tronDrone', 2],
      ['lightJet', 2, { drop: 'plasmaCyan' }],
      ['energyWall', 2],
    ],
    particles: 'bits',
    hands: { glow: '#00e5ff' },
    player: 'tron',
    bullet: 'cyan',
  },
  {
    id: 'apoc',
    label: 'Fim dos Tempos',
    palette: {
      far: '#5b4a38',
      farDark: '#4d3e2f',
      band1: '#463628',
      band2: '#5c4632',
      band3: '#6e5238',
      core: '#33231a',
      coreDeep: '#1c120c',
      stone: '#7a6a58',
      stoneDark: '#2e2620',
      edge: '#2f251c',
      edgeGlow: false,
      bumps: true,
      stones: true,
      grid: null,
    },
    dial: { color: '#8f7d60', glow: 0, style: 'broken' },
    sky: { stops: ['#2a1c16', '#5a3020', '#9a4a22', '#c8742e'], stars: 0, clouds: 'smoke' },
    decor: { big: ['ruin', 'brokenStack', 'ruin'], mid: ['deadTree', 'pylon', 'deadTree'], small: ['junk', 'tires', 'barrelDeco'] },
    density: { big: 1, mid: 0.85, small: 1 },
    post: post({
      sat: 0.6,
      contrast: 1.13,
      tint: [1.12, 0.92, 0.74],
      grain: 0.09,
      flicker: 0.02,
      scratch: 0.12,
      bloom: 0.18,
      vig: 1.05,
      vigColor: [0.14, 0.06, 0.02],
      blur: 1.3,
    }),
    audio: { hp: 70, lp: 2500, peakF: 400, peakG: 3, crackle: 0.05, rate: 0.95 },
    foes: [
      ['debris', 3],
      ['trash', 3],
      ['barrel', 2],
      ['scavenger', 2],
      ['rustRocket', 1],
    ],
    particles: 'ash',
    hands: { glow: '#ff7a2a' },
    player: 'apoc',
    bullet: 'dark',
  },
];

export const ERA_IDS = ERAS.map((e) => e.id);
export const LAST_ERA = ERAS.length - 1;

/** Índice da época para um tempo de jogo (a última se repete para sempre). */
export function eraForTime(t) {
  return Math.min(LAST_ERA, Math.floor(t / ERA_DURATION));
}

/** Dificuldade contínua: sobe a cada época e continua subindo no apocalipse. */
export function difficulty(t) {
  const level = Math.floor(t / ERA_DURATION);
  const extra = Math.max(0, level - LAST_ERA);
  return {
    level,
    era: Math.min(LAST_ERA, level),
    speed: Math.min(1.95, 1 + 0.075 * Math.min(level, LAST_ERA) + 0.04 * extra),
    hands: Math.min(2.3, 1 + 0.1 * Math.min(level, LAST_ERA) + 0.05 * extra),
    spawn: Math.max(1.05, 3.4 - 0.3 * level),
    maxActive: Math.min(2 + level, 7),
  };
}

const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mistura duas cores hexadecimais. */
export function mixColor(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Mistura os parâmetros de pós-processamento de duas épocas. */
export function mixPost(a, b, t) {
  const out = {};
  for (const k of Object.keys(a)) {
    const va = a[k];
    const vb = b[k];
    out[k] = Array.isArray(va) ? va.map((v, i) => lerp(v, vb[i], t)) : lerp(va, vb, t);
  }
  return out;
}

export function mixAudio(a, b, t) {
  const out = {};
  for (const k of Object.keys(a)) out[k] = lerp(a[k], b[k], t);
  return out;
}
