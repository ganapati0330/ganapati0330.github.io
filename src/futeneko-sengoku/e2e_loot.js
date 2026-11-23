const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  const r = await p.evaluate(() => {
    var bt = makeBattle(KS, 'sato', 'yoshida', KS.provs.sato.units.map(u => u.uid));
    startBattle(KS, bt); bt.playerSide = 'def'; KS.phase = 'cpu'; KS.cpu = { queue: [] }; kSave(); kFightBattle(bt);
    return { food: bt.foodDays };
  });
  await p.waitForTimeout(1200);
  // 攻めの 半分を たおし、大将が ひきあげた ことに する
  const st = await p.evaluate(() => {
    var food0 = castleFood(KS, 'yoshida', null), units0 = KS.provs.yoshida.units.length;
    G.units.filter(u => u.side === 'atk' && u.type !== 'taisho' && u.type !== 'konida').forEach((u, i) => { if (i % 2 === 0) u.hp = 0; });
    var ga = G.units.find(u => u.side === 'atk' && u.type === 'taisho'); ga.fled = true; ga.fledName = '佐東';
    checkVictory(G); gameOver(); return { food0, units0, foodLeft: G.food, reason: G.reason };
  });
  await p.waitForTimeout(1200);
  await p.click('#backMapBtn'); await p.waitForTimeout(500);
  const txt = await p.textContent('#kBody');
  await p.screenshot({ path: 'k_loot.png' });
  const after = await p.evaluate(() => ({ food: castleFood(KS, 'yoshida', null), units: KS.provs.yoshida.units.length, log: KS.log.slice(-4).map(l => l.t || l.msg || l) }));
  console.log(JSON.stringify({ r, st, txt, after, errs }));
  await b.close();
})();
