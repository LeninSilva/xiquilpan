// Montage of screenshots: node tests/grid.mjs out.png cols width file...
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
import fs from 'fs';
const [, , out, cols, cw, ...files] = process.argv;
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const imgs = files.map(f => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption>${f.split('/').pop()}</figcaption></figure>`).join('');
const page = await browser.newPage({ viewport: { width: +cols * +cw, height: 400 } });
await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(${cols},${cw}px);background:#222}figure{margin:0}img{width:${cw}px;display:block}figcaption{color:#fff;font:10px sans-serif;padding:1px 3px}</style>${imgs}`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
