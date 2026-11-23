const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 844, height: 390 }, { width: 1280, height: 420 }, { width: 667, height: 375 }, { width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const p = await b.newPage({ viewport: vp });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///home/claude/work/dist/index.html'); await p.waitForTimeout(200);
    await p.click('#startBtn'); await p.click('#quickBtn'); await p.click('#goBtn'); await p.waitForTimeout(1500);
    await p.evaluate(() => { logMsg('a'); logMsg('b'); logMsg('c'); });
    const blocked = [];
    // すべての自軍ユニットを、実際のマウスクリックで選べるか（1体ずつ選ぶ→キャンセル）
    const ids = await p.evaluate(() => unitsOf(G, G.playerSide).map(u => u.id));
    for (const id of ids) {
      const xy = await p.evaluate(id => { var u = G.units.find(x => x.id === id); var h = hexCenter(u.c, u.r), rc = canvas.getBoundingClientRect(); return [rc.left + cam.x + h[0] * cam.s, rc.top + cam.y + h[1] * cam.s]; }, id);
      await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(250);
      const ok = await p.evaluate(id => !!sel && sel.id === id, id);
      if (!ok) blocked.push(await p.evaluate(id => G.units.find(x => x.id === id).type, id));
      await p.evaluate(() => deselect()); await p.waitForTimeout(250);
    }
    // つぎの へい ボタンで全員めぐれるか
    let seen = new Set();
    for (let i = 0; i < ids.length; i++) { await p.click('#bottom .act:has-text("つぎ")'); await p.waitForTimeout(60); seen.add(await p.evaluate(() => sel && sel.id)); }
    console.log(vp.width + 'x' + vp.height, 'blocked:', JSON.stringify(blocked), 'next cycles', seen.size + '/' + ids.length, errs);
    if (vp.height < 450) await p.screenshot({ path: `land_${vp.width}.png` });
    await p.close();
  }
  await b.close();
})();
