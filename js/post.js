// Pós-processamento: lente de barril (planeta redondo), desfoque nas bordas e os
// efeitos de cada época (filme antigo, TV de tubo, alta definição, neon, digital,
// apocalipse). Usa WebGL; sem WebGL cai para Canvas 2D.

import { POST } from './config.js';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTex;
uniform sampler2D uOverTex;
uniform float uUseOver;
uniform float uAspect;
uniform float uOver;
uniform float uS0;
uniform float uK;
uniform float uBlur;
uniform float uVig;
uniform vec2 uTexel;
uniform vec4 uFlash;
uniform vec3 uVigColor;
uniform vec3 uTint;
uniform float uGray;
uniform float uSepia;
uniform float uGrain;
uniform float uScan;
uniform float uScanPeriod;
uniform float uChroma;
uniform float uCrt;
uniform float uBloom;
uniform float uSat;
uniform float uContrast;
uniform float uBright;
uniform float uDust;
uniform float uTime;
uniform vec2 uJitter;
uniform vec4 uScratch;
uniform float uNorm;  // menor lado da tela (1 em paisagem; a proporção em retrato)
uniform float uVigY;  // achata a vinheta na vertical em retrato
uniform float uR2Max; // limita a lente para não amostrar fora da cena

vec3 tap(vec2 uv) { return texture2D(uTex, uv).rgb; }

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float r2 = min(dot(p, p) / (uNorm * uNorm), uR2Max);
  vec2 sp = p * (uS0 + uK * r2);
  vec2 uv = 0.5 + sp / (vec2(uAspect, 1.0) * uOver) + uJitter;
  uv = clamp(uv, uTexel, 1.0 - uTexel);
  vec2 vq = vec2(p.x / uNorm, p.y / (uNorm * uVigY));
  float vr2 = dot(vq, vq);

  // desfoque nas bordas
  float edge = smoothstep(0.16, 0.95, vr2);
  vec2 d = uTexel * uBlur * edge;
  vec3 c0 = tap(uv);
  if (uChroma > 0.001) {
    vec2 ca = vec2(uTexel.x * 2.6 * uChroma * (0.5 + vr2), 0.0);
    c0.r = mix(c0.r, tap(uv + ca).r, 0.9);
    c0.b = mix(c0.b, tap(uv - ca).b, 0.9);
  }
  vec3 col = c0 * 0.2;
  col += tap(uv + vec2( d.x, 0.0)) * 0.1;
  col += tap(uv + vec2(-d.x, 0.0)) * 0.1;
  col += tap(uv + vec2(0.0,  d.y)) * 0.1;
  col += tap(uv + vec2(0.0, -d.y)) * 0.1;
  col += tap(uv + d * 0.7071) * 0.1;
  col += tap(uv - d * 0.7071) * 0.1;
  col += tap(uv + vec2(d.x, -d.y) * 0.7071) * 0.1;
  col += tap(uv + vec2(-d.x, d.y) * 0.7071) * 0.1;

  // brilho (bloom) das partes claras: neon e digital
  if (uBloom > 0.001) {
    vec3 b = vec3(0.0);
    vec2 o1 = uTexel * 6.0;
    vec2 o2 = uTexel * 14.0;
    b += max(tap(uv + vec2(o1.x, 0.0)) - 0.5, 0.0);
    b += max(tap(uv - vec2(o1.x, 0.0)) - 0.5, 0.0);
    b += max(tap(uv + vec2(0.0, o1.y)) - 0.5, 0.0);
    b += max(tap(uv - vec2(0.0, o1.y)) - 0.5, 0.0);
    b += max(tap(uv + o2 * 0.7071) - 0.5, 0.0);
    b += max(tap(uv - o2 * 0.7071) - 0.5, 0.0);
    b += max(tap(uv + vec2(o2.x, -o2.y) * 0.7071) - 0.5, 0.0);
    b += max(tap(uv + vec2(-o2.x, o2.y) * 0.7071) - 0.5, 0.0);
    col += b * (uBloom * 0.3);
  }

  // filtro da época (cinza, sépia) antes da camada colorida
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(lum), clamp(uGray, 0.0, 1.0));
  vec3 sep = vec3(lum * 1.08 + 0.05, lum * 0.86 + 0.02, lum * 0.58);
  col = mix(col, sep, uSepia * 0.9);

  if (uUseOver > 0.5) {
    vec4 o = texture2D(uOverTex, uv);
    col = mix(col, o.rgb, o.a);
  }

  // cor geral
  col = (col - 0.5) * uContrast + 0.5;
  float l2 = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l2), col, uSat);
  col *= uTint * uBright;

  // riscos e poeira de filme antigo
  if (uScratch.y > 0.0) col *= 1.0 - 0.55 * uScratch.y * (1.0 - smoothstep(0.0, 0.0014, abs(vUv.x - uScratch.x)));
  if (uScratch.w > 0.0) col += 0.32 * uScratch.w * (1.0 - smoothstep(0.0, 0.001, abs(vUv.x - uScratch.z)));
  if (uDust > 0.001) {
    float dn = hash(floor(vUv * vec2(320.0, 180.0)) + floor(uTime * 12.0) * 7.13);
    col *= 1.0 - step(1.0 - 0.0016 * uDust, dn) * 0.7;
  }

  // TV de tubo: linhas de varredura, faixa rolando e cantos arredondados
  if (uScan > 0.001) {
    float line = 0.5 + 0.5 * cos(gl_FragCoord.y * 6.2831853 / uScanPeriod);
    col *= 1.0 - uScan * 0.2 * line;
    float roll = fract(vUv.y * 0.6 - uTime * 0.08);
    col += uScan * 0.035 * smoothstep(0.0, 0.05, roll) * (1.0 - smoothstep(0.05, 0.12, roll));
  }
  if (uCrt > 0.001) {
    vec2 q = abs(vUv - 0.5) * 2.0;
    float rr = length(max(q - vec2(0.84, 0.76), 0.0)) / 0.2;
    col *= 1.0 - uCrt * smoothstep(0.45, 1.0, rr);
  }

  // grão
  if (uGrain > 0.001) {
    float g = hash(floor(gl_FragCoord.xy / 1.6) + fract(uTime * 7.31) * 113.0) - 0.5;
    col += g * uGrain;
  }

  float v = smoothstep(0.22, 1.08, sqrt(vr2) * 1.04);
  col = mix(col, uVigColor, clamp(v * uVig, 0.0, 1.0));
  col = mix(col, uFlash.rgb, uFlash.a);
  gl_FragColor = vec4(col, 1.0);
}`;

const UNIFORMS = [
  'uTex', 'uOverTex', 'uUseOver', 'uAspect', 'uOver', 'uS0', 'uK', 'uBlur', 'uVig', 'uTexel', 'uFlash', 'uVigColor', 'uTint',
  'uGray', 'uSepia', 'uGrain', 'uScan', 'uScanPeriod', 'uChroma', 'uCrt', 'uBloom', 'uSat', 'uContrast', 'uBright', 'uDust',
  'uTime', 'uJitter', 'uScratch', 'uNorm', 'uVigY', 'uR2Max',
];

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader: ${log}`);
  }
  return sh;
}

/** Efeitos que mudam a cada quadro (cintilação, riscos, trepidação do filme). */
class FilmState {
  constructor() {
    this.t = 0;
    this.nextScratch = 0;
    this.scratch = [0, 0, 0, 0];
    this.jitter = [0, 0];
    this.bright = 1;
  }
  step(dt, fx) {
    this.t += dt;
    this.nextScratch -= dt;
    if (this.nextScratch <= 0) {
      this.nextScratch = 0.06 + Math.random() * 0.12;
      const s = fx.scratch || 0;
      this.scratch = [
        Math.random(),
        Math.random() < 0.55 * s ? 0.5 + Math.random() * 0.5 : 0,
        Math.random(),
        Math.random() < 0.35 * s ? 0.4 + Math.random() * 0.6 : 0,
      ];
    }
    const j = fx.jitter || 0;
    if (Math.random() < 0.5) this.jitter = [(Math.random() - 0.5) * 0.0016 * j, (Math.random() - 0.5) * 0.0032 * j];
    this.bright = 1 + (Math.random() - 0.5) * 2 * (fx.flicker || 0);
  }
}

class GLPost {
  constructor(canvas) {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL indisponível');
    this.gl = gl;
    this.canvas = canvas;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const makeTex = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.tex = makeTex();
    this.overTex = makeTex();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    this.u = {};
    for (const n of UNIFORMS) this.u[n] = gl.getUniformLocation(prog, n);
    gl.uniform1i(this.u.uTex, 0);
    gl.uniform1i(this.u.uOverTex, 1);
    /** Este pós-processamento aplica os filtros de época e a camada colorida. */
    this.handlesFilters = true;
    this.film = new FilmState();
    this.lost = false;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.lost = true;
    });
  }

  render(scene, o) {
    if (this.lost) return;
    const gl = this.gl;
    const u = this.u;
    const cv = gl.canvas;
    const fx = o.fx;
    this.film.step(o.dt || 0, fx);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.overTex);
    if (o.overlay) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.overlay);
    gl.uniform1f(u.uUseOver, o.overlay ? 1 : 0);
    gl.uniform1f(u.uAspect, o.aspect);
    const norm = Math.min(o.aspect, 1);
    gl.uniform1f(u.uNorm, norm);
    gl.uniform1f(u.uVigY, o.aspect < 1 ? 0.56 / o.aspect : 1);
    gl.uniform1f(u.uR2Max, o.aspect < 1 ? 0.85 : 1.25);
    gl.uniform1f(u.uOver, o.overscan);
    gl.uniform1f(u.uS0, o.lens ? POST.s0 : 1);
    gl.uniform1f(u.uK, o.lens ? POST.k : 0);
    gl.uniform1f(u.uBlur, o.blur * (fx.blur || 1));
    gl.uniform1f(u.uVig, fx.vig);
    gl.uniform2f(u.uTexel, 1 / scene.width, 1 / scene.height);
    gl.uniform4f(u.uFlash, o.flash[0], o.flash[1], o.flash[2], o.flash[3]);
    gl.uniform3f(u.uVigColor, fx.vigColor[0], fx.vigColor[1], fx.vigColor[2]);
    gl.uniform3f(u.uTint, fx.tint[0], fx.tint[1], fx.tint[2]);
    gl.uniform1f(u.uGray, fx.gray);
    gl.uniform1f(u.uSepia, fx.sepia);
    gl.uniform1f(u.uGrain, fx.grain);
    gl.uniform1f(u.uScan, fx.scan);
    gl.uniform1f(u.uScanPeriod, Math.max(2, 3 * (o.dpr || 1)));
    gl.uniform1f(u.uChroma, fx.chroma);
    gl.uniform1f(u.uCrt, fx.crt);
    gl.uniform1f(u.uBloom, o.lowQuality ? 0 : fx.bloom);
    gl.uniform1f(u.uSat, fx.sat);
    gl.uniform1f(u.uContrast, fx.contrast);
    gl.uniform1f(u.uBright, this.film.bright);
    gl.uniform1f(u.uDust, fx.dust || 0);
    gl.uniform1f(u.uTime, this.film.t);
    gl.uniform2f(u.uJitter, this.film.jitter[0], this.film.jitter[1]);
    const s = this.film.scratch;
    gl.uniform4f(u.uScratch, s[0], s[1], s[2], s[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

class CanvasPost {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }
  render(scene, o) {
    const ctx = this.ctx;
    const cv = ctx.canvas;
    const sw = scene.width / o.overscan;
    const sh = scene.height / o.overscan;
    const zoom = o.lens ? 1 / POST.s0 : 1;
    const cw = sw / zoom;
    const ch = sh / zoom;
    ctx.drawImage(scene, (scene.width - cw) / 2, (scene.height - ch) / 2, cw, ch, 0, 0, cv.width, cv.height);
    const fx = o.fx;
    const c = fx.vigColor.map((v) => Math.round(v * 255));
    const g = ctx.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.25, cv.width / 2, cv.height / 2, cv.width * 0.62);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},${0.85 * fx.vig})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cv.width, cv.height);
    if (o.flash[3] > 0) {
      ctx.fillStyle = `rgba(${o.flash[0] * 255},${o.flash[1] * 255},${o.flash[2] * 255},${o.flash[3]})`;
      ctx.fillRect(0, 0, cv.width, cv.height);
    }
  }
}

export function createPost(canvas) {
  try {
    const p = new GLPost(canvas);
    p.kind = 'webgl';
    return p;
  } catch (err) {
    console.warn('[WorldMan] Usando renderização sem WebGL:', err.message);
    // Um canvas que já recebeu contexto WebGL não aceita contexto 2D: troca por um novo.
    const fresh = canvas.cloneNode(false);
    canvas.replaceWith(fresh);
    const p = new CanvasPost(fresh);
    p.kind = '2d';
    return p;
  }
}
