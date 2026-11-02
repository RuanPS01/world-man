// Lógica principal: personagem, ponteiros do relógio, inimigos, tiros, câmera,
// épocas e renderização da cena.

import { PLANET, PLAYER, BULLET } from './config.js';
import { ERAS, difficulty, mixPost } from './eras.js';
import { World } from './world.js';
import { drawPlayer } from './sprites.js';
import { FOES, Floater, Rocket, Faller, spawnFoe } from './enemies.js';
import { TAU, clamp, damp, rand, chance, pick, weighted, wrapAngle, polar } from './utils.js';

const R = PLANET.R;

/** Altura da ponta dos ponteiros acima do chão (sempre um obstáculo para pular). */
export const HAND_TIP = 28;

/** Ponteiros: hora (lento, vem de frente), minuto e segundo (rápidos, vêm de trás). */
const HANDS = {
  hour: { rel: -0.38, hw: 9 },
  minute: { rel: 0.55, hw: 6 },
  second: { rel: 0.8, hw: 4 },
};

/** Converte um ponto do referencial local da superfície (x à frente, y para baixo) para o mundo. */
function localToWorld(a, r, lx, ly) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const rr = r - ly;
  return { x: c * rr - s * lx, y: s * rr + c * lx };
}

/** Formatos dos ponteiros clássicos, no referencial local (y negativo = para fora). */
function buildHandPaths() {
  const r0 = -(R - 900);
  const y = (r) => -r;
  const T = R + HAND_TIP;
  const hour = new Path2D();
  hour.moveTo(-6, r0);
  hour.lineTo(-6, y(R - 80));
  hour.bezierCurveTo(-6, y(R - 70), -23, y(R - 68), -21, y(R - 44));
  hour.bezierCurveTo(-19, y(R - 20), -7, y(R + 8), 0, y(T));
  hour.bezierCurveTo(7, y(R + 8), 19, y(R - 20), 21, y(R - 44));
  hour.bezierCurveTo(23, y(R - 68), 6, y(R - 70), 6, y(R - 80));
  hour.lineTo(6, r0);
  hour.closePath();

  const minute = new Path2D();
  minute.rect(-4, y(R - 54), 8, r0 - y(R - 54));
  minute.moveTo(-6, y(R - 25));
  minute.lineTo(-7.5, y(R - 4));
  minute.lineTo(0, y(T));
  minute.lineTo(7.5, y(R - 4));
  minute.lineTo(6, y(R - 25));
  minute.closePath();
  const minuteRing = new Path2D();
  minuteRing.arc(0, y(R - 38), 16, 0, TAU);
  minuteRing.arc(0, y(R - 38), 9, 0, TAU, true);

  const second = new Path2D();
  second.rect(-2, y(R - 58), 4, r0 - y(R - 58));
  second.arc(0, y(R - 50), 9, 0, TAU);
  second.moveTo(-2.2, y(R - 44));
  second.lineTo(0, y(T));
  second.lineTo(2.2, y(R - 44));
  second.closePath();
  return { hour: [hour], minute: [minute, minuteRing], second: [second] };
}

export class Game {
  constructor(sprites, hooks = {}) {
    this.S = sprites;
    this.hooks = hooks;
    this.world = new World(sprites);
    this.handPaths = buildHandPaths();
    this.flash = 0;
    this.runOmega = PLAYER.runSpeed / R;
    this.level = 0;
    this.era = 0;
    this.viewport = { w: 1280, h: 720, portrait: false };
    this.enterAttract();
  }

  /** Recebe o tamanho do mundo visível (muda entre paisagem e retrato). */
  setViewport(v) {
    this.viewport = { ...v };
    this.applyCameraLayout();
  }

  /** Posição da câmera conforme o modo e a orientação da tela. */
  applyCameraLayout() {
    const cam = this.cam;
    if (!cam) return;
    const { h, portrait } = this.viewport;
    if (this.mode === 'play') {
      cam.zoom = 1;
      cam.anchorY = portrait ? h * 0.07 : 6;
    } else {
      cam.zoom = portrait ? 0.34 : 0.38;
      cam.anchorY = portrait ? h * 0.16 : 250;
      cam.focusR = 1400;
    }
  }

  sfx(name) {
    this.hooks.sfx?.(name);
  }

  // ---------------------------------------------------------- Modos

  enterAttract() {
    this.mode = 'attract';
    this.state = 'attract';
    this.time = 0;
    this.level = 0;
    this.era = 3;
    this.world.setEra(3);
    this.player = { a: 0, h: 0, alive: false, speed: 0 };
    this.hands = [];
    this.bullets = [];
    this.particles = [];
    this.enemies = [];
    this.cam = { angle: rand(0, TAU), lift: 0, roll: 0, shake: 0, hold: 0, zoom: 0.38, anchorY: 250, focusR: 1400 };
    this.applyCameraLayout();
    for (let i = 0; i < 3; i++) {
      const b = new Floater(this, this.cam.angle - 0.6 + i * 0.6 + rand(-0.15, 0.15), FOES.balloon);
      b.alt = rand(260, 480);
      this.enemies.push(b);
    }
    this.attractRocketT = 2;
    this.flash = 0;
  }

  startRun(name) {
    this.mode = 'play';
    this.state = 'run';
    this.name = name;
    this.world.generate();
    this.world.setEra(0);
    this.time = 0;
    this.level = 0;
    this.era = 0;
    this.domEra = 0;
    this.diff = difficulty(0);
    this.runOmega = PLAYER.runSpeed / R;
    const a0 = rand(0, TAU);
    this.player = {
      a: a0,
      h: 0,
      vh: 0,
      grounded: true,
      coyote: 0,
      jumpBuf: 0,
      jumpHeld: false,
      jumpT: 0,
      speed: PLAYER.runSpeed,
      stopped: false,
      stopLeft: 0,
      stopLatch: false,
      stops: PLAYER.stops,
      fireCd: 0,
      phase: 0,
      flash: 0,
      blinkT: 2.5,
      blink: false,
      alive: true,
      deathVh: 0,
      deathRot: 0,
      noStopsT: 0,
    };
    this.cam = { angle: a0, lift: 0, roll: 0, shake: 0, hold: 0, zoom: 1, anchorY: 6 };
    this.applyCameraLayout();
    this.world.update(0, a0);
    this.hands = [];
    // primeiro ponteiro chega perto dos 4,5 s
    this.addHand('hour', a0 + 2.9);
    this.addHand('minute', a0 - 2.5);
    this.addHand('second', a0 - 5.0);
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.spawnT = 1.4;
    this.dieT = 0;
    this.flash = 0;
    this.hudCache = '';
    this.emitHud();
    this.hooks.onEra?.(0);
  }

  addHand(style, a) {
    const n = { style, a, w: this.runOmega, rel: 0, timer: 0, prevD: null, ticked: false, tc: Infinity, d: 0 };
    this.pickHandMotion(n, true);
    n.w = this.runOmega + n.rel;
    this.hands.push(n);
  }

  pickHandMotion(n, initial = false) {
    const mult = (this.diff ? this.diff.hands : 1) * rand(0.85, 1.15);
    let rel = HANDS[n.style].rel * mult;
    const d = wrapAngle(n.a - this.player.a);
    // nas épocas futuristas o tempo às vezes corre ao contrário (só longe do jogador)
    if (!initial && this.era >= 4 && Math.abs(d) > 0.9 && chance(0.2)) rel = -rel;
    n.rel = rel;
    n.timer = rand(3, 6);
  }

  // ---------------------------------------------------------- Atualização

  update(dt, input) {
    this.flash = Math.max(0, this.flash - dt * 2.2);
    if (this.mode === 'attract') {
      this.updateAttract(dt);
      return;
    }
    if (this.state === 'dying') {
      this.updateDying(dt);
      return;
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.step(h, input, i === 0);
      if (this.state !== 'run') break;
    }
    this.emitHud();
  }

  updateAttract(dt) {
    this.cam.angle += dt * 0.06;
    this.world.update(dt, this.cam.angle);
    for (const e of this.enemies) {
      e.t += dt;
      if (e instanceof Floater && wrapAngle(e.a - this.cam.angle) < -0.95) e.a += 1.9;
      if (e instanceof Rocket) {
        e.valt += e.acc * dt * 0.5;
        e.alt += e.valt * dt;
        e.smokeT -= dt;
        if (e.smokeT <= 0 && e.alt < 500) {
          e.smokeT = 0.06;
          this.smokePuff(e.a, e.alt - 6, rand(7, 12), 0.8);
        }
        if (e.alt > 1600) e.alive = false;
      }
    }
    this.attractRocketT -= dt;
    if (this.attractRocketT <= 0) {
      this.attractRocketT = rand(3, 6);
      const r = new Rocket(this, this.cam.angle + rand(-0.6, 0.6));
      r.state = 'fly';
      this.enemies.push(r);
    }
    this.enemies = this.enemies.filter((e) => e.alive);
    this.updateParticles(dt);
  }

  updateDying(dt) {
    const p = this.player;
    this.dieT += dt;
    const slow = dt * 0.35;
    this.world.update(slow, this.cam.angle);
    p.deathVh -= 1700 * dt;
    p.h = Math.max(-40, p.h + p.deathVh * dt);
    p.deathRot += dt * 9;
    for (const e of this.enemies) if (e.alive) e.update(slow);
    this.enemies = this.enemies.filter((e) => e.alive);
    for (const n of this.hands) n.a += n.w * slow;
    this.updateParticles(slow);
    this.cam.shake = Math.max(0, this.cam.shake - 30 * dt);
    this.cam.hold = damp(this.cam.hold, 0, 12, dt);
    if (this.dieT > 1.25 && this.state === 'dying') {
      this.state = 'over';
      this.hooks.onGameOver?.(Math.floor(this.time));
    }
  }

  step(dt, input, first) {
    const p = this.player;
    this.time += dt;
    this.diff = difficulty(this.time);
    this.level = this.diff.level;
    if (this.diff.era !== this.era) {
      this.era = this.diff.era;
      this.world.beginTransition(this.era, this.cam.angle);
    }
    this.runOmega = (PLAYER.runSpeed * this.diff.speed) / R;
    this.world.update(dt, this.cam.angle);
    const dom = this.world.dominant;
    if (dom !== this.domEra) {
      this.domEra = dom;
      this.hooks.onEra?.(dom);
      this.sfx('era');
    }

    // ---- parada (seta para a esquerda): segura o personagem e treme a tela
    if (first && input.pressed.stop) this.tryStop();
    if (p.stopped) {
      p.stopLeft -= dt;
      if (!input.held.stop || p.stopLeft <= 0) {
        p.stopped = false;
        this.hooks.onStop?.(false);
        if (input.held.stop) p.stopLatch = true;
      }
    }
    if (!input.held.stop) p.stopLatch = false;
    p.noStopsT = Math.max(0, p.noStopsT - dt);

    // ---- corrida automática
    const targetSpeed = p.stopped ? 0 : this.runOmega * R;
    p.speed = damp(p.speed, targetSpeed, p.stopped ? 20 : 8, dt);
    p.a += (p.speed / R) * dt;
    p.phase += p.speed * dt * 0.046;

    // ---- pulo (seta para cima)
    if (first && input.pressed.jump) p.jumpBuf = PLAYER.jumpBuffer;
    p.jumpBuf -= dt;
    p.coyote = p.grounded ? PLAYER.coyote : p.coyote - dt;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vh = PLAYER.jumpVel;
      p.grounded = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      p.jumpHeld = true;
      p.jumpT = 0;
      this.sfx('jump');
    }
    p.jumpT += dt;
    // soltar o botão cedo faz um pulo mais baixo (mas nunca menor que um pulinho seguro)
    if (p.jumpHeld && !input.held.jump && p.vh > 0 && p.jumpT > 0.1) {
      p.vh *= PLAYER.jumpCut;
      p.jumpHeld = false;
    }
    if (!p.grounded) {
      p.vh -= PLAYER.gravity * dt;
      p.h += p.vh * dt;
      if (p.h <= 0) {
        p.h = 0;
        p.vh = 0;
        p.grounded = true;
        p.jumpHeld = false;
        this.dust();
      }
    }

    // ---- tiro (X)
    p.fireCd -= dt;
    if (input.held.shoot && p.fireCd <= 0) {
      this.fire();
      p.fireCd = PLAYER.fireCooldown;
    }
    p.flash = Math.max(0, p.flash - dt);
    p.blinkT -= dt;
    if (p.blinkT <= 0) {
      p.blink = !p.blink;
      p.blinkT = p.blink ? 0.12 : rand(2, 4);
    }

    this.updateHands(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateParticles(dt);
    this.updateSpawner(dt);
    this.updateCamera(dt);
  }

  tryStop() {
    const p = this.player;
    if (p.stopped || p.stopLatch) return;
    if (p.stops <= 0) {
      p.noStopsT = 0.9;
      this.sfx('deny');
      return;
    }
    p.stops -= 1;
    p.stopped = true;
    p.stopLeft = PLAYER.stopMax;
    this.sfx('stop');
    this.hooks.onStop?.(true);
  }

  updateHands(dt) {
    const p = this.player;
    const om = p.speed / R;
    for (const n of this.hands) {
      n.timer -= dt;
      if (n.timer <= 0) this.pickHandMotion(n);
      n.w = damp(n.w, this.runOmega + n.rel, 1.8, dt);
      n.a += n.w * dt;

      const d = wrapAngle(n.a - p.a);
      const hitW = (PLAYER.halfWidth + HANDS[n.style].hw) / R;
      const crossed = n.prevD !== null && Math.sign(d) !== Math.sign(n.prevD) && Math.abs(d) < 0.2 && Math.abs(n.prevD) < 0.2;
      if ((Math.abs(d) < hitW || crossed) && p.h < HAND_TIP - 2) this.killPlayer('ponteiro');
      n.prevD = d;
      n.d = d;

      // aviso sonoro (tique) pouco antes do ponteiro chegar
      const relNow = n.w - om;
      const tc = d * relNow < 0 ? -d / relNow : Infinity;
      n.tc = tc;
      if (tc < 0.5 && !n.ticked && p.alive) {
        n.ticked = true;
        this.sfx(n.style === 'second' ? 'tick' : 'tock');
      }
      if (tc > 0.9) n.ticked = false;
    }
  }

  playerCircles() {
    const p = this.player;
    const a = polar(p.a, R + p.h + 14);
    const b = polar(p.a, R + p.h + 38);
    return [
      { x: a.x, y: a.y, r: 11 },
      { x: b.x, y: b.y, r: 12 },
    ];
  }

  updateEnemies(dt) {
    const pc = this.playerCircles();
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.update(dt);
      if (e.alive && this.player.alive && e.touchesPlayer(pc)) {
        e.destroy();
        this.killPlayer(e.kind);
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);
  }

  addFaller(kind, a, alt, valt, wa) {
    this.enemies.push(new Faller(this, kind, a, alt, valt, wa));
    this.sfx('drop');
  }

  updateSpawner(dt) {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    const active = this.enemies.filter((e) => e.kind !== 'bomb').length;
    if (active < this.diff.maxActive) this.spawnEnemy();
    this.spawnT = this.diff.spawn * rand(0.75, 1.25);
  }

  spawnEnemy() {
    const pool = ERAS[this.era].foes;
    const [type, opts] = weighted(pool.map(([t, w, o]) => [[t, o || {}], w]));
    const e = spawnFoe(this, type, opts);
    if (e) this.enemies.push(e);
  }

  fire() {
    const p = this.player;
    const m = localToWorld(p.a, R, 26, -(p.h + 25));
    const tx = -Math.sin(p.a);
    const ty = Math.cos(p.a);
    const ox = Math.cos(p.a);
    const oy = Math.sin(p.a);
    const sp = BULLET.speed;
    this.bullets.push({
      x: m.x,
      y: m.y,
      vx: tx * sp * 0.97 + ox * sp * 0.2,
      vy: ty * sp * 0.97 + oy * sp * 0.2,
      life: BULLET.life,
      target: null,
      dead: false,
    });
    p.flash = 0.07;
    this.sfx('shoot');
  }

  findTarget(b) {
    let best = null;
    let bestD = BULLET.range * BULLET.range;
    for (const e of this.enemies) {
      if (!e.alive || !e.targetable) continue;
      const c = e.center();
      const dx = c.x - b.x;
      const dy = c.y - b.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  updateBullets(dt) {
    for (const b of this.bullets) {
      b.life -= dt;
      if (!b.target || !b.target.alive) b.target = this.findTarget(b);
      if (b.target) {
        const c = b.target.center();
        const desired = Math.atan2(c.y - b.y, c.x - b.x);
        const cur = Math.atan2(b.vy, b.vx);
        const turn = BULLET.turnRate * dt;
        const na = cur + clamp(wrapAngle(desired - cur), -turn, turn);
        b.vx = Math.cos(na) * BULLET.speed;
        b.vy = Math.sin(na) * BULLET.speed;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      for (const e of this.enemies) {
        if (!e.alive || !e.targetable) continue;
        const c = e.center();
        const dx = c.x - b.x;
        const dy = c.y - b.y;
        const rr = e.radius + 6;
        if (dx * dx + dy * dy < rr * rr) {
          e.damage(1);
          b.dead = true;
          this.sparks(b.x, b.y, 6);
          if (e.alive) this.sfx('hit');
          break;
        }
      }
      if (!b.dead && b.life <= 0) {
        b.dead = true;
        this.firePuff(b.x, b.y, 0.6);
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead);
  }

  updateCamera(dt) {
    const p = this.player;
    const cam = this.cam;
    const lead = (p.speed / R) * 0.28;
    cam.angle += wrapAngle(p.a + lead - cam.angle) * (1 - Math.exp(-6 * dt));
    cam.lift = damp(cam.lift, p.h * 0.3, 5, dt);
    const rollT = Math.sin(this.time * 0.55) * 0.026 + Math.sin(this.time * 0.23 + 1) * 0.018 + (p.stopped ? -0.012 : 0);
    cam.roll = damp(cam.roll, rollT, 2, dt);
    cam.shake = Math.max(0, cam.shake - 30 * dt);
    cam.hold = damp(cam.hold, p.stopped ? 1 : 0, 14, dt);
  }

  killPlayer(cause) {
    const p = this.player;
    if (!p.alive) return;
    if (p.stopped) this.hooks.onStop?.(false);
    p.alive = false;
    p.stopped = false;
    this.state = 'dying';
    this.cause = cause;
    this.dieT = 0;
    p.deathVh = 560;
    p.deathRot = 0;
    const c = polar(p.a, R + p.h + 26);
    this.explode(c.x, c.y, 0.9, ['#f7d56b', '#2f63b9', '#f4f4f4', '#1b1b1d'], false, false);
    this.flash = 0.75;
    this.cam.shake = 16;
    this.sfx('death');
    this.emitHud();
  }

  // ---------------------------------------------------------- Partículas

  addParticle(o) {
    if (this.particles.length > 460) this.particles.shift();
    this.particles.push(o);
  }

  smokePuff(a, alt, size, life) {
    const c = polar(a + rand(-0.004, 0.004), R + alt);
    const o = polar(a, 1);
    const apoc = this.world.weight(6);
    this.addParticle({
      kind: 'smoke',
      x: c.x,
      y: c.y,
      vx: o.x * rand(10, 40) + rand(-15, 15),
      vy: o.y * rand(10, 40) + rand(-15, 15),
      life,
      max: life,
      size,
      grow: size * 1.6,
      color: apoc > 0.5 ? (chance(0.5) ? '120,104,92' : '96,84,74') : chance(0.5) ? '255,255,255' : '232,240,244',
    });
  }

  dust() {
    const p = this.player;
    for (let i = 0; i < 5; i++) this.smokePuff(p.a + rand(-0.012, 0.012), 2, rand(4, 7), 0.35);
  }

  sparks(x, y, n) {
    for (let i = 0; i < n; i++) {
      const ang = rand(0, TAU);
      const sp = rand(120, 360);
      this.addParticle({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: rand(0.15, 0.3),
        max: 0.3,
        size: rand(1.5, 3),
        color: pick(['#fff3a0', '#ffd23f', '#ffffff']),
      });
    }
  }

  /** Brilho colorido (rastro de jatos, fogo de entulho). */
  glowPuff(x, y, color, size) {
    this.addParticle({
      kind: 'fire',
      x: x + rand(-2, 2),
      y: y + rand(-2, 2),
      vx: rand(-15, 15),
      vy: rand(-15, 15),
      life: 0.35,
      max: 0.35,
      size: size * rand(0.6, 1),
      grow: -size,
      color,
    });
  }

  firePuff(x, y, size = 1) {
    for (let i = 0; i < 7; i++) {
      const ang = rand(0, TAU);
      const sp = rand(20, 90) * size;
      this.addParticle({
        kind: 'fire',
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: rand(0.25, 0.45),
        max: 0.45,
        size: rand(5, 10) * size,
        grow: 6 * size,
        color: pick(['#ffe36a', '#ffb22e', '#ff7a1f']),
      });
    }
  }

  explode(x, y, size = 1, colors = ['#888'], ground = false, sound = true) {
    const out = Math.atan2(y, x);
    for (let i = 0; i < 16 * size; i++) {
      const ang = ground ? out + rand(-1.2, 1.2) : rand(0, TAU);
      const sp = rand(60, 280) * size;
      this.addParticle({
        kind: 'fire',
        x: x + rand(-6, 6),
        y: y + rand(-6, 6),
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: rand(0.3, 0.6),
        max: 0.6,
        size: rand(9, 20) * size,
        grow: 16 * size,
        color: pick(['#fff3a0', '#ffd23f', '#ff9a1f', '#ff5a1f']),
      });
    }
    for (let i = 0; i < 9 * size; i++) {
      const ang = rand(0, TAU);
      const sp = rand(30, 120);
      this.addParticle({
        kind: 'smoke',
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: rand(0.7, 1.3),
        max: 1.3,
        size: rand(12, 22) * size,
        grow: 30 * size,
        color: pick(['200,200,200', '150,150,150', '235,235,235']),
      });
    }
    for (let i = 0; i < 9; i++) {
      const ang = rand(0, TAU);
      const sp = rand(140, 420);
      this.addParticle({
        kind: 'debris',
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: rand(0.7, 1.2),
        max: 1.2,
        size: rand(3, 7),
        rot: rand(0, TAU),
        vr: rand(-12, 12),
        color: pick(colors),
      });
    }
    this.sparks(x, y, 10);
    this.cam.shake = Math.max(this.cam.shake, 7 * size);
    if (sound) this.sfx('explosion');
  }

  updateParticles(dt) {
    for (const q of this.particles) {
      q.life -= dt;
      if (q.kind === 'debris') {
        const d = Math.hypot(q.x, q.y) || 1;
        q.vx -= (q.x / d) * 900 * dt;
        q.vy -= (q.y / d) * 900 * dt;
        q.rot += q.vr * dt;
      } else {
        const drag = q.kind === 'spark' ? 2 : 3.2;
        q.vx *= Math.exp(-drag * dt);
        q.vy *= Math.exp(-drag * dt);
      }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.grow) q.size = Math.max(0.5, q.size + q.grow * dt);
    }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  // ---------------------------------------------------------- HUD e efeitos

  emitHud() {
    const p = this.player;
    const hud = {
      stops: p.stops,
      time: Math.floor(this.time),
      stopLeft: p.stopped ? Math.ceil(p.stopLeft - 1e-6) : 0,
      noStops: p.noStopsT > 0,
    };
    const key = `${hud.stops}|${hud.time}|${hud.stopLeft}|${hud.noStops}`;
    if (key !== this.hudCache) {
      this.hudCache = key;
      this.hooks.onHud?.(hud);
    }
  }

  /** Parâmetros de pós-processamento da cena atual (mistura das épocas). */
  postParams() {
    const W = this.world;
    if (this.mode !== 'play') return { ...ERAS[3].post, bloom: 0, vig: 0.45 };
    return mixPost(ERAS[W.from].post, ERAS[W.to].post, W.mix);
  }

  // ---------------------------------------------------------- Renderização

  applyCamera(ctx) {
    const cam = this.cam;
    ctx.rotate(cam.roll + (this.rollJit || 0));
    if (this.shakeOff) ctx.translate(this.shakeOff.x, this.shakeOff.y);
    ctx.translate(0, cam.anchorY);
    ctx.scale(cam.zoom, cam.zoom);
    const focusR = this.mode === 'play' ? R + cam.lift : cam.focusR || 0;
    ctx.translate(0, focusR);
    ctx.rotate(-Math.PI / 2 - cam.angle);
  }

  /** Filtro aproximado para o modo sem WebGL. */
  applyFilters2D(ctx, w, h) {
    const f = this.postParams();
    const x = -w / 2 - 4;
    const y = -h / 2 - 4;
    if (f.gray > 0.004) {
      ctx.globalCompositeOperation = 'saturation';
      ctx.globalAlpha = Math.min(1, f.gray);
      ctx.fillStyle = '#808080';
      ctx.fillRect(x, y, w + 8, h + 8);
    }
    if (f.sepia > 0.004) {
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.55 * f.sepia;
      ctx.fillStyle = '#a5743c';
      ctx.fillRect(x, y, w + 8, h + 8);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /**
   * Desenha a cena completa.
   * v: { ctx, pw, ph (pixels do canvas), scale, w, h (unidades lógicas com margem), octx }
   */
  render(v) {
    const { ctx, pw, ph, scale, w, h, octx } = v;
    const cam = this.cam;
    const sk = cam.shake + 3.8 * (cam.hold || 0);
    this.shakeOff = sk > 0.05 ? { x: rand(-1, 1) * sk, y: rand(-1, 1) * sk } : null;
    this.rollJit = (cam.hold || 0) > 0.05 ? rand(-1, 1) * 0.004 * cam.hold : 0;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(scale, 0, 0, scale, pw / 2, ph / 2);

    this.world.drawSky(ctx, w, h, cam.angle);

    const play = this.mode === 'play';
    const half = play ? Math.min(Math.PI, Math.asin(clamp((w / 2 + 180) / R, 0, 1)) + 0.05) : 1.25;
    const view = { angle: cam.angle, half };

    ctx.save();
    this.applyCamera(ctx);
    this.world.drawBack(ctx, view);
    this.world.drawFront(ctx, view);

    for (const e of this.enemies) if (e.kind === 'bomb') e.drawShadow(ctx);
    for (const e of this.enemies) if (e.kind !== 'bomb') e.draw(ctx);
    for (const e of this.enemies) if (e.kind === 'bomb') e.draw(ctx);

    if (play) this.drawPlayerEntity(ctx);
    const bolt = play ? ERAS[this.world.dominant].bullet : 'dark';
    if (bolt === 'dark') this.drawBullets(ctx, bolt);
    this.drawParticles(ctx, false);
    ctx.restore();
    if (play) this.world.drawWeather(ctx, w, h, false);

    // Camada que não recebe o filtro da época: ponteiros, fogo, brilhos.
    let lc = ctx;
    if (octx) {
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.clearRect(0, 0, octx.canvas.width, octx.canvas.height);
      octx.setTransform(scale, 0, 0, scale, pw / 2, ph / 2);
      lc = octx;
    } else {
      this.applyFilters2D(ctx, w, h);
    }
    lc.save();
    this.applyCamera(lc);
    if (play) {
      for (const n of this.hands) this.drawHand(lc, n);
      if (bolt !== 'dark') this.drawBullets(lc, bolt);
      this.drawMuzzle(lc);
    }
    this.drawParticles(lc, true);
    lc.restore();
    if (play) {
      this.world.drawWeather(lc, w, h, true);
      if (this.state === 'run') this.drawWarnings(lc, w);
    }
  }

  drawPlayerEntity(ctx) {
    const p = this.player;
    ctx.save();
    ctx.rotate(p.a + Math.PI / 2);
    ctx.translate(0, -(R + p.h));
    if (!p.alive) {
      ctx.translate(0, -26);
      ctx.rotate(-p.deathRot);
      ctx.translate(0, 26);
    }
    if (p.alive) {
      ctx.save();
      ctx.translate(0, p.h);
      const k = clamp(1 - p.h / 160, 0.3, 1);
      ctx.fillStyle = `rgba(20,40,10,${0.28 * k})`;
      ctx.beginPath();
      ctx.ellipse(0, 1, 13 * k, 3.2 * k, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    const look = ERAS[this.world.eraAt(p.a)].player;
    drawPlayer(ctx, { phase: p.phase, air: !p.grounded || !p.alive, stopped: p.stopped && p.grounded, blink: p.blink, look });
    ctx.restore();
  }

  drawMuzzle(ctx) {
    const p = this.player;
    if (p.flash <= 0 || !p.alive) return;
    ctx.save();
    ctx.rotate(p.a + Math.PI / 2);
    ctx.translate(27, -(R + p.h + 25));
    ctx.fillStyle = '#ffe56a';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 3 : 8;
      const ang = (i / 10) * TAU;
      ctx.lineTo(Math.cos(ang) * r + 3, Math.sin(ang) * r * 0.7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /** Ponteiro de relógio clássico, preto sólido (com contorno brilhante nas épocas escuras). */
  drawHand(ctx, n) {
    const era = ERAS[this.world.eraAt(n.a)];
    const glowCol = era.hands.glow;
    const paths = this.handPaths[n.style];
    ctx.save();
    ctx.rotate(n.a + Math.PI / 2);
    if (glowCol) {
      ctx.strokeStyle = glowCol;
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 8;
      for (const pth of paths) ctx.stroke(pth);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5;
      for (const pth of paths) ctx.stroke(pth);
    }
    ctx.fillStyle = '#0b0b0d';
    ctx.fill(paths[0]);
    if (paths[1]) ctx.fill(paths[1], 'evenodd');
    ctx.restore();
  }

  drawBullets(ctx, style) {
    const col = style === 'pink' ? '#ff6ae6' : style === 'cyan' ? '#7af4ff' : '#262626';
    for (const b of this.bullets) {
      const ang = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      if (style === 'dark') {
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(-22, -1, 18, 2);
      } else {
        ctx.fillStyle = style === 'pink' ? 'rgba(255,63,210,0.35)' : 'rgba(0,229,255,0.35)';
        ctx.fillRect(-30, -3, 34, 6);
      }
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6.5, 2.4, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(ctx, colorLayer) {
    for (const q of this.particles) {
      const t = clamp(q.life / q.max, 0, 1);
      if (colorLayer) {
        if (q.kind === 'fire') {
          ctx.globalAlpha = t;
          ctx.fillStyle = q.color;
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.size * (0.5 + t * 0.5), 0, TAU);
          ctx.fill();
        } else if (q.kind === 'spark') {
          ctx.globalAlpha = t;
          ctx.fillStyle = q.color;
          ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
        }
      } else if (q.kind === 'smoke') {
        ctx.globalAlpha = t * 0.85;
        ctx.fillStyle = `rgb(${q.color})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size, 0, TAU);
        ctx.fill();
      } else if (q.kind === 'debris') {
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.fillStyle = q.color;
        ctx.fillRect(-q.size / 2, -q.size / 2, q.size, q.size * 0.7);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Posição na tela (bordas) de um ponto à altura `alt` do chão. */
  edgePoint(side, w, alt) {
    const x = side * (w / 2) * 0.8;
    const drop = R - Math.sqrt(Math.max(0, R * R - x * x));
    const y = this.cam.anchorY + drop * 0.85 - alt + this.cam.lift * 0.6;
    return { x, y };
  }

  /** Avisos piscantes nas bordas: mísseis à frente e ponteiros chegando por trás. */
  drawWarnings(ctx, w) {
    const blink = Math.sin(this.time * 18) > -0.2;
    if (!blink) return;
    for (const e of this.enemies) {
      if (!e.warn) continue;
      const d = e.rel();
      if (d < 0.5 || d > 1.05) continue;
      const { x, y } = this.edgePoint(1, w, e.alt + 16);
      this.warnIcon(ctx, x, y, 'rgba(214,43,30,0.92)');
    }
    for (const n of this.hands) {
      if (n.d > -0.32 || n.tc > 0.95) continue;
      const { x, y } = this.edgePoint(-1, w, 22);
      this.warnIcon(ctx, x, y, 'rgba(16,16,18,0.92)');
    }
  }

  warnIcon(ctx, x, y, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = fill;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(17, 13);
    ctx.lineTo(-17, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 20px "Crimson Text", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 3);
    ctx.restore();
  }

  // ---------------------------------------------------------- Depuração

  /** Pula direto para uma época (usado nos testes automatizados). */
  debugEra(i) {
    if (this.mode !== 'play') return;
    this.time = i * 20 + 0.5;
    this.diff = difficulty(this.time);
    this.level = this.diff.level;
    this.era = this.diff.era;
    this.world.setEra(this.era);
    this.domEra = this.era;
    this.hooks.onEra?.(this.era);
  }
}
