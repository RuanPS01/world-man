// Inicialização: telas, laço principal, ajuste de resolução, som e PWA.

import { VIEW_H, VIEW_MIN_W, VIEW_MAX_W, OVERSCAN, POST } from './config.js';
import { buildSprites } from './sprites.js';
import { Game } from './game.js';
import { createPost } from './post.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { store, loadRanking, saveScore } from './storage.js';
import { clamp } from './utils.js';

const $ = (sel) => document.querySelector(sel);

const stage = $('#stage');
const post = createPost($('#view'));
const scene = document.createElement('canvas');
const sctx = scene.getContext('2d', { alpha: false });
// Camada colorida separada (ponteiros e fogo), usada quando o WebGL aplica os filtros.
const overlay = post.handlesFilters ? document.createElement('canvas') : null;
const octx = overlay ? overlay.getContext('2d') : null;

const sound = new Sound();
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
  touch: $('#touch'),
  nameInput: $('#name-input'),
  overTime: $('#over-time'),
  overNew: $('#over-new'),
  ranking: $('#ranking'),
  btnSave: $('#btn-save'),
  btnPause: $('#btn-pause'),
  btnSound: $('#btn-sound'),
  btnInstall: $('#btn-install'),
  toast: $('#toast'),
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
  view: { lw: 1280, scale: 1, renderScale: 1, quality: 1 },
};

const game = new Game(sprites, {
  sfx: (n) => sound.play(n),
  onHud: (h) => updateHud(h),
  onLevel: (_lvl, look) => sound.setLook(look),
  onGameOver: (seconds) => showGameOver(seconds),
});

// ------------------------------------------------------------------ Layout

function layout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const lw = clamp((VIEW_H * vw) / vh, VIEW_MIN_W, VIEW_MAX_W);
  const scale = Math.min(vw / lw, vh / VIEW_H);
  const cssW = Math.round(lw * scale);
  const cssH = Math.round(VIEW_H * scale);
  stage.style.width = `${cssW}px`;
  stage.style.height = `${cssH}px`;
  stage.style.setProperty('--u', `${scale}px`);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const outScale = Math.min(1, 2560 / (cssW * dpr));
  post.canvas.width = Math.max(2, Math.round(cssW * dpr * outScale));
  post.canvas.height = Math.max(2, Math.round(cssH * dpr * outScale));

  app.view.lw = lw;
  app.view.scale = scale;
  applyRenderScale();
}

function applyRenderScale() {
  const v = app.view;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssH = VIEW_H * v.scale;
  let rs = clamp((cssH * dpr) / VIEW_H, 0.5, 1.35) * v.quality;
  // limita a quantidade de pixels da cena
  const maxPixels = app.isTouch ? 1.5e6 : 2.6e6;
  const px = v.lw * OVERSCAN * VIEW_H * OVERSCAN * rs * rs;
  if (px > maxPixels) rs *= Math.sqrt(maxPixels / px);
  rs = Math.max(0.4, rs);
  v.renderScale = rs;
  scene.width = Math.round(v.lw * OVERSCAN * rs);
  scene.height = Math.round(VIEW_H * OVERSCAN * rs);
  if (overlay) {
    overlay.width = scene.width;
    overlay.height = scene.height;
  }
}

window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 120));

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
  sound.setLook('color');
  sound.startMusic();
  if (app.isTouch) await enterFullscreen();
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
  sound.setLook('color');
  showScreen('menu');
}

function showGameOver(seconds) {
  app.lastTime = seconds;
  app.saved = false;
  ui.btnSave.disabled = false;
  ui.btnSave.textContent = 'Salvar';
  ui.overTime.textContent = `${seconds}s`;
  const list = loadRanking();
  const best = list.length ? list[0].time : -1;
  ui.overNew.hidden = !(seconds > best && seconds > 0);
  renderRanking(list);
  game.enterAttract();
  sound.setLook('color');
  showScreen('over');
}

function renderRanking(list, highlightDate = null) {
  ui.ranking.textContent = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Nenhum recorde salvo ainda. Use "Salvar" para guardar esta partida.';
    ui.ranking.appendChild(li);
    return;
  }
  list.forEach((e, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}º - ${e.name} - ${e.time}s`;
    if (highlightDate && e.date === highlightDate) li.className = 'me';
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

function updateHud(h) {
  ui.hudStops.textContent = String(h.stops);
  ui.hudTime.textContent = String(h.time);
  ui.hudStop.textContent = h.stopLeft > 0 ? `${h.stopLeft}s` : '';
  ui.hudStopsLine.classList.toggle('no-stops', h.noStops);
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

click('#btn-load', () => {
  renderRanking(loadRanking());
  toast('Ranking carregado.');
});

click('#btn-save', () => {
  if (app.saved) return;
  const res = saveScore(app.name, app.lastTime);
  if (!res.ok) {
    toast('Não foi possível salvar neste navegador.');
    return;
  }
  app.saved = true;
  ui.btnSave.disabled = true;
  ui.btnSave.textContent = 'Salvo';
  const me = res.list[res.position - 1];
  renderRanking(res.list, me ? me.date : null);
  sound.play('save');
  toast(res.position > 0 ? `Partida salva em ${res.position}º lugar.` : 'Partida salva, mas fora do top 10.');
});

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
    if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape').catch(() => {});
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
document.querySelectorAll('.tbtn').forEach((b) => input.bindButton(b, b.dataset.action));
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
      w: v.lw * OVERSCAN,
      h: VIEW_H * OVERSCAN,
      octx,
    },
    paused ? 0 : dt,
  );
  const play = game.mode === 'play';
  post.render(scene, {
    overlay,
    filters: game.filters,
    aspect: v.lw / VIEW_H,
    overscan: OVERSCAN,
    lens: play,
    blur: play ? POST.blur * v.renderScale : 0,
    vignette: play ? POST.vignette : 0.45,
    flash: [1, 0.96, 0.85, Math.min(0.85, game.flash)],
  });

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
