'use strict';
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errors = [];
  for (const [name, vp] of [['pc', { width: 1280, height: 800 }], ['sp', { width: 390, height: 780 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: vp.width < 600 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(name + ': ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
    await page.goto('http://localhost:8765/index.html');
    await page.waitForTimeout(500);
    await page.click('#startBtn'); await page.click('#quickBtn'); await page.waitForTimeout(200);
    await page.click('#goBtn'); await page.waitForTimeout(500);
    await page.screenshot({ path: `gfx_${name}_start.png` });
    await page.waitForTimeout(1800);
    await page.evaluate(() => { fitCamera(); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `gfx_${name}_map.png` });
    const info = await page.evaluate(() => ({ on: gfxOn(), n: GFX_NAMES.filter(gx).length, total: GFX_NAMES.length }));
    console.log(name, JSON.stringify(info));
    // ズームして 攻撃演出
    await page.evaluate(() => {
      var a = unitsOf(G, G.playerSide).filter(u => u.type === 'ashigaru')[0];
      var e = unitsOf(G, G.cpuSide).filter(u => u.type !== 'taisho')[0];
      cam.s = 1.3; var p = hexCenter(a.c, a.r); cam.x = W / 2 - p[0] * cam.s; cam.y = H / 2 - p[1] * cam.s;
      var y = unitsOf(G, G.playerSide).filter(u => u.type === 'yumi')[0] || a;
      fxAttack(a, e.c, e.r); fxAttack(y, e.c, e.r); fxFall({ type: 'ashigaru', side: G.cpuSide, c: a.c + 1, r: a.r, _face: -1 });
      var w = null; G.map.tiles.forEach(row => row.forEach(t => { if (!w && t.ch === 'W' && !t.wood) w = t; }));
      if (w) fxAttack({ type: 'kosaku', c: w.c, r: w.r + 1 }, w.c, w.r, true);
    });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `gfx_${name}_fx.png` });
    // 城の まわりへ
    await page.evaluate(() => {
      var k = null; G.map.tiles.forEach(row => row.forEach(t => { if (t.ch === 'K') k = t; }));
      var g = null; G.map.tiles.forEach(row => row.forEach(t => { if (t.ch === 'G' && !g) g = t; }));
      if (g) { g.open = true; } var w = 0; G.map.tiles.forEach(row => row.forEach(t => { if (t.ch === 'W' && !t.wood && w < 2) { t.broken = true; w++; } }));
      cam.s = 1.0; var p = hexCenter(k.c, k.r); cam.x = W / 2 - p[0] * cam.s; cam.y = H / 2 - p[1] * cam.s;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `gfx_${name}_castle.png` });
    // 勝ち鬨
    await page.evaluate(() => { G.over = true; G.winner = G.playerSide; G.reason = 'テスト'; gameOver(); });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `gfx_${name}_win.png` });
    const fps = await page.evaluate(async () => { $('resultBox').classList.remove('on'); var n = 0, t0 = performance.now(); while (performance.now() - t0 < 1000) { render(); n++; } return n; });
    console.log(name, 'renders/sec', fps);
    await ctx.close();
  }
  console.log('errors', errors);
  await browser.close();
})();
