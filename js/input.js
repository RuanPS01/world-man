// Entrada: teclado, botões de toque e gamepad, unificados em ações.

const KEYMAP = {
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowLeft: 'stop',
  KeyA: 'stop',
  KeyX: 'shoot',
  KeyJ: 'shoot',
  KeyP: 'pause',
  Escape: 'pause',
};

const ACTIONS = ['jump', 'stop', 'shoot', 'pause'];

export class Input {
  constructor() {
    this.held = {};
    this.pressed = {};
    this.sources = {};
    for (const a of ACTIONS) {
      this.held[a] = false;
      this.pressed[a] = false;
      this.sources[a] = new Set();
    }
    this.enabled = true;
    this.gpPrev = {};
    this.onAction = null;
  }

  press(action, source) {
    const set = this.sources[action];
    if (!set) return;
    if (set.size === 0) {
      this.pressed[action] = true;
      this.onAction?.(action);
    }
    set.add(source);
    this.held[action] = true;
  }

  release(action, source) {
    const set = this.sources[action];
    if (!set) return;
    set.delete(source);
    this.held[action] = set.size > 0;
  }

  releaseAll() {
    this.releaseTouch?.();
    for (const a of ACTIONS) {
      this.sources[a].clear();
      this.held[a] = false;
    }
  }

  /** Limpa os "apertos" do quadro. Chamar depois de cada atualização. */
  endFrame() {
    for (const a of ACTIONS) this.pressed[a] = false;
  }

  bindKeyboard(target = window) {
    target.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      const el = document.activeElement;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
      if (typing) return;
      if (!this.enabled && action !== 'pause') return;
      e.preventDefault();
      if (e.repeat) return;
      this.press(action, `k:${e.code}`);
    });
    target.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      this.release(action, `k:${e.code}`);
    });
    window.addEventListener('blur', () => this.releaseAll());
  }

  bindButton(el, action) {
    const id = `t:${action}`;
    const down = (e) => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('is-down');
      this.press(action, `${id}:${e.pointerId}`);
    };
    const up = (e) => {
      el.classList.remove('is-down');
      this.release(action, `${id}:${e.pointerId}`);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Controles de toque. A camada inteira recebe os dedos e cada dedo "acende"
   * o botão mais próximo, então dá para deslizar de um botão para outro
   * (por exemplo, de Atirar para Parar) sem tirar o dedo da tela. Um toque
   * fora dos botões na metade direita da tela também pula.
   */
  bindTouchPad(layer, buttons) {
    const ptrs = new Map();
    const src = (id) => `tp:${id}`;
    const refresh = () => {
      const active = new Set(ptrs.values());
      for (const b of buttons) b.el.classList.toggle('is-down', active.has(b.action));
    };
    const hit = (x, y) => {
      let best = null;
      let bestK = Infinity;
      for (const b of buttons) {
        const r = b.el.getBoundingClientRect();
        if (!r.width) continue;
        const rad = (r.width / 2) * 1.3;
        const k = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) / rad;
        if (k < 1 && k < bestK) {
          bestK = k;
          best = b.action;
        }
      }
      return best;
    };
    const set = (id, act) => {
      const prev = ptrs.get(id) || null;
      if (prev === act) return;
      if (prev) this.release(prev, src(id));
      if (act) this.press(act, src(id));
      ptrs.set(id, act);
      refresh();
    };
    const end = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      set(e.pointerId, null);
      ptrs.delete(e.pointerId);
      refresh();
    };
    layer.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      try {
        layer.setPointerCapture(e.pointerId);
      } catch {
        /* alguns navegadores não deixam capturar */
      }
      let act = hit(e.clientX, e.clientY);
      if (!act) {
        const r = layer.getBoundingClientRect();
        if (e.clientX > r.left + r.width * 0.5) act = 'jump';
      }
      set(e.pointerId, act);
    });
    layer.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      // o dedo continua valendo para o último botão até encostar em outro
      const act = hit(e.clientX, e.clientY);
      if (act) set(e.pointerId, act);
    });
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);
    layer.addEventListener('lostpointercapture', end);
    layer.addEventListener('contextmenu', (e) => e.preventDefault());
    this.releaseTouch = () => {
      for (const id of [...ptrs.keys()]) {
        set(id, null);
        ptrs.delete(id);
      }
      refresh();
    };
  }

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && [...pads].find((p) => p && p.connected);
    if (!pad) return;
    const b = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
    const ax = pad.axes || [];
    const state = {
      jump: b(0) || b(12) || (ax[1] ?? 0) < -0.6,
      stop: b(1) || b(14) || (ax[0] ?? 0) < -0.6,
      shoot: b(2) || b(5) || b(7),
      pause: b(9),
    };
    for (const a of ACTIONS) {
      if (state[a] && !this.gpPrev[a]) this.press(a, 'gp');
      if (!state[a] && this.gpPrev[a]) this.release(a, 'gp');
      this.gpPrev[a] = state[a];
    }
  }
}
