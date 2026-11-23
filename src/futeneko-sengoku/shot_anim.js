'use strict';
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8765/index.html'); await page.waitForTimeout(500);
  await page.click('#startBtn'); await page.click('#quickBtn'); await page.waitForTimeout(200);
  await page.click('#goBtn'); await page.waitForTimeout(2500);
  const info = await page.evaluate(() => ({ n: GFX_NAMES.filter(gx).length, total: GFX_NAMES.length }));
  console.log(JSON.stringify(info));
  // 全兵種を ならべて いっせいに 攻撃
  await page.evaluate(() => {
    var types = ['ashigaru', 'yumi', 'kiba', 'teppo', 'kosaku', 'ninja', 'taisho'];
    var mine = unitsOf(G, G.playerSide), base = mine[0];
    cam.s = 1.25; var p = hexCenter(base.c, base.r); cam.x = W / 2 - p[0] * cam.s - 120; cam.y = H / 2 - p[1] * cam.s;
    window._demo = types.map((t, i) => ({ type: t, side: G.playerSide, c: base.c + i, r: base.r, hp: 10, revealed: true }));
    var old = drawUnits0 = null;
  });
  const fs = require('fs');
  const url = await page.evaluate(() => {
    var cv = document.createElement('canvas'); cv.width = 900; cv.height = 5 * 150; var old = ctx; ctx = cv.getContext('2d');
    ctx.fillStyle = '#cfe0c0'; ctx.fillRect(0, 0, 900, 750); var now = nowMs();
    for (var k = 0; k < 5; k++) window._demo.forEach((u, i) => { u._face = 1; u._atk = k < 4 ? now + ATK_MS * (1 - (k + 0.5) / 4) : 0; drawAshigaru(u, 60 + i * 120, 80 + k * 150, '#2f6fe0'); });
    ctx = old; return cv.toDataURL();
  });
  fs.writeFileSync('anim_seq.png', Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
