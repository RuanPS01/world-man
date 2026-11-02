// Inicialização: telas, laço principal, ajuste de resolução, som e PWA.

import { VIEW_H, VIEW_MIN_W, VIEW_MAX_W, PORTRAIT_MIN_H, PORTRAIT_MAX_H, PORTRAIT_VIEW_W, OVERSCAN, POST } from './config.js';
import { buildSprites } from './sprites.js';
import { Game } from './game.js';
import { createPost } from './post.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { store, loadRanking, saveScore, formatDate } from './storage.js';
import { clamp } from './utils.js';
import { ERAS, mixAudio } from './eras.js';

const $ = (sel) => document.querySelector(sel);

const stage = $('#stage');
const post = createPost($('#view'));
const scene = document.createElement('canvas');
const sctx = scene.getContext('2d', { alpha: false });
// Camada colorida separada (ponteiros e fogo), usada quando o WebGL aplica os filtros.
const overlay = post.handlesFilters ? document.createElement('canvas') : null;
const octx = overlay ? overlay.getContext('2d') : null;

const sound = new Sound();
sound.prefetch('assets/audio/mundo-pequeno.mp3');
const input = new Input();
input.bindKeyboard(window);
input.enabled = false;

const sprites = buildSprites(20251101);

const ui = {
  hud: $('#hud'),
  hudName: $('#hud-name'),
  hudStops: $('#hud-stops'),
  hudStopsLine: $('#hud-stops-line'),
  hudTime: $('#hud-time'),
  hudStop: $('#hud-stop'),
  hudStopNum: $('#hud-stop-num'),
  hudStopFill: $('#hud-stop-fill'),
  hudPanel: $('#hud-panel'),
  hudAmmo: $('#hud-ammo'),
  hudAmmoIcons: $('#hud-ammo-icons'),
  hudAmmoNum: $('#hud-ammo-num'),
  hudReloadFill: $('#hud-reload-fill'),
  touchShoot: $('#touch .tbtn-shoot'),
  touchAmmo: $('#touch-ammo'),
  touch: $('#touch'),
  nameInput: $('#name-input'),
  overTime: $('#over-time'),
  overNew: $('#over-new'),
  ranking: $('#ranking'),
  rankingNote: $('#ranking-note'),
  rankingHead: $('.rk-head'),
  btnPause: $('#btn-pause'),
  btnSound: $('#btn-sound'),
  btnInstall: $('#btn-install'),
  toast: $('#toast'),
  eraCaption: $('#era-caption'),
  screens: {
    menu: $('#screen-menu'),
    controls: $('#screen-controls'),
    credits: $('#screen-credits'),
    over: $('#screen-over'),
    pause: $('#screen-pause'),
  },
};

const app = {
  screen: 'menu',
  name: 'WorldMan',
  lastTime: 0,
  saved: false,
  isTouch: false,
  view: { dw: 1280, dh: 720, viewW: 1280, viewH: 720, portrait: false, scale: 1, renderScale: 1, quality: 1, dpr: 1 },
};

const game = new Game(sprites, {
  sfx: (n) => sound.play(n),
  onHud: (h) => updateHud(h),
  onEra: (i) => showEra(i),
  onStop: (on) => vibrate(on),
  onGameOver: (seconds) => showGameOver(seconds),
});

// ------------------------------------------------------------------ Épocas

let captionTimer = 0;
let hudSwapTimer = 0;
function showEra(i) {
  const era = ERAS[i];
  stage.dataset.era = era.id;
  swapHudEra(era.id);
  ui.eraCaption.textContent = era.label;
  ui.eraCaption.classList.remove('show');
  void ui.eraCaption.offsetWidth;
  ui.eraCaption.classList.add('show');
  clearTimeout(captionTimer);
  captionTimer = setTimeout(() => ui.eraCaption.classList.remove('show'), 2600);
}

/** Troca o visual do painel da partida: o painel sai e volta com a cara da nova época. */
function swapHudEra(id) {
  const panel = ui.hudPanel;
  clearTimeout(hudSwapTimer);
  panel.classList.remove('hud-out', 'hud-in');
  if (ui.hud.hidden || panel.dataset.era === id) {
    panel.dataset.era = id;
    return;
  }
  panel.classList.add('hud-out');
  hudSwapTimer = setTimeout(() => {
    panel.classList.remove('hud-out');
    panel.dataset.era = id;
    void panel.offsetWidth;
    panel.classList.add('hud-in');
    hudSwapTimer = setTimeout(() => panel.classList.remove('hud-in'), 900);
  }, 240);
}

/** Vibração do aparelho (celulares Android) enquanto o personagem está parado. */
function vibrate(on) {
  if (!app.isTouch || !navigator.vibrate || sound.muted) return;
  try {
    if (on) navigator.vibrate([40, 30, 40, 30, 40, 30, 40, 30, 40, 30, 40, 30, 40, 30, 40, 30, 40, 30, 40, 30, 40, 30, 40, 30, 40, 30]);
    else navigator.vibrate(0);
  } catch {
    /* sem suporte */
  }
}

function startMusicOnce() {
  sound.unlock();
  sound.startMusic();
}
window.addEventListener('pointerdown', startMusicOnce, { once: true });
window.addEventListener('keydown', startMusicOnce, { once: true });

// ------------------------------------------------------------------ Layout

/**
 * Calcula o layout para o tamanho da janela. Há dois espaços de design:
 * paisagem (altura de 720 unidades) e retrato (largura de 720 unidades).
 * Em retrato o mundo do jogo fica um pouco mais afastado para enxergar mais.
 */
function computeLayout(vw, vh) {
  const portrait = vh > vw * 1.02;
  if (!portrait) {
    const dw = clamp((VIEW_H * vw) / vh, VIEW_MIN_W, VIEW_MAX_W);
    const dh = VIEW_H;
    return { portrait, dw, dh, scale: Math.min(vw / dw, vh / dh), viewW: dw, viewH: VIEW_H };
  }
  const dw = VIEW_H;
  const dh = clamp((VIEW_H * vh) / vw, PORTRAIT_MIN_H, PORTRAIT_MAX_H);
  const viewW = PORTRAIT_VIEW_W;
  return { portrait, dw, dh, scale: Math.min(vw / dw, vh / dh), viewW, viewH: (viewW * dh) / dw };
}

let lastSize = { w: 0, h: 0 };
function layout() {
  const vw = Math.round(window.innerWidth);
  const vh = Math.round(window.innerHeight);
  // com o teclado virtual aberto (digitando o nome) não encolhe a tela
  const typing = document.activeElement === ui.nameInput;
  if (typing && app.isTouch && vw === lastSize.w && vh < lastSize.h * 0.8) return;
  lastSize = { w: vw, h: vh };

  const L = computeLayout(vw, vh);
  const cssW = Math.round(L.dw * L.scale);
  const cssH = Math.round(L.dh * L.scale);
  stage.style.width = `${cssW}px`;
  stage.style.height = `${cssH}px`;
  stage.style.setProperty('--u', `${L.scale}px`);
  stage.style.setProperty('--dw', String(L.dw));
  stage.style.setProperty('--dh', String(L.dh));
  stage.classList.toggle('portrait', L.portrait);
  stage.classList.toggle('compact', cssH < 520 || cssW < 560);
  document.documentElement.classList.toggle('portrait', L.portrait);

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const outScale = Math.min(1, 1920 / (Math.max(cssW, cssH) * dpr));
  app.view.dpr = dpr * outScale;
  post.canvas.width = Math.max(2, Math.round(cssW * dpr * outScale));
  post.canvas.height = Math.max(2, Math.round(cssH * dpr * outScale));

  Object.assign(app.view, L);
  game.setViewport({ w: L.viewW, h: L.viewH, portrait: L.portrait });
  applyRenderScale();
}

function applyRenderScale() {
  const v = app.view;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssH = v.dh * v.scale;
  let rs = clamp((cssH * dpr) / v.viewH, 0.4, 1.35) * v.quality;
  // limita a quantidade de pixels da cena
  const maxPixels = app.isTouch ? 1.5e6 : 2.6e6;
  const px = v.viewW * OVERSCAN * v.viewH * OVERSCAN * rs * rs;
  if (px > maxPixels) rs *= Math.sqrt(maxPixels / px);
  rs = Math.max(0.3, rs);
  v.renderScale = rs;
  scene.width = Math.round(v.viewW * OVERSCAN * rs);
  scene.height = Math.round(v.viewH * OVERSCAN * rs);
  if (overlay) {
    overlay.width = scene.width;
    overlay.height = scene.height;
  }
}

window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 150));
if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
ui.nameInput.addEventListener('blur', () => setTimeout(layout, 50));

// ------------------------------------------------------------------ Telas

function showScreen(name) {
  app.screen = name;
  for (const [key, el] of Object.entries(ui.screens)) el.hidden = key !== name;
  const inGame = name === 'playing' || name === 'pause';
  ui.hud.hidden = !inGame;
  ui.btnPause.hidden = name !== 'playing';
  ui.touch.hidden = !(name === 'playing' && app.isTouch);
  stage.classList.toggle('blurred', !inGame);
  input.enabled = name === 'playing';
  if (name !== 'playing') input.releaseAll();
  if (name === 'menu') {
    setTimeout(() => {
      if (!app.isTouch) ui.nameInput.focus({ preventScroll: true });
    }, 50);
  } else if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
  const first = ui.screens[name]?.querySelector('[data-back], #btn-retry, #btn-resume');
  if (first && !app.isTouch) setTimeout(() => first.focus({ preventScroll: true }), 30);
}

function currentName() {
  const n = (ui.nameInput.value || '').trim().replace(/\s+/g, ' ').slice(0, 14);
  return n || 'WorldMan';
}

async function startGame() {
  app.name = currentName();
  ui.nameInput.value = app.name;
  store.set('name', app.name);
  ui.hudName.textContent = app.name;
  sound.unlock();
  sound.startMusic();
  if (app.isTouch) await enterFullscreen();
  resetHud();
  game.startRun(app.name);
  showScreen('playing');
}

function pauseGame() {
  if (app.screen !== 'playing' || game.state !== 'run') return;
  showScreen('pause');
  sound.suspend();
}

function resumeGame() {
  if (app.screen !== 'pause') return;
  sound.resume();
  showScreen('playing');
}

function toMenu() {
  if (game.mode !== 'attract') game.enterAttract();
  sound.resume();
  vibrate(false);
  delete stage.dataset.era;
  showScreen('menu');
}

function showGameOver(seconds) {
  app.lastTime = seconds;
  ui.overTime.textContent = `${seconds}s`;
  // o ranking é carregado e a partida é registrada automaticamente
  const before = loadRanking();
  const best = before.length ? before[0].time : -1;
  let list = before;
  let mine = null;
  let note;
  if (seconds > 0) {
    const res = saveScore(app.name, seconds);
    list = res.list;
    mine = res.position > 0 ? res.entry : null;
    if (!res.ok) note = 'Não foi possível salvar neste navegador (o armazenamento está bloqueado).';
    else if (!res.position) note = `Esta partida (${seconds}s) ficou fora dos 10 melhores.`;
    else note = 'Recordes salvos automaticamente neste aparelho.';
  } else {
    note = 'Partidas de 0s não entram no ranking.';
  }
  ui.overNew.hidden = !(seconds > 0 && seconds > best && mine);
  renderRanking(list, mine);
  ui.rankingNote.textContent = note;
  if (mine) sound.play('save');
  game.enterAttract();
  vibrate(false);
  delete stage.dataset.era;
  showScreen('over');
}

/** Mostra o top 10: posição, nome, tempo e data e hora do registro. */
function renderRanking(list, mine = null) {
  ui.ranking.textContent = '';
  ui.rankingHead.hidden = !list.length;
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Nenhum recorde ainda. Jogue uma partida e o seu tempo aparece aqui.';
    ui.ranking.appendChild(li);
    return;
  }
  list.forEach((e, i) => {
    const li = document.createElement('li');
    const cells = [
      ['rk-pos', `${i + 1}º`],
      ['rk-name', e.name],
      ['rk-time', `${e.time}s`],
      ['rk-date', formatDate(e.date)],
    ];
    for (const [cls, text] of cells) {
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = text;
      li.appendChild(span);
    }
    li.title = `${i + 1}º lugar: ${e.name}, ${e.time}s, registrado em ${formatDate(e.date)}`;
    if (mine && e.date === mine.date && e.time === mine.time) li.className = 'me';
    ui.ranking.appendChild(li);
  });
}

let toastTimer = 0;
function toast(msg) {
  ui.toast.textContent = msg;
  ui.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2200);
}

/** Reinicia uma animação de CSS (tira e põe a classe). */
function replay(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

const hudState = { stops: -1, ammo: -1, mag: 0, reloading: false, stopOn: false };
let stopOutTimer = 0;

/** Painel limpo para uma nova partida (sem animações da partida anterior). */
function resetHud() {
  clearTimeout(stopOutTimer);
  Object.assign(hudState, { stops: -1, ammo: -1, reloading: false, stopOn: false });
  ui.hudAmmo.classList.remove('reloading', 'low', 'ready');
  ui.touchShoot.classList.remove('reloading');
  ui.hudStop.classList.remove('pop', 'low', 'out');
  ui.hudStop.hidden = true;
}

function updateHud(h) {
  // paradas (pulsa quando uma é gasta)
  if (h.stops !== hudState.stops) {
    if (hudState.stops >= 0 && h.stops < hudState.stops) replay(ui.hudStops, 'bump');
    hudState.stops = h.stops;
    ui.hudStops.textContent = String(h.stops);
  }
  ui.hudTime.textContent = String(h.time);
  ui.hudStopsLine.classList.toggle('no-stops', h.noStops);

  // contagem da parada com milissegundos (ex.: 1,734s) e barra que esvazia
  const stopOn = h.stopLeft > 0;
  if (stopOn) {
    clearTimeout(stopOutTimer);
    if (!hudState.stopOn) {
      ui.hudStop.hidden = false;
      ui.hudStop.classList.remove('out');
      replay(ui.hudStop, 'pop');
    }
    ui.hudStopNum.textContent = `${h.stopLeft.toFixed(3).replace('.', ',')}s`;
    ui.hudStopFill.style.transform = `scaleX(${clamp(h.stopLeft / h.stopMax, 0, 1)})`;
    ui.hudStop.classList.toggle('low', h.stopLeft < 0.7);
  } else if (hudState.stopOn) {
    ui.hudStop.classList.remove('pop', 'low');
    ui.hudStop.classList.add('out');
    stopOutTimer = setTimeout(() => {
      ui.hudStop.hidden = true;
      ui.hudStop.classList.remove('out');
    }, 220);
  }
  hudState.stopOn = stopOn;

  // contador de balas (10 por pente) e recarga de 3 segundos
  if (h.mag !== hudState.mag) {
    hudState.mag = h.mag;
    ui.hudAmmoIcons.textContent = '';
    for (let i = 0; i < h.mag; i++) ui.hudAmmoIcons.appendChild(document.createElement('i'));
    hudState.ammo = -1;
  }
  if (h.ammo !== hudState.ammo) {
    hudState.ammo = h.ammo;
    const icons = ui.hudAmmoIcons.children;
    for (let i = 0; i < icons.length; i++) icons[i].classList.toggle('spent', i >= h.ammo);
    ui.hudAmmoNum.textContent = String(h.ammo);
    ui.touchAmmo.textContent = String(h.ammo);
    ui.hudAmmo.classList.toggle('low', h.ammo > 0 && h.ammo <= 3);
  }
  if (h.reloading !== hudState.reloading) {
    if (hudState.reloading && !h.reloading) replay(ui.hudAmmo, 'ready');
    hudState.reloading = h.reloading;
    ui.hudAmmo.classList.toggle('reloading', h.reloading);
    ui.touchShoot.classList.toggle('reloading', h.reloading);
  }
  if (h.reloading) {
    ui.hudReloadFill.style.transform = `scaleX(${h.reload})`;
    ui.touchShoot.style.setProperty('--p', String(h.reload));
  }
}

// ------------------------------------------------------------------ Botões

function click(sel, fn) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  el.addEventListener('click', (e) => {
    sound.unlock();
    sound.play('click');
    fn(e);
  });
}

click('#btn-start', startGame);
click('#btn-controls', () => showScreen('controls'));
click('#btn-credits', () => showScreen('credits'));
document.querySelectorAll('[data-back]').forEach((b) => click(b, () => showScreen('menu')));
click('#btn-retry', startGame);
click('#btn-menu', toMenu);
click('#btn-resume', resumeGame);
click('#btn-quit', toMenu);
click('#btn-pause', pauseGame);

ui.nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    startGame();
  }
});

// som
function applyMute(m) {
  sound.setMuted(m);
  ui.btnSound.setAttribute('aria-pressed', m ? 'false' : 'true');
  ui.btnSound.setAttribute('aria-label', m ? 'Ativar som' : 'Desativar som');
}
applyMute(!!store.get('muted', false));
click('#btn-sound', () => {
  const m = !sound.muted;
  applyMute(m);
  store.set('muted', m);
});

// tela cheia
async function enterFullscreen() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    /* navegador não permite: tudo bem */
  }
}
click('#btn-fullscreen', async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {});
  } else {
    await enterFullscreen();
  }
});
if (!document.fullscreenEnabled) $('#btn-fullscreen').hidden = true;

// teclas de pausa / voltar
input.onAction = (action) => {
  if (action !== 'pause') return;
  if (app.screen === 'playing') pauseGame();
  else if (app.screen === 'pause') resumeGame();
};
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (app.screen === 'controls' || app.screen === 'credits') showScreen('menu');
});

// toque
input.bindTouchPad(
  ui.touch,
  [...document.querySelectorAll('.tbtn')].map((el) => ({ el, action: el.dataset.action })),
);
// em aparelhos híbridos (tela de toque + teclado) esconde os botões ao usar o teclado
window.addEventListener('keydown', (e) => {
  if (app.screen === 'playing' && /^(Arrow|Key[WAXJ]|Space)/.test(e.code)) stage.classList.add('kbd');
});
window.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') stage.classList.remove('kbd');
});
// impede zoom por gesto e por toque duplo (iOS)
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
function markTouch() {
  if (app.isTouch) return;
  app.isTouch = true;
  document.documentElement.classList.add('is-touch');
  applyRenderScale();
  if (app.screen === 'playing') ui.touch.hidden = false;
}
if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) markTouch();
window.addEventListener('touchstart', markTouch, { passive: true, once: true });

// pausa automática ao trocar de aba
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (app.screen === 'playing') pauseGame();
    else sound.suspend();
  } else if (app.screen !== 'pause') {
    sound.resume();
  }
});

// ------------------------------------------------------------------ Laço principal

let last = performance.now();
let perfAcc = 0;
let perfFrames = 0;

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0)) dt = 1 / 60;
  const rawDt = dt;
  dt = Math.min(dt, 0.05);

  input.pollGamepad();
  const paused = app.screen === 'pause';
  if (!paused) game.update(dt, input);
  input.endFrame();

  const v = app.view;
  game.render(
    {
      ctx: sctx,
      pw: scene.width,
      ph: scene.height,
      scale: v.renderScale,
      w: v.viewW * OVERSCAN,
      h: v.viewH * OVERSCAN,
      octx,
    },
    paused ? 0 : dt,
  );
  const play = game.mode === 'play';
  post.render(scene, {
    overlay,
    fx: game.postParams(),
    dt: paused ? 0 : dt,
    dpr: v.dpr || 1,
    lowQuality: v.quality < 0.8,
    aspect: v.viewW / v.viewH,
    portrait: v.portrait,
    overscan: OVERSCAN,
    lens: play,
    blur: play ? POST.blur * v.renderScale : 0,
    flash: [1, 0.96, 0.85, Math.min(0.85, game.flash)],
  });
  const W = game.world;
  sound.setProfile(play ? mixAudio(ERAS[W.from].audio, ERAS[W.to].audio, W.mix) : ERAS[3].audio);

  // ajuste automático de qualidade se o aparelho estiver lento
  if (app.screen === 'playing') {
    perfAcc += rawDt;
    perfFrames++;
    if (perfAcc > 2) {
      const avg = perfAcc / perfFrames;
      if (avg > 0.024 && v.quality > 0.55) {
        v.quality = Math.max(0.55, v.quality * 0.85);
        applyRenderScale();
      }
      perfAcc = 0;
      perfFrames = 0;
    }
  }
}

// ------------------------------------------------------------------ PWA

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
  ui.btnInstall.hidden = false;
});
click('#btn-install', async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice.catch(() => {});
  deferredInstall = null;
  ui.btnInstall.hidden = true;
});
window.addEventListener('appinstalled', () => {
  ui.btnInstall.hidden = true;
  toast('WorldMan instalado!');
});

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('[WorldMan] Service worker:', err));
  });
}

// ------------------------------------------------------------------ Início

ui.nameInput.value = store.get('name', 'WorldMan') || 'WorldMan';
layout();
showScreen('menu');
requestAnimationFrame((t) => {
  last = t;
  frame(t);
});

// Ganchos para testes automatizados e depuração.
window.__worldman = { game, app, sound, input };
