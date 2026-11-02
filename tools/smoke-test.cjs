// Teste de fumaça: abre o jogo no Chromium, navega pelas telas, joga alguns
// segundos e salva capturas. Uso: node tools/smoke-test.cjs [pasta-de-saida]
// (precisa do servidor: node tools/serve.mjs 8080)
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const URL = process.env.GAME_URL || 'http://localhost:8080/';
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'screenshots'));
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });

  await page.goto(URL);
  await page.waitForFunction(() => window.__worldman && document.fonts.status === 'loaded');
  await sleep(800);
  await page.screenshot({ path: path.join(OUT, '01-menu.png') });

  await page.click('#btn-controls');
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '02-controles.png') });
  await page.click('#screen-controls [data-back]');
  await page.click('#btn-credits');
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '03-creditos.png') });
  await page.click('#screen-credits [data-back]');

  await page.fill('#name-input', 'Tester');
  await page.click('#btn-start');
  // imortal durante as capturas (os ponteiros passam com frequência)
  await page.evaluate(() => {
    const g = window.__worldman.game;
    g.__kill = g.killPlayer;
    g.killPlayer = () => {};
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT, '04-jogo.png') });

  // pula, atira e para
  await page.keyboard.down('ArrowUp');
  await sleep(120);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('KeyX');
  await sleep(250);
  await page.screenshot({ path: path.join(OUT, '05-pulo-tiro.png') });
  await sleep(600);
  await page.keyboard.up('KeyX');
  await page.keyboard.down('ArrowLeft');
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, '06-parada.png') });
  await page.keyboard.up('ArrowLeft');

  const state = await page.evaluate(() => {
    const g = window.__worldman.game;
    return { mode: g.mode, state: g.state, stops: g.player.stops, time: g.time, enemies: g.enemies.length };
  });
  console.log('estado:', JSON.stringify(state));

  // passa por todas as épocas
  const eras = await page.evaluate(async () => (await import('/js/eras.js')).ERAS.map((e) => e.id));
  for (let i = 0; i < eras.length; i++) {
    await page.evaluate((n) => window.__worldman.game.debugEra(n), i);
    await sleep(900);
    await page.screenshot({ path: path.join(OUT, `07-epoca-${i}-${eras[i]}.png`) });
  }

  // transição no meio do caminho: fronteira do tempo entrando na tela
  await page.evaluate(() => {
    const g = window.__worldman.game;
    g.debugEra(0);
    g.time = 20.05;
    g.era = 1;
    g.world.beginTransition(1, g.cam.angle);
    g.world.boundary = g.cam.angle + 0.12;
  });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '07z-transicao.png') });
  await page.evaluate(() => {
    const g = window.__worldman.game;
    g.killPlayer = g.__kill;
  });

  // força o fim de jogo
  await page.evaluate(() => window.__worldman.game.killPlayer('teste'));
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '07b-morte.png') });
  await page.waitForSelector('#screen-over:not([hidden])', { timeout: 20000 });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '08-fim.png') });
  // a partida entra no ranking sozinha (sem botão Salvar)
  await page.waitForSelector('#ranking li.me', { timeout: 5000 });
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '09-ranking.png') });

  console.log(errors.length ? `PROBLEMAS:\n${errors.join('\n')}` : 'Nenhum erro no console.');
  await browser.close();
  process.exit(errors.some((e) => e.startsWith('pageerror')) ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
