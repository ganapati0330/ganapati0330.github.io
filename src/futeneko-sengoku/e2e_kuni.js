const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const vp = process.argv[2] === 'desk' ? { width: 1280, height: 800 } : { width: 390, height: 844 };
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const url = 'http://localhost:8765/index.html';
  await p.goto(url); await p.waitForTimeout(300);
  await p.click('#startBtn'); await p.waitForTimeout(150);
  const contHidden = await p.evaluate(() => getComputedStyle(document.getElementById('contBtn')).display === 'none');
  await p.click('#ngBtn'); await p.waitForTimeout(150);
  await p.screenshot({ path: 'k_clan.png' });
  await p.click('#kGoBtn'); await p.waitForTimeout(400);
  await p.screenshot({ path: 'k_intro.png' });
  await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let __i = 0; __i < 5; __i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.screenshot({ path: 'k_map.png' });
  // 地図を クリックして 安芸を えらぶ
  async function clickProv(id) {
    const xy = await p.evaluate(id => { var q = kMap.labels[id], rc = kMap.cv.getBoundingClientRect(); return [rc.left + kMap.x + q[0] * kMap.s, rc.top + kMap.y + q[1] * kMap.s]; }, id);
    await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(150);
  }
  await clickProv('yoshida');
  const selBingo = await p.evaluate(() => kSel);
  // 徴兵：足軽 2
  await p.click('#kActs .act:has-text("徴兵")'); await p.waitForTimeout(150);
  await p.click('#kBody .pm[data-t="ashigaru"][data-d="1"]'); await p.click('#kBody .pm[data-t="ashigaru"][data-d="1"]');
  await p.screenshot({ path: 'k_recruit.png' });
  await p.click('#kRecOk'); await p.waitForTimeout(150);
  const afterRec = await p.evaluate(() => ({ n: KS.provs.yoshida.units.length, gold: KS.clans.mori.gold, acted: KS.provs.yoshida.acted }));
  await p.evaluate(() => { KS.provs.yoshida.acted = false; KS.provs.yoshida.units.push({uid: 9001, type:'ashigaru', hp:10},{uid: 9002, type:'kiba', hp:10},{uid: 9003, type:'kosaku', hp:10}); kUpdate(); });
  // 出陣：安芸 → 安芸西部（合戦）
  await clickProv('yoshida');
  await p.click('#kActs .act:has-text("出陣")'); await p.waitForTimeout(150);
  await p.screenshot({ path: 'k_attackmode.png' });
  await clickProv('sato'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'k_attackbox.png' });
  await p.click('#kFight'); await p.waitForTimeout(1800);
  await p.screenshot({ path: 'k_battle.png' });
  const inBattle = await p.evaluate(() => ({ on: document.getElementById('gameScreen').classList.contains('on'), camp: G && G.campaign, castle: G && G.castle.id, gen: G && generalName(general(G, G.playerSide)), units: G && G.units.length }));
  // 合戦を AI で すすめる
  const result = await p.evaluate(async () => {
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    var t0 = Date.now();
    while (!G.over && Date.now() - t0 < 240000) {
      if (G.side === G.playerSide && phase !== 'cpu' && !moveAnim) {
        var list = unitsOf(G, G.playerSide).filter(x => !x.acted);
        if (!list.length) { playerEndTurn(); await sleep(80); continue; }
        var u = list[0]; var plan = aiPlan(G, u); aiExecute(G, u, plan); u.acted = true; updateHud(); if (checkVictory(G)) { gameOver(); break; }
        await sleep(5);
      } else await sleep(80);
    }
    await sleep(1000);
    return { over: G.over, winner: G.winner, reason: G.reason, mapBtn: getComputedStyle(document.getElementById('resultBtnsK')).display !== 'none' };
  });
  await p.screenshot({ path: 'k_battle_result.png' });
  await p.click('#backMapBtn'); await p.waitForTimeout(500);
  await p.screenshot({ path: 'k_after.png' });
  const after = await p.evaluate(() => ({ sato: KS.provs.sato.owner, satoN: KS.provs.sato.units.length, yoshidaN: KS.provs.yoshida.units.length, pending: !!KS.pendingBattle, title: document.getElementById('kTitle').textContent }));
  await p.click('#kBtns .act'); await p.waitForTimeout(200);
  // きせつを おわる（未行動あり→確認）
  await p.click('#kEndBtn'); await p.waitForTimeout(150);
  const owaru = await p.$('#kBox.on #kBtns .act:has-text("おわる")'); if (owaru) await owaru.click();
  // CPU の 攻撃が きたら おまかせ
  for (let i = 0; i < 20; i++) {
    await p.waitForTimeout(500);
    const st = await p.evaluate(() => ({ phase: KS.phase, modal: document.getElementById('kBox').classList.contains('on'), t: document.getElementById('kTitle').textContent }));
    if (st.modal) { const has = await p.$('#kBtns .act:has-text("おまかせ")'); if (has) await has.click(); else await p.click('#kBtns .act'); continue; }
    if (st.phase === 'player') break;
  }
  const season = await p.evaluate(() => ({ year: KS.year, season: KS.season, phase: KS.phase, gold: KS.clans.mori.gold }));
  await p.screenshot({ path: 'k_season2.png' });
  // 保存→リロード→つづきから
  await p.reload(); await p.waitForTimeout(400);
  await p.click('#startBtn'); await p.waitForTimeout(150);
  const contShown = await p.evaluate(() => getComputedStyle(document.getElementById('contBtn')).display !== 'none');
  await p.click('#contBtn'); await p.waitForTimeout(400);
  const resumed = await p.evaluate(() => ({ year: KS.year, season: KS.season, scen: KS.scenario, sato: KS.provs.sato.owner, clans: Object.keys(CLANS).length, map: document.getElementById('mapScreen').classList.contains('on') }));
  console.log(JSON.stringify({ contHidden, selBingo, afterRec, inBattle, result, after, season, contShown, resumed, errs }, null, 0));
  await b.close();
})();
