// Render the SVG icon to PNGs with headless Chromium.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
import fs from 'fs';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const svg = fs.readFileSync('icons/icon.svg', 'utf8');
for (const [size, name, pad] of [[180, 'icon-180.png', 0], [192, 'icon-192.png', 0], [512, 'icon-512.png', 0], [512, 'icon-512-maskable.png', 1]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = pad ? svg.replace('rx="96"', 'rx="0"') : svg;
  await page.setContent(`<html><body style="margin:0;background:${pad ? '#1c1a24' : 'transparent'}"><div style="width:${size}px;height:${size}px;${pad ? 'padding:0' : ''}">${inner.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></body></html>`);
  await page.screenshot({ path: 'icons/' + name, omitBackground: !pad });
  await page.close();
}
await browser.close();
