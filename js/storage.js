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

/** Lê o ranking salvo neste aparelho (é carregado automaticamente). */
export function loadRanking() {
  return sanitize(store.get('ranking', []));
}

/**
 * Registra uma partida no ranking (chamado automaticamente no fim de jogo).
 * Retorna { ok, list, position, entry }; position é 0 se ficou fora do top 10.
 */
export function saveScore(name, time) {
  const entry = { name: (name || 'WorldMan').slice(0, 18), time: Math.floor(time), date: Date.now() };
  const list = sanitize([...loadRanking(), entry]);
  const ok = store.set('ranking', list);
  const position = list.findIndex((e) => e.date === entry.date && e.time === entry.time) + 1;
  return { ok, list, position, entry };
}

const pad = (n) => String(n).padStart(2, '0');

/** Data e hora de um registro no formato "02/11/2026 15:42" (horário local). */
export function formatDate(ms) {
  if (!ms) return 'sem data';
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return 'sem data';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
