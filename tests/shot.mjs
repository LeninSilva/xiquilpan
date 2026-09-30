// Usage: node tests/shot.mjs "<url path>" out.png [w h]
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const [, , path, out, w = '900', h = '700'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto('http://localhost:8123/' + path);
await page.waitForFunction(() => window.done || window.__game, null, { timeout: 20000 }).catch(e => errors.push('timeout ' + e.message));
await page.waitForTimeout(+(process.env.WAIT || 600));
await page.screenshot({ path: out });
if (errors.length) console.log(errors.join('\n'));
await browser.close();
