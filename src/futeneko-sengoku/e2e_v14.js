const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/work/dist/index.html'); await p.waitForTimeout(300);
  await p.click('#startBtn'); await p.click('#quickBtn'); await p.click('#goBtn'); await p.waitForTimeout(1600);
  // 移動 → もどす
  const r1 = await p.evaluate(() => { var u = unitsOf(G, G.playerSide).filter(x => x.type === 'kiba')[0]; window.__u = u; window.__o = [u.c, u.r]; onTapHex(u.c, u.r);
    var ks = Object.keys(reach).filter(k => k !== '__from'); var best = null; ks.forEach(k => { var q = k.split(',').map(Number); if (!best || q[1] < best[1]) best = q; }); onTapHex(best[0], best[1]); return best; });
  await p.waitForTimeout(1200);
  const hasUndo = await p.isVisible('.act.undo');
  await p.screenshot({ path: 'v14_moved.png' });
  await p.click('.act.undo'); await p.waitForTimeout(200);
  const back = await p.evaluate(() => [__u.c === __o[0] && __u.r === __o[1], __u.moved, phase, sel === __u]);
  // ターン終了警告
  await p.evaluate(() => deselect());
  await p.click('#endTurnBtn'); await p.waitForTimeout(200);
  const warn = await p.isVisible('#confirmBox.on'); const msg = await p.textContent('#confirmMsg');
  await p.screenshot({ path: 'v14_confirm.png' });
  await p.click('#confirmNo'); const stillMine = await p.evaluate(() => G.side === G.playerSide);
  await p.click('#endTurnBtn'); await p.click('#confirmYes'); await p.waitForTimeout(500);
  const cpuNow = await p.evaluate(() => G.side !== G.playerSide);
  await p.waitForFunction(() => G.side === G.playerSide && phase === 'idle', null, { timeout: 60000 });
  await p.waitForTimeout(500);
  await p.screenshot({ path: 'v14_log3.png' });
  const nlog = await p.evaluate(() => LOG.length);
  await p.click('#logLine'); await p.waitForTimeout(200);
  const logOpen = await p.isVisible('#logBox.on');
  await p.screenshot({ path: 'v14_logfull.png' });
  console.log(JSON.stringify({ hasUndo, back, warn, msg, stillMine, cpuNow, nlog, logOpen, errs }));
  await b.close();
})();
