'use strict';
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errors = [];
  async function run(name, vp, full) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: vp.width < 600 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(name + ': ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
    await page.goto('file://' + path.join(__dirname, 'dist/index.html'));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `shot_${name}_title.png` });
    await page.click('#startBtn'); await page.click('#quickBtn'); await page.waitForTimeout(200);
    await page.screenshot({ path: `shot_${name}_setup.png`, fullPage: false });
    await page.click('#goBtn'); await page.waitForTimeout(1600);
    await page.screenshot({ path: `shot_${name}_game.png` });
    // プレイヤー操作：最初の未行動ユニットを選択→移動→行動
    await page.evaluate(() => {
      var u = unitsOf(G, G.playerSide).filter(function (x) { return x.type === 'kiba'; })[0];
      onTapHex(u.c, u.r);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `shot_${name}_select.png` });
    await page.evaluate(() => {
      var ks = Object.keys(reach).filter(function (k) { return k !== '__from'; });
      // 一番上（敵に近い）へ
      var best = null; ks.forEach(function (k) { var p = k.split(',').map(Number); if (!best || p[1] < best[1]) best = p; });
      onTapHex(best[0], best[1]);
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `shot_${name}_moved.png` });
    if (!full) { await ctx.close(); return; }
    // 自動プレイ：プレイヤー側も AI で進めて終局まで
    const result = await page.evaluate(async () => {
      function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
      var t0 = Date.now();
      while (!G.over && Date.now() - t0 < 300000) {
        if (G.side === G.playerSide && phase !== 'cpu' && !moveAnim) {
          if (phase === 'moved') { finishUnit(); await sleep(50); continue; }
          var list = unitsOf(G, G.playerSide).filter(function (x) { return !x.acted; });
          if (!list.length) { playerEndTurn(); await sleep(100); continue; }
          var u = list[0]; var plan = aiPlan(G, u);
          if (sel !== u) { deselect(); onTapHex(u.c, u.r); await sleep(30); }
          if (plan.move[0] !== u.c || plan.move[1] !== u.r) { onTapHex(plan.move[0], plan.move[1]); await sleep(500); while (moveAnim) await sleep(50); }
          if (G.over) break;
          if (plan.action.kind !== 'wait' && sel === u) {
            var tg = plan.action.target; var pos = tg.c !== undefined && tg.hp !== undefined && tg.type ? [tg.c, tg.r] : [tg.c, tg.r];
            onTapHex(pos[0], pos[1]); await sleep(600);
          } else if (sel === u) { finishUnit(); }
          await sleep(30);
        } else await sleep(100);
      }
      await sleep(2400);
      return { over: G.over, winner: G.winner, turn: G.turn, reason: G.reason, resultShown: document.getElementById('resultBox').classList.contains('on') };
    });
    console.log(name, JSON.stringify(result));
    await page.screenshot({ path: `shot_${name}_result.png` });
    if (!result.over || !result.resultShown) errors.push(name + ': game did not finish properly');
    await ctx.close();
  }
  await run('desktop', { width: 1280, height: 800 });
  await run('land', { width: 844, height: 390 });
  await run('iphone', { width: 390, height: 844 }, true);
  await browser.close();
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'E2E OK');
  process.exit(errors.length ? 1 : 0);
})();
