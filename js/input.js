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
