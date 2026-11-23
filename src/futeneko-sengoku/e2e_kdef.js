const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let __i = 0; __i < 5; __i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.screenshot({ path: 'k_desk_map.png' });
  const before = await p.evaluate(() => ({ year: KS.year, season: KS.season }));
  // 陶が 周防から… ではなく 安芸西部(陶)から 安芸(毛利)へ せめてくる 状況を つくる
  await p.evaluate(() => {
    var bt = makeBattle(KS, 'sato', 'yoshida', KS.provs.sato.units.map(u => u.uid));
    startBattle(KS, bt); bt.playerSide = 'def'; KS.phase = 'cpu'; KS.cpu = { queue: [] }; kSave(); kFightBattle(bt);
  });
  await p.waitForTimeout(1500);
  const bs = await p.evaluate(() => ({ side: G.playerSide, castle: G.castle.id, gen: generalName(general(G, G.cpuSide)), turnLimit: G.turnLimit }));
  await p.screenshot({ path: 'k_def_battle.png' });
  const r = await p.evaluate(async () => {
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    var t0 = Date.now();
    while (!G.over && Date.now() - t0 < 240000) {
      if (G.side === G.playerSide && phase !== 'cpu' && !moveAnim) {
        var list = unitsOf(G, G.playerSide).filter(x => !x.acted);
        if (!list.length) { playerEndTurn(); await sleep(80); continue; }
        var u = list[0]; aiExecute(G, u, aiPlan(G, u)); u.acted = true; updateHud(); if (checkVictory(G)) { gameOver(); break; }
        await sleep(5);
      } else await sleep(80);
    }
    await sleep(1000); return { winner: G.winner, reason: G.reason };
  });
  await p.click('#backMapBtn'); await p.waitForTimeout(400);
  const t = await p.textContent('#kTitle');
  await p.click('#kBtns .act'); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => ({ year: KS.year, season: KS.season, phase: KS.phase, yoshida: KS.provs.yoshida.owner, pending: !!KS.pendingBattle }));
  console.log(JSON.stringify({ before, bs, r, t, after, errs }));
  await b.close();
})();
