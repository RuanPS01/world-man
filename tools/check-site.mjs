// Verificações rápidas antes de publicar, sem dependências: node tools/check-site.mjs
//
// 1. Sintaxe de todos os arquivos JavaScript.
// 2. Imports entre os módulos apontam para arquivos que existem.
// 3. Manifesto do PWA válido e com ícones existentes.
// 4. Lista do service worker: todo arquivo listado existe e todo arquivo do
//    jogo está na lista (senão ele não funcionaria offline).
// 5. Nenhum caminho absoluto ("/js/...") que quebraria no endereço do
//    GitHub Pages, que fica numa subpasta (usuario.github.io/world-man/).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const errors = [];
const rel = (p) => relative(root, p).split(sep).join('/');
const read = (p) => readFileSync(join(root, p), 'utf8');

function walk(dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const name of readdirSync(abs)) {
    const p = join(abs, name);
    if (statSync(p).isDirectory()) out.push(...walk(rel(p)));
    else out.push(rel(p));
  }
  return out;
}

// 1. sintaxe (o tipo é informado explicitamente: a detecção automática do
//    Node deixa passar erros em módulos)
const scripts = [...walk('js'), ...walk('tools'), 'sw.js'].filter((f) => /\.(m|c)?js$/.test(f));
for (const f of scripts) {
  const isModule = f.endsWith('.mjs') || f.startsWith('js/');
  try {
    execFileSync(process.execPath, [`--input-type=${isModule ? 'module' : 'commonjs'}`, '--check'], {
      input: read(f),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    errors.push(`sintaxe inválida em ${f}:\n${String(err.stderr || err.message).trim().split('\n').slice(0, 4).join('\n')}`);
  }
}

// 2. imports entre módulos
for (const f of walk('js').filter((x) => x.endsWith('.js'))) {
  const src = read(f);
  for (const m of src.matchAll(/(?:from\s+|import\s*\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const target = join(root, dirname(f), m[1]);
    if (!existsSync(target)) errors.push(`${f} importa "${m[1]}", que não existe`);
  }
}

// 3. manifesto
let manifest = null;
try {
  manifest = JSON.parse(read('manifest.webmanifest'));
} catch (err) {
  errors.push(`manifest.webmanifest não é um JSON válido: ${err.message}`);
}
if (manifest) {
  for (const k of ['name', 'short_name', 'start_url', 'display', 'icons']) {
    if (!manifest[k]) errors.push(`manifest.webmanifest sem o campo "${k}"`);
  }
  for (const icon of manifest.icons || []) {
    if (!existsSync(join(root, icon.src))) errors.push(`ícone do manifesto não encontrado: ${icon.src}`);
  }
}

// 4. lista do service worker
const sw = read('sw.js');
const listed = new Set([...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean));
for (const f of listed) {
  if (!existsSync(join(root, f))) errors.push(`sw.js lista "${f}", que não existe`);
}
const runtime = ['index.html', 'manifest.webmanifest', ...walk('css'), ...walk('js'), ...walk('assets')].filter(
  (f) => !/\.(txt|md)$/i.test(f),
);
for (const f of runtime) {
  if (!listed.has(f)) errors.push(`"${f}" não está na lista do sw.js (não funcionaria offline)`);
}
if (!/const VERSION = '[^']+';/.test(sw)) errors.push('sw.js sem a constante VERSION');

// 5. caminhos absolutos
const absolute = /(?:src|href)\s*=\s*["']\/(?!\/)|url\(\s*['"]?\/(?!\/)|(?:fetch|import)\(\s*['"]\/(?!\/)|register\(\s*['"]\/(?!\/)/;
for (const f of ['index.html', 'sw.js', ...walk('css'), ...walk('js')]) {
  read(f)
    .split('\n')
    .forEach((line, i) => {
      if (absolute.test(line)) errors.push(`${f}:${i + 1} usa caminho absoluto, que quebra no GitHub Pages: ${line.trim()}`);
    });
}

if (errors.length) {
  console.error(`Encontrei ${errors.length} problema(s):\n`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`Tudo certo: ${scripts.length} scripts, ${listed.size} arquivos no service worker, manifesto e caminhos ok.`);
