// Monta a pasta que vai para o GitHub Pages: node tools/build-site.mjs [_site]
//
// Copia só os arquivos do jogo (sem ferramentas, testes ou README) e carimba a
// versão do service worker com o commit, para os jogadores receberem cada
// atualização sem precisar mudar a versão à mão.

import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, process.argv[2] || '_site');
const INCLUDE = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets'];

if (out === root) {
  console.error('A pasta de saída não pode ser a raiz do projeto.');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const item of INCLUDE) {
  const src = join(root, item);
  if (!existsSync(src)) {
    console.error(`Arquivo obrigatório não encontrado: ${item}`);
    process.exit(1);
  }
  cpSync(src, join(out, item), { recursive: true });
}

// carimbo de versão no service worker
const build = (process.env.GITHUB_SHA || Date.now().toString(36)).slice(0, 7);
const swPath = join(out, 'sw.js');
const sw = readFileSync(swPath, 'utf8');
const stamped = sw.replace(/const VERSION = '([^']+)';/, (_, v) => `const VERSION = '${v}+${build}';`);
if (stamped === sw) {
  console.error('Não encontrei a constante VERSION no sw.js.');
  process.exit(1);
}
writeFileSync(swPath, stamped);

// resumo
let files = 0;
let bytes = 0;
const count = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) count(p);
    else {
      files += 1;
      bytes += st.size;
    }
  }
};
count(out);
console.log(`Site montado em ${out}: ${files} arquivos, ${(bytes / 1024 / 1024).toFixed(1)} MB, versão ${build}.`);
