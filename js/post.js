// Pós-processamento: lente de barril (efeito "planeta redondo"), desfoque nas
// bordas, vinheta azulada e clarão. Usa WebGL; sem WebGL cai para Canvas 2D.

import { POST } from './config.js';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uAspect;
uniform float uOver;
uniform float uS0;
uniform float uK;
uniform float uBlur;
uniform float uVig;
uniform vec2 uTexel;
uniform vec4 uFlash;
uniform vec3 uVigColor;
uniform sampler2D uOverTex;
uniform float uUseOver;
uniform vec3 uFilt; // cinza, sépia, noite

vec3 tap(vec2 uv) { return texture2D(uTex, uv).rgb; }

vec3 phaseFilter(vec3 c) {
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, vec3(lum), clamp(uFilt.x, 0.0, 1.0));
  vec3 sep = vec3(lum * 1.08 + 0.05, lum * 0.86 + 0.02, lum * 0.58);
  c = mix(c, sep, uFilt.y * 0.9);
  c = mix(c, c * vec3(0.36, 0.46, 0.86) + vec3(0.0, 0.012, 0.05), uFilt.z);
  return c;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float r2 = dot(p, p);
  vec2 sp = p * (uS0 + uK * r2);
  vec2 uv = 0.5 + sp / (vec2(uAspect, 1.0) * uOver);
  uv = clamp(uv, uTexel, 1.0 - uTexel);

  float edge = smoothstep(0.16, 0.95, r2);
  vec2 d = uTexel * uBlur * edge;
  vec3 col = tap(uv) * 0.2;
  col += tap(uv + vec2( d.x, 0.0)) * 0.1;
  col += tap(uv + vec2(-d.x, 0.0)) * 0.1;
  col += tap(uv + vec2(0.0,  d.y)) * 0.1;
  col += tap(uv + vec2(0.0, -d.y)) * 0.1;
  col += tap(uv + d * 0.7071) * 0.1;
  col += tap(uv - d * 0.7071) * 0.1;
  col += tap(uv + vec2(d.x, -d.y) * 0.7071) * 0.1;
  col += tap(uv + vec2(-d.x, d.y) * 0.7071) * 0.1;

  col = phaseFilter(col);
  if (uUseOver > 0.5) {
    vec4 o = texture2D(uOverTex, uv);
    col = mix(col, o.rgb, o.a);
  }

  float v = smoothstep(0.22, 1.08, sqrt(r2) * 1.04);
  col = mix(col, uVigColor, v * uVig);
  col *= 1.0 + 0.06 * (1.0 - v);
  col = mix(col, uFlash.rgb, uFlash.a);
  gl_FragColor = vec4(col, 1.0);
}`;

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
    this.prog = prog;

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
    for (const n of [
      'uTex',
      'uAspect',
      'uOver',
      'uS0',
      'uK',
      'uBlur',
      'uVig',
      'uTexel',
      'uFlash',
      'uVigColor',
      'uOverTex',
      'uUseOver',
      'uFilt',
    ]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }
    gl.uniform1i(this.u.uTex, 0);
    gl.uniform1i(this.u.uOverTex, 1);
    /** Este pós-processamento aplica os filtros de fase e a camada colorida. */
    this.handlesFilters = true;
    this.lost = false;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.lost = true;
    });
  }

  render(scene, o) {
    if (this.lost) return;
    const gl = this.gl;
    const cv = gl.canvas;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.overTex);
    if (o.overlay) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.overlay);
    gl.uniform1f(this.u.uUseOver, o.overlay ? 1 : 0);
    const f = o.filters || { gray: 0, sepia: 0, night: 0 };
    gl.uniform3f(this.u.uFilt, f.gray, f.sepia, f.night);
    gl.uniform1f(this.u.uAspect, o.aspect);
    gl.uniform1f(this.u.uOver, o.overscan);
    gl.uniform1f(this.u.uS0, o.lens ? POST.s0 : 1);
    gl.uniform1f(this.u.uK, o.lens ? POST.k : 0);
    gl.uniform1f(this.u.uBlur, o.blur);
    gl.uniform1f(this.u.uVig, o.vignette);
    gl.uniform2f(this.u.uTexel, 1 / scene.width, 1 / scene.height);
    gl.uniform4f(this.u.uFlash, o.flash[0], o.flash[1], o.flash[2], o.flash[3]);
    gl.uniform3f(this.u.uVigColor, 0.05, 0.23, 0.33);
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
    const g = ctx.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.25, cv.width / 2, cv.height / 2, cv.width * 0.62);
    g.addColorStop(0, 'rgba(13,59,84,0)');
    g.addColorStop(1, `rgba(13,59,84,${0.85 * o.vignette})`);
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
