// Gera os ícones PNG do PWA a partir de tools/icon.html usando o Chromium do Playwright.
// Uso: node tools/generate-icons.cjs   (precisa do servidor: node tools/serve.mjs 8080)
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.env.ICON_BASE || 'http://localhost:8080/tools/icon.html';
const OUT = path.join(__dirname, '..', 'assets', 'icons');

const targets = [
  { file: 'icon-192.png', size: 192, q: 'round=1' },
  { file: 'icon-512.png', size: 512, q: 'round=1' },
  { file: 'icon-maskable-512.png', size: 512, q: 'maskable=1' },
  { file: 'apple-touch-icon.png', size: 180, q: '' },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const t of targets) {
    await page.setViewportSize({ width: t.size, height: t.size });
    await page.goto(`${BASE}?size=${t.size}&${t.q}`);
    await page.waitForFunction(() => document.title === 'pronto');
    const el = await page.$('#c');
    await el.screenshot({ path: path.join(OUT, t.file), omitBackground: true });
    console.log('gerado', t.file);
  }
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
