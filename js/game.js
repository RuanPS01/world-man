// Lógica principal: personagem, ponteiros, inimigos, tiros, câmera e renderização da cena.

import { PLANET, PLAYER, BULLET, PHASE_DURATION, PHASE_LOOKS } from './config.js';
import { World } from './world.js';
import { drawPlayer } from './sprites.js';
import { Balloon, Plane, Rocket, Missile, Bomb } from './enemies.js';
import { TAU, clamp, lerp, damp, rand, chance, pick, weighted, wrapAngle, polar } from './utils.js';

const R = PLANET.R;

/** Converte um ponto do referencial local da superfície (x à frente, y para baixo) para o mundo. */
function localToWorld(a, r, lx, ly) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const rr = r - ly;
  return { x: c * rr - s * lx, y: s * rr + c * lx };
}

const NEEDLE_STYLES = [
  { color: 'rgba(122,138,148,0.88)', light: 'rgba(196,210,216,0.9)', glow: '#e8f3f7' },
  { color: 'rgba(58,134,182,0.9)', light: 'rgba(132,196,232,0.95)', glow: '#d8f1ff' },
  { color: 'rgba(54,120,116,0.9)', light: 'rgba(130,200,190,0.95)', glow: '#dcfff8' },
];

export class Game {
  constructor(sprites, hooks = {}) {
    this.S = sprites;
    this.hooks = hooks;
    this.world = new World(sprites);
    this.filters = { gray: 0, sepia: 0, night: 0 };
    this.flash = 0;
    this.runOmega = PLAYER.runSpeed / R;
    this.level = 0;
    this.enterAttract();
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
    this.player = { a: 0, h: 0, alive: false, speed: 0 };
    this.needles = [];
    this.bullets = [];
    this.particles = [];
    this.enemies = [];
    this.cam = { angle: rand(0, TAU), lift: 0, roll: 0, shake: 0, zoom: 0.38, anchorY: 250, focusR: 1400 };
    for (let i = 0; i < 3; i++) {
      const b = new Balloon(this, this.cam.angle - 0.6 + i * 0.6 + rand(-0.15, 0.15));
      b.alt = rand(260, 480);
      this.enemies.push(b);
    }
    this.attractRocketT = 2;
    this.filters = { gray: 0, sepia: 0, night: 0 };
    this.flash = 0;
  }

  startRun(name) {
    this.mode = 'play';
    this.state = 'run';
    this.name = name;
    this.world.generate();
    this.time = 0;
    this.level = 0;
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
    this.needles = [];
    this.addNeedle(a0 + 2.1, 0);
    this.addNeedle(a0 - 2.4, 1);
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.spawnT = 1.4;
    this.spawned = 0;
    this.dieT = 0;
    this.cam = { angle: a0, lift: 0, roll: 0, shake: 0, zoom: 1, anchorY: 6 };
    this.filters = { gray: 0, sepia: 0, night: 0 };
    this.flash = 0;
    this.hudCache = '';
    this.emitHud();
  }

  addNeedle(a, styleIdx) {
    const n = {
      a,
      w: this.runOmega,
      wTarget: this.runOmega,
      timer: 0,
      ext: 1,
      extTarget: 1,
      extTimer: rand(4, 7),
      style: NEEDLE_STYLES[styleIdx % NEEDLE_STYLES.length],
      prevD: null,
      pulse: rand(0, TAU),
    };
    this.pickNeedleMotion(n, true);
    n.w = n.wTarget;
    this.needles.push(n);
  }

  pickNeedleMotion(n, initial = false) {
    const lvl = this.level;
    const rel = rand(0.3, 0.52) * Math.min(1 + 0.12 * lvl, 2.1);
    let dir = chance(0.5) ? 1 : -1;
    if (!initial) {
      const d = wrapAngle(n.a - this.player.a);
      // não inverte o sentido quando está perto do jogador (seria injusto)
      if (Math.abs(d) < 0.55) dir = n.w - this.runOmega >= 0 ? 1 : -1;
    }
    n.wTarget = this.runOmega + dir * rel;
    n.timer = rand(2.6, 5.6);
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
    this.world.update(dt);
    this.cam.angle += dt * 0.06;
    for (const e of this.enemies) {
      e.t += dt;
      if (e instanceof Balloon && wrapAngle(e.a - this.cam.angle) < -0.95) e.a += 1.9;
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
    this.world.update(slow);
    p.deathVh -= 1700 * dt;
    p.h = Math.max(-40, p.h + p.deathVh * dt);
    p.deathRot += dt * 9;
    for (const e of this.enemies) if (e.alive) e.update(slow);
    this.enemies = this.enemies.filter((e) => e.alive);
    for (const n of this.needles) n.a += n.w * slow;
    this.updateParticles(slow);
    this.cam.shake = Math.max(0, this.cam.shake - 30 * dt);
    if (this.dieT > 1.25 && this.state === 'dying') {
      this.state = 'over';
      this.hooks.onGameOver?.(Math.floor(this.time));
    }
  }

  step(dt, input, first) {
    const p = this.player;
    this.time += dt;
    const lvl = Math.floor(this.time / PHASE_DURATION);
    if (lvl !== this.level) {
      this.level = lvl;
      if (lvl === 2 && this.needles.length < 3) this.addNeedle(p.a + Math.PI, 2);
      this.hooks.onLevel?.(lvl, PHASE_LOOKS[lvl % PHASE_LOOKS.length]);
      this.sfx('phase');
    }
    this.runOmega = (PLAYER.runSpeed * (1 + 0.05 * Math.min(lvl, 8))) / R;
    this.world.update(dt);

    // ---- parada (seta para a esquerda)
    if (first && input.pressed.stop) this.tryStop();
    if (p.stopped) {
      p.stopLeft -= dt;
      if (!input.held.stop || p.stopLeft <= 0) {
        p.stopped = false;
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
    p.jumpT = (p.jumpT || 0) + dt;
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

    this.updateNeedles(dt);
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
  }

  updateNeedles(dt) {
    const p = this.player;
    for (const n of this.needles) {
      n.timer -= dt;
      if (n.timer <= 0) this.pickNeedleMotion(n);
      n.w = damp(n.w, n.wTarget, 1.8, dt);
      n.a += n.w * dt;
      n.pulse += dt * 6;

      const d = wrapAngle(n.a - p.a);
      n.extTimer -= dt;
      if (n.extTimer <= 0 && Math.abs(d) > 0.12) {
        if (n.extTarget === 1) {
          n.extTarget = 0;
          n.extTimer = rand(1.2, 2.4);
        } else {
          n.extTarget = 1;
          n.extTimer = rand(3.6, 7.5) + this.level * 0.4;
        }
      }
      n.ext = damp(n.ext, n.extTarget, 3.2, dt);

      const tipH = lerp(-78, 24, n.ext);
      const hitW = (PLAYER.halfWidth + 4) / R;
      const crossed =
        n.prevD !== null &&
        Math.sign(d) !== Math.sign(n.prevD) &&
        Math.abs(d) < 0.2 &&
        Math.abs(n.prevD) < 0.2;
      if ((Math.abs(d) < hitW || crossed) && tipH > p.h + 2) {
        this.killPlayer('ponteiro');
      }
      n.prevD = d;
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

  addBomb(a, alt, valt, wa) {
    this.enemies.push(new Bomb(this, a, alt, valt, wa));
    this.sfx('drop');
  }

  updateSpawner(dt) {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    const lvl = this.level;
    const active = this.enemies.filter((e) => e.kind !== 'bomb').length;
    if (active < Math.min(2 + lvl, 6)) this.spawnEnemy();
    this.spawnT = Math.max(1.25, 3.5 - 0.32 * lvl) * rand(0.75, 1.25);
  }

  spawnEnemy() {
    const p = this.player;
    const lvl = this.level;
    let type;
    if (this.spawned === 0) type = 'balloon';
    else if (this.spawned === 1) type = 'rocket';
    else if (lvl === 0) type = weighted([['balloon', 3], ['rocket', 3]]);
    else if (lvl === 1) type = weighted([['balloon', 2], ['rocket', 2], ['plane', 2], ['missile', 3]]);
    else type = weighted([['balloon', 2], ['rocket', 2], ['plane', 3], ['missile', 4]]);
    this.spawned++;
    let e;
    switch (type) {
      case 'balloon':
        e = new Balloon(this, p.a + rand(0.72, 0.92));
        break;
      case 'rocket':
        e = new Rocket(this, p.a + rand(0.66, 0.8));
        break;
      case 'plane': {
        const front = chance(0.6);
        e = new Plane(this, p.a + (front ? 0.95 : -0.95), front);
        break;
      }
      default:
        e = new Missile(this, p.a + 1.02, lvl >= 2 && chance(0.35));
    }
    this.enemies.push(e);
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
  }

  killPlayer(cause) {
    const p = this.player;
    if (!p.alive) return;
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
    if (this.particles.length > 420) this.particles.shift();
    this.particles.push(o);
  }

  smokePuff(a, alt, size, life) {
    const c = polar(a + rand(-0.004, 0.004), R + alt);
    const o = polar(a, 1);
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
      color: chance(0.5) ? '255,255,255' : '232,240,244',
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
      if (q.grow) q.size += q.grow * dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  // ---------------------------------------------------------- HUD

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

  // ---------------------------------------------------------- Renderização

  applyCamera(ctx) {
    const cam = this.cam;
    ctx.rotate(cam.roll);
    if (cam.shake > 0 && this.shakeOff) ctx.translate(this.shakeOff.x, this.shakeOff.y);
    ctx.translate(0, cam.anchorY);
    ctx.scale(cam.zoom, cam.zoom);
    const focusR = this.mode === 'play' ? R + cam.lift : cam.focusR || 0;
    ctx.translate(0, focusR);
    ctx.rotate(-Math.PI / 2 - cam.angle);
  }

  updateFilters(dt) {
    const look = this.mode === 'play' ? PHASE_LOOKS[this.level % PHASE_LOOKS.length] : 'color';
    const tg = { gray: 0, sepia: 0, night: 0 };
    if (look === 'gray') tg.gray = 1;
    if (look === 'sepia') {
      tg.gray = 1;
      tg.sepia = 1;
    }
    if (look === 'night') {
      tg.gray = 0.45;
      tg.night = 1;
    }
    for (const k of Object.keys(tg)) this.filters[k] = damp(this.filters[k], tg[k], 9, dt);
  }

  applyFilters(ctx, w, h) {
    const f = this.filters;
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
    if (f.night > 0.004) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.78 * f.night;
      ctx.fillStyle = '#3e5596';
      ctx.fillRect(x, y, w + 8, h + 8);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /**
   * Desenha a cena completa.
   * v: { ctx, pw, ph (pixels do canvas), scale, w, h (unidades lógicas com margem) }
   */
  render(v, dt) {
    const { ctx, pw, ph, scale, w, h, octx } = v;
    this.updateFilters(dt);
    const sk = this.cam.shake;
    this.shakeOff = { x: rand(-1, 1) * sk, y: rand(-1, 1) * sk };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(scale, 0, 0, scale, pw / 2, ph / 2);

    this.world.drawSky(ctx, w, h, this.cam.angle);

    const play = this.mode === 'play';
    const half = play ? Math.min(Math.PI, Math.asin(clamp((w / 2 + 180) / R, 0, 1)) + 0.05) : 1.25;
    const view = { angle: this.cam.angle, half };

    ctx.save();
    this.applyCamera(ctx);
    this.world.drawBack(ctx, view);
    this.world.drawFront(ctx, view);

    for (const e of this.enemies) if (e.kind === 'bomb') e.drawShadow(ctx);
    for (const e of this.enemies) if (e.kind !== 'bomb') e.draw(ctx);
    for (const e of this.enemies) if (e.kind === 'bomb') e.draw(ctx);

    if (play) this.drawPlayerEntity(ctx);
    this.drawBullets(ctx);
    this.drawParticles(ctx, false);
    ctx.restore();

    // Camada que não perde a cor: ponteiros, fogo e clarão do tiro.
    // Com WebGL ela vai para um canvas separado e o filtro de fase é feito no shader.
    let lc = ctx;
    if (octx) {
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.clearRect(0, 0, octx.canvas.width, octx.canvas.height);
      octx.setTransform(scale, 0, 0, scale, pw / 2, ph / 2);
      lc = octx;
    } else {
      this.applyFilters(ctx, w, h);
    }
    lc.save();
    this.applyCamera(lc);
    if (play) {
      for (const n of this.needles) this.drawNeedle(lc, n);
      this.drawMuzzle(lc);
    }
    this.drawParticles(lc, true);
    lc.restore();

    if (play && this.state === 'run') this.drawWarnings(lc, w);
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
    // sombra no chão
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
    drawPlayer(ctx, { phase: p.phase, air: !p.grounded || !p.alive, stopped: p.stopped && p.grounded, blink: p.blink });
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

  drawNeedle(ctx, n) {
    const tip = R + lerp(-78, 24, n.ext);
    const r0 = R - 900;
    const wd = 10;
    ctx.save();
    ctx.rotate(n.a + Math.PI / 2);
    ctx.fillStyle = n.style.color;
    ctx.beginPath();
    ctx.moveTo(-wd / 2, -r0);
    ctx.lineTo(-wd / 2, -(tip - 16));
    ctx.lineTo(0, -tip);
    ctx.lineTo(wd / 2, -(tip - 16));
    ctx.lineTo(wd / 2, -r0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = n.style.light;
    ctx.fillRect(-2.2, -(tip - 18), 2.6, tip - 18 - r0);
    if (n.ext > 0.75) {
      const k = (n.ext - 0.75) * 4 * (0.65 + Math.sin(n.pulse) * 0.35);
      const g = ctx.createRadialGradient(0, -tip + 6, 0, 0, -tip + 6, 22);
      g.addColorStop(0, n.style.glow);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.55 * k;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -tip + 6, 22, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawBullets(ctx) {
    for (const b of this.bullets) {
      const ang = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(-22, -1, 18, 2);
      ctx.fillStyle = '#262626';
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

  /** Aviso piscante na borda direita quando um míssil se aproxima. */
  drawWarnings(ctx, w) {
    const blink = Math.sin(this.time * 18) > -0.2;
    if (!blink) return;
    for (const e of this.enemies) {
      if (e.kind !== 'missile') continue;
      const d = e.rel();
      if (d < 0.5 || d > 1.05) continue;
      const x = w / 2 * 0.8;
      const drop = R - Math.sqrt(Math.max(0, R * R - x * x));
      const y = this.cam.anchorY + drop * 0.85 - e.alt - 16 + this.cam.lift * 0.6;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(214,43,30,0.92)';
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(17, 13);
      ctx.lineTo(-17, 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 20px "Crimson Text", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 3);
      ctx.restore();
    }
  }
}
