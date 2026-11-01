// Persistência local (nome do personagem, ranking e preferências).

const NS = 'worldman.';

export const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

const MAX_ENTRIES = 10;

function sanitize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e.name === 'string' && Number.isFinite(e.time))
    .map((e) => ({ name: e.name.slice(0, 18), time: Math.max(0, Math.floor(e.time)), date: e.date || 0 }))
    .sort((a, b) => b.time - a.time || a.date - b.date)
    .slice(0, MAX_ENTRIES);
}

/** Lê o ranking salvo (botão "Carregar"). */
export function loadRanking() {
  return sanitize(store.get('ranking', []));
}

/** Salva uma partida no ranking (botão "Salvar"). Retorna { ok, list, position }. */
export function saveScore(name, time) {
  const entry = { name: (name || 'WorldMan').slice(0, 18), time: Math.floor(time), date: Date.now() };
  const list = sanitize([...loadRanking(), entry]);
  const ok = store.set('ranking', list);
  const position = list.findIndex((e) => e.date === entry.date) + 1;
  return { ok, list, position };
}
