// Constantes de jogo. Unidades: "pixels lógicos" numa tela de 720 de altura.

export const VIEW_H = 720;
export const VIEW_MIN_W = 1024;
export const VIEW_MAX_W = 1600;
/** Margem extra renderizada ao redor da tela para a distorção de lente. */
export const OVERSCAN = 1.22;

export const PLANET = {
  R: 1500, // raio da superfície onde o personagem pisa
  bandFar: 46, // faixa de grama "ao fundo" (acima da superfície)
  colors: {
    sky0: '#3b9bcf',
    sky1: '#8fd2e8',
    sky2: '#bfe8ee',
    sky3: '#bdebbb',
    far: '#69a015',
    farDark: '#5d9410',
    band1: '#449123',
    band2: '#88c50d',
    band3: '#9ccb28',
    core: '#703a1b',
    coreDeep: '#4e2611',
    stone: '#86501f',
    stoneDark: '#6b3d17',
  },
};

export const PLAYER = {
  runSpeed: 300, // unidades/s na superfície
  jumpVel: 640,
  gravity: 1900,
  jumpCut: 0.5, // multiplicador ao soltar o pulo cedo
  coyote: 0.09,
  jumpBuffer: 0.13,
  halfWidth: 11,
  height: 52,
  stops: 20, // "Paradas"
  stopMax: 2, // duração máxima de cada parada (s)
  fireCooldown: 0.17,
};

export const BULLET = {
  speed: 1050,
  turnRate: 7.5,
  life: 2.1,
  range: 1700,
};

/** A cada FASE_DURACAO segundos o mundo muda de aparência e fica mais difícil. */
export const PHASE_DURATION = 20;
/** Ciclo visual das fases: 0 colorido, 1 cinza (como no original), 2 sépia, 3 noite. */
export const PHASE_LOOKS = ['color', 'gray', 'sepia', 'night'];

export const POST = {
  s0: 0.86, // escala no centro (lente "bulge")
  k: 0.42, // força da distorção de barril
  blur: 3.2, // desfoque nas bordas (px da textura)
  vignette: 0.92,
};
