// Inimigos: balão, avião, foguete, míssil e bombas.
// Todos vivem em coordenadas polares do planeta: ângulo `a` e altitude `alt`.

import { PLANET } from './config.js';
import { drawSprite } from './sprites.js';
import { polar, rand, wrapAngle, chance, clamp } from './utils.js';

const R = PLANET.R;

class Enemy {
  constructor(game, a, alt) {
    this.game = game;
    this.a = a;
    this.alt = alt;
    this.alive = true;
    this.hp = 1;
    this.radius = 20;
    this.hitT = 0;
    this.t = rand(0, 10);
    this.targetable = true;
    this.kind = 'enemy';
  }
  /** Distância angular até o jogador (positivo = à frente). */
  rel() {
    return wrapAngle(this.a - this.game.player.a);
  }
  centerAlt() {
    return this.alt;
  }
  center() {
    return polar(this.a, R + this.centerAlt());
  }
  damage(n = 1) {
    this.hp -= n;
    this.hitT = 0.12;
    if (this.hp <= 0) this.destroy();
  }
  destroy() {
    if (!this.alive) return;
    this.alive = false;
    const c = this.center();
    this.game.explode(c.x, c.y, this.explosionSize || 1, this.debris || ['#888', '#555']);
  }
  update(dt) {
    this.t += dt;
    this.hitT = Math.max(0, this.hitT - dt);
    // remove quando fica muito longe do jogador
    const d = this.rel();
    if (d < -1.25 || d > 1.6) this.alive = false;
  }
  /** Retorna true se encosta no jogador. */
  touchesPlayer(pc) {
    const c = this.center();
    const r = this.radius * 0.85;
    for (const p of pc) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      if (dx * dx + dy * dy < (r + p.r) * (r + p.r)) return true;
    }
    return false;
  }
  frame(ctx, alt, fn) {
    ctx.save();
    ctx.rotate(this.a + Math.PI / 2);
    ctx.translate(0, -(R + alt));
    if (this.hitT > 0) {
      const k = 1 + this.hitT * 0.8;
      ctx.scale(k, k);
    }
    fn();
    ctx.restore();
  }
}

export class Balloon extends Enemy {
  constructor(game, a) {
    super(game, a, rand(175, 235));
    this.hp = 3;
    this.radius = 58;
    this.wa = rand(-0.012, 0.012);
    this.dropCd = rand(0.5, 1.5);
    this.debris = ['#d72b27', '#9e1717', '#8b5a2b', '#d58f3e'];
    this.explosionSize = 1.5;
    this.kind = 'balloon';
  }
  centerAlt() {
    return this.alt + 105 + Math.sin(this.t * 1.3) * 6;
  }
  update(dt) {
    super.update(dt);
    this.a += this.wa * dt;
    this.dropCd -= dt;
    const g = this.game;
    const d = this.rel();
    if (g.level >= 1 && this.dropCd <= 0 && d > 0.07 && d < 0.27) {
      g.addBomb(this.a, this.alt + Math.sin(this.t * 1.3) * 6, 0, this.wa);
      this.dropCd = rand(2.0, 3.4);
    }
  }
  draw(ctx) {
    const bob = Math.sin(this.t * 1.3) * 6;
    this.frame(ctx, this.alt + bob, () => {
      ctx.rotate(Math.sin(this.t * 0.9) * 0.05);
      drawSprite(ctx, this.game.S.balloon, 0, 0);
    });
  }
}

export class Plane extends Enemy {
  constructor(game, a, fromFront) {
    super(game, a, rand(205, 255));
    this.hp = 3;
    this.radius = 46;
    const run = game.runOmega;
    this.wa = fromFront ? -rand(0.1, 0.16) : run + rand(0.22, 0.3);
    this.dropCd = rand(0.2, 0.6);
    this.debris = ['#a6934d', '#7f7035', '#3b3b3b', '#c4302b'];
    this.explosionSize = 1.4;
    this.kind = 'plane';
  }
  centerAlt() {
    return this.alt + Math.sin(this.t * 2.1) * 8;
  }
  update(dt) {
    super.update(dt);
    this.a += this.wa * dt;
    this.dropCd -= dt;
    const d = this.rel();
    if (this.dropCd <= 0 && d > 0.03 && d < 0.32) {
      this.game.addBomb(this.a, this.centerAlt() - 20, -40, this.wa * 0.45);
      this.dropCd = rand(1.0, 1.6);
    }
  }
  draw(ctx) {
    const flip = this.wa > 0;
    this.frame(ctx, this.centerAlt(), () => {
      ctx.rotate(Math.sin(this.t * 2.1 + 1) * 0.06 * (flip ? -1 : 1));
      drawSprite(ctx, this.game.S.plane, 0, 0, 1, flip);
      // hélice girando
      const sx = flip ? 60 : -60;
      ctx.fillStyle = 'rgba(40,40,40,0.55)';
      ctx.beginPath();
      ctx.ellipse(sx + (flip ? 2 : -2), -7, 2.5, 4 + Math.abs(Math.sin(this.t * 45)) * 16, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

export class Rocket extends Enemy {
  constructor(game, a) {
    super(game, a, 0);
    this.hp = 2;
    this.radius = 30;
    this.state = 'idle';
    this.valt = 0;
    this.acc = rand(480, 560);
    this.launchAt = game.level >= 1 && chance(0.5) ? rand(0.07, 0.14) : rand(0.2, 0.36);
    this.timer = 0;
    this.tilt = 0;
    this.tiltV = rand(-0.08, 0.08);
    this.wa = 0;
    this.debris = ['#f4f4f2', '#d6322b', '#8e979c', '#5fb1c3'];
    this.explosionSize = 1.4;
    this.kind = 'rocket';
    this.smokeT = 0;
  }
  centerAlt() {
    return this.alt + 62;
  }
  update(dt) {
    this.t += dt;
    this.hitT = Math.max(0, this.hitT - dt);
    this.timer += dt;
    const g = this.game;
    const d = this.rel();
    this.smokeT -= dt;
    if (this.state === 'idle') {
      if (this.smokeT <= 0) {
        this.smokeT = 0.18;
        g.smokePuff(this.a + rand(-0.008, 0.008), rand(2, 10), rand(8, 14), 0.9);
      }
      if (d < this.launchAt || this.timer > 6) {
        this.state = 'fly';
        g.sfx('rocket');
        for (let i = 0; i < 10; i++) g.smokePuff(this.a + rand(-0.03, 0.03), rand(0, 8), rand(14, 26), 1.6);
      }
    } else {
      this.valt += this.acc * dt;
      this.alt += this.valt * dt;
      this.tilt += this.tiltV * dt;
      this.a += Math.sin(this.tilt) * (this.valt / (R + this.alt)) * dt;
      if (this.smokeT <= 0 && this.alt < 600) {
        this.smokeT = 0.05;
        g.smokePuff(this.a, this.alt - 6, rand(7, 12), 0.7);
      }
      if (this.alt > 1700) this.alive = false;
    }
    if (d < -1.25 || d > 1.6) this.alive = false;
  }
  touchesPlayer(_pc) {
    const p = this.game.player;
    const d = Math.abs(this.rel()) * R;
    if (d > 16 + 10) return false;
    const pb = p.h;
    const pt = p.h + 50;
    return pt > this.alt + 6 && pb < this.alt + 118;
  }
  draw(ctx) {
    const shake = this.state === 'idle' ? Math.sin(this.t * 60) * 0.6 : 0;
    this.frame(ctx, this.alt, () => {
      ctx.rotate(this.tilt);
      ctx.translate(shake, 0);
      if (this.state === 'fly') {
        const f = 22 + Math.random() * 16;
        const grd = ctx.createLinearGradient(0, 0, 0, f);
        grd.addColorStop(0, '#fff3a0');
        grd.addColorStop(0.4, '#ffb22e');
        grd.addColorStop(1, 'rgba(255,90,20,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(-9, -2);
        ctx.quadraticCurveTo(0, f * 1.4, 9, -2);
        ctx.closePath();
        ctx.fill();
      }
      drawSprite(ctx, this.game.S.rocket, 0, 0);
    });
  }
}

export class Missile extends Enemy {
  constructor(game, a, high) {
    super(game, a, high ? 47 : 17);
    this.hp = 1;
    this.radius = 15;
    this.wa = -(0.2 + Math.min(game.level, 6) * 0.025);
    this.debris = ['#979ea4', '#ecebe6', '#4b5156'];
    this.explosionSize = 0.9;
    this.kind = 'missile';
    this.smokeT = 0;
  }
  update(dt) {
    super.update(dt);
    this.a += this.wa * dt;
    this.smokeT -= dt;
    if (this.smokeT <= 0 && Math.abs(this.rel()) < 0.75) {
      this.smokeT = 0.04;
      const back = this.a + 26 / R;
      this.game.smokePuff(back, this.alt, rand(4, 7), 0.45);
    }
  }
  touchesPlayer(pc) {
    const c = this.center();
    for (const p of pc) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      if (dx * dx + dy * dy < (9 + p.r) * (9 + p.r)) return true;
    }
    return false;
  }
  draw(ctx) {
    this.frame(ctx, this.alt, () => {
      ctx.fillStyle = '#ffb22e';
      ctx.beginPath();
      ctx.ellipse(31 + Math.random() * 3, 0, 7 + Math.random() * 3, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(ctx, this.game.S.missile, 0, 0);
    });
  }
}

export class Bomb extends Enemy {
  constructor(game, a, alt, valt, wa) {
    super(game, a, alt);
    this.valt = valt;
    this.wa = wa;
    this.radius = 11;
    this.hp = 1;
    this.debris = ['#2a2a2c', '#4a4a4e'];
    this.explosionSize = 0.8;
    this.kind = 'bomb';
    this.g = 640;
  }
  centerAlt() {
    return this.alt;
  }
  /** Ângulo onde a bomba vai cair (para desenhar a sombra no chão). */
  landing() {
    const a2 = 0.5 * this.g;
    const disc = this.valt * this.valt + 4 * a2 * this.alt;
    const t = (this.valt + Math.sqrt(Math.max(0, disc))) / (2 * a2);
    return { a: this.a + this.wa * t, t };
  }
  update(dt) {
    this.t += dt;
    this.valt -= this.g * dt;
    this.alt += this.valt * dt;
    this.a += this.wa * dt;
    if (this.alt <= 4) {
      this.alive = false;
      const g = this.game;
      const c = polar(this.a, R + 6);
      g.explode(c.x, c.y, 1.1, this.debris, true);
      const p = g.player;
      if (p.alive && Math.abs(wrapAngle(this.a - p.a)) * R < 48 && p.h < 44) g.killPlayer('bomba');
    }
    const d = this.rel();
    if (d < -1.25 || d > 1.6) this.alive = false;
  }
  drawShadow(ctx) {
    const L = this.landing();
    const k = clamp(1 - this.alt / 320, 0.15, 1);
    ctx.save();
    ctx.rotate(L.a + Math.PI / 2);
    ctx.translate(0, -R - 4);
    ctx.fillStyle = `rgba(30,20,10,${0.18 + k * 0.32})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 + k * 18, 3 + k * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  draw(ctx) {
    this.frame(ctx, this.alt, () => {
      ctx.rotate(Math.sin(this.t * 7) * 0.25);
      drawSprite(ctx, this.game.S.bomb, 0, 0);
      if (Math.sin(this.t * 40) > 0) {
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath();
        ctx.arc(6, -16, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}
