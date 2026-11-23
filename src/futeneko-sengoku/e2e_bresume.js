const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  // 攻める がわで 合戦（吉田 → となり）
  await p.evaluate(() => {
    var to = ADJ.yoshida.filter(q => KS.provs[q].owner !== KS.player)[0];
    var bt = makeBattle(KS, 'yoshida', to, KS.provs.yoshida.units.map(u => u.uid));
    startBattle(KS, bt); bt.playerSide = 'atk'; bt.foodDays = 30; kSave(); kFightBattle(bt);
  });
  await p.waitForTimeout(2500);
  // てきを 大将いがい ぜんぶ たおし、みかたを 1マス うごかして ターンを すすめる
  const before = await p.evaluate(async () => {
    G.units.filter(u => u.side !== G.playerSide && u.type !== 'taisho').forEach(u => { u.hp = 0; });
    playerEndTurn();
    var t0 = Date.now(); while ((G.side !== G.playerSide || phase === 'cpu') && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 800));
    return { turn: G.turn, en: G.units.filter(u => u.side !== G.playerSide && u.hp > 0).length, me: G.units.filter(u => u.side === G.playerSide && u.hp > 0).length, food: G.food, saved: !!localStorage.getItem(BSAVE_KEY) };
  });
  // ページを よみなおして つづきから
  await p.reload(); await p.waitForTimeout(500);
  await p.click('#startBtn'); await p.waitForTimeout(200);
  const btns = await p.$$eval('#modeBox button', bs => bs.map(x => x.id + ':' + x.textContent.trim()));
  await p.click('#contBtn').catch(() => {}); await p.waitForTimeout(600);
  const modal = await p.textContent('#kBody').catch(() => '');
  await p.click('#kBtns .act'); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => ({ turn: G.turn, en: G.units.filter(u => u.side !== G.playerSide && u.hp > 0).length, me: G.units.filter(u => u.side === G.playerSide && u.hp > 0).length, food: G.food, same: G.kBattle === KS.pendingBattle, log: LOG.length, screen: document.getElementById('gameScreen').classList.contains('on') || getComputedStyle(document.getElementById('gameScreen')).display }));
  await p.screenshot({ path: 'k_bresume.png' });
  // さいごまで すすめて けっか
  const fin = await p.evaluate(async () => {
    var t0 = Date.now();
    while (!G.over && Date.now() - t0 < 120000) {
      if (G.side === G.playerSide && phase !== 'cpu' && !moveAnim) {
        var list = unitsOf(G, G.playerSide).filter(x => !x.acted);
        if (!list.length) { playerEndTurn(); await new Promise(r => setTimeout(r, 80)); continue; }
        var u = list[0]; aiExecute(G, u, aiPlan(G, u)); u.acted = true; updateHud(); if (checkVictory(G)) { gameOver(); break; }
        await new Promise(r => setTimeout(r, 5));
      } else await new Promise(r => setTimeout(r, 80));
    }
    await new Promise(r => setTimeout(r, 2000)); return { winner: G.winner, reason: G.reason };
  });
  await p.click('#backMapBtn'); await p.waitForTimeout(500);
  const res = await p.textContent('#kBody');
  const end = await p.evaluate(() => ({ pending: !!KS.pendingBattle, saved: !!localStorage.getItem(BSAVE_KEY) }));
  console.log(JSON.stringify({ before, btns, modal, after, fin, res, end, errs }));
  await b.close();
})();
