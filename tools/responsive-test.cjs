// Teste de responsividade: abre o jogo em vários tamanhos de tela (desktop,
// janela estreita, celulares em pé e deitados, tablet), captura as telas e
// confere se nada fica fora da área visível e se os toques funcionam.
// Uso: node tools/responsive-test.cjs [pasta-de-saida]  (com node tools/serve.mjs 8080)
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const URL = process.env.GAME_URL || 'http://localhost:8080/';
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'screenshots', 'responsivo'));
fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [
  { name: 'desktop-1920', viewport: { width: 1920, height: 1080 }, touch: false },
  { name: 'desktop-1280', viewport: { width: 1280, height: 720 }, touch: false },
  { name: 'janela-estreita', viewport: { width: 760, height: 900 }, touch: false },
  { name: 'celular-retrato', viewport: { width: 390, height: 844 }, touch: true, dpr: 3 },
  { name: 'celular-paisagem', viewport: { width: 844, height: 390 }, touch: true, dpr: 3 },
  { name: 'android-pequeno', viewport: { width: 360, height: 740 }, touch: true, dpr: 2 },
  { name: 'tablet-retrato', viewport: { width: 820, height: 1180 }, touch: true, dpr: 2 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Elementos visíveis que saem da tela. */
async function overflow(page, sel) {
  return page.evaluate((s) => {
    const root = document.querySelector(s);
    if (!root) return [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bad = [];
    // telas com rolagem: o conteúdo pode passar da altura, desde que dê para rolar até ele
    const scroller = root.scrollHeight > root.clientHeight + 2 && getComputedStyle(root).overflowY === 'auto';
    const top0 = root.getBoundingClientRect().top - root.scrollTop;
    for (const el of root.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      const outY = scroller ? r.top - top0 < -2 : r.top < -2 || r.bottom > vh + 2;
      if (r.left < -2 || r.right > vw + 2 || outY) {
        bad.push(`${el.tagName.toLowerCase()}.${el.className || ''} (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`);
      }
    }
    return bad.slice(0, 5);
  }, sel);
}

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let failures = 0;
  for (const d of DEVICES.filter((x) => !ONLY || ONLY.includes(x.name))) {
    const ctx = await browser.newContext({
      viewport: d.viewport,
      deviceScaleFactor: d.dpr || 1,
      isMobile: d.touch,
      hasTouch: d.touch,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(URL);
    await page.waitForFunction(() => window.__worldman && document.fonts.status === 'loaded');
    await sleep(600);
    const shot = (n) => page.screenshot({ path: path.join(OUT, `${d.name}-${n}.png`) });
    const problems = [];

    await shot('1-menu');
    problems.push(...(await overflow(page, '#screen-menu')).map((x) => `menu: ${x}`));

    const tap = (sel) => (d.touch ? page.tap(sel) : page.click(sel));
    await tap('#btn-controls');
    await sleep(700);
    await shot('2-controles');
    problems.push(...(await overflow(page, '#screen-controls')).map((x) => `controles: ${x}`));
    await tap('#screen-controls [data-back]');

    await tap('#btn-start');
    await page.evaluate(() => {
      const g = window.__worldman.game;
      g.__kill = g.killPlayer;
      g.killPlayer = () => {};
    });
    await sleep(900);
    await shot('3-jogo');
    problems.push(...(await overflow(page, '#hud')).map((x) => `hud: ${x}`));

    if (d.touch) {
      problems.push(...(await overflow(page, '#touch')).map((x) => `toque: ${x}`));
      // toque na metade direita (fora dos botões) pula
      const vw = d.viewport.width;
      const vh = d.viewport.height;
      await page.touchscreen.tap(vw * 0.62, vh * 0.45);
      const jumped = await page.waitForFunction(() => window.__worldman.game.player.h > 20, null, { timeout: 4000 }).then(() => true).catch(() => false);
      if (!jumped) problems.push('toque na metade direita não pulou');
      // botão Parar
      const before = await page.evaluate(() => window.__worldman.game.player.stops);
      const b = await (await page.$('.tbtn-stop')).boundingBox();
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      const stopped = await page
        .waitForFunction((n) => window.__worldman.game.player.stops === n - 1, before, { timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (!stopped) problems.push('botão Parar não funcionou');
    }

    await page.evaluate(() => {
      const g = window.__worldman.game;
      g.killPlayer = g.__kill;
      g.killPlayer('teste');
    });
    await page.waitForSelector('#screen-over:not([hidden])', { timeout: 20000 });
    await sleep(700);
    await shot('4-fim');
    problems.push(...(await overflow(page, '#screen-over')).map((x) => `fim: ${x}`));

    const all = [...problems, ...errors.map((e) => `erro: ${e}`)];
    if (all.length) failures++;
    console.log(`${d.name.padEnd(18)} ${all.length ? `PROBLEMAS\n  ${all.join('\n  ')}` : 'ok'}`);
    await ctx.close();
  }
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
