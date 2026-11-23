// 北奥羽版の 通し確認：国取り開始 → 史実イベント → 合戦（石川城）→ きせつ送り → 保存・つづき → 1590 シナリオ
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const vp = process.argv[2] === 'desk' ? { width: 1280, height: 800 } : process.argv[2] === 'se' ? { width: 375, height: 667 } : { width: 390, height: 844 };
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const tag = process.argv[2] || 'phone';
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/bgm|404|Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(400);
  await p.screenshot({ path: tag + '_title.png' });
  await p.click('#startBtn'); await p.waitForTimeout(150);
  await p.click('#ngBtn'); await p.waitForTimeout(150);
  await p.click('#kGoBtn'); await p.waitForTimeout(400);
  const seen = [];
  async function drain(choose) {
    for (let i = 0; i < 30; i++) {
      const on = await p.evaluate(() => document.getElementById('kBox').classList.contains('on'));
      if (!on) return;
      const t = await p.evaluate(() => document.getElementById('kTitle').textContent); seen.push(t);
      if (/夜討ち/.test(t)) await p.screenshot({ path: tag + '_event.png' });
      const btns = await p.$$('#kBtns .act');
      const auto = await p.$('#kBtns .act:has-text("おまかせ")');
      if (auto) await auto.click(); else if (choose && btns.length > 1 && /おそう/.test(await btns[0].textContent())) await btns[0].click(); else await btns[0].click();
      await p.waitForTimeout(200);
    }
  }
  await drain(true);
  await p.screenshot({ path: tag + '_map.png' });
  // 全体図
  await p.evaluate(() => { kFit(kWhole); kRender(); }); await p.waitForTimeout(200);
  await p.screenshot({ path: tag + '_whole.png' });
  // きせつを 2回 おくる（夏に 石川城 夜討ち）
  async function endSeason() {
    await p.click('#kEndBtn'); await p.waitForTimeout(200);
    for (let i = 0; i < 40; i++) {
      await p.waitForTimeout(300);
      const st = await p.evaluate(() => ({ phase: KS.phase, modal: document.getElementById('kBox').classList.contains('on'), over: KS.over }));
      if (st.modal) { await drain(true); continue; }
      if (st.phase === 'player' || st.over) break;
    }
  }
  await endSeason();
  const s1 = await p.evaluate(() => ({ y: KS.year, s: KS.season, ishiLord: CLANS.ishikawa.lord, ishiHp: KS.provs.ishikawa.units.map(u => u.hp).join(','), fired: Object.keys(KS.firedEv || {}) }));
  // 合戦：大浦 → 石川
  await p.evaluate(() => { var P = KS.provs.oura; P.acted = false; P.done = {}; for (var i = 0; i < 4; i++) P.units.push(newUnit(KS, i % 2 ? 'kiba' : 'ashigaru')); kUpdate(); });
  const bt = await p.evaluate(() => {
    var ids = KS.provs.oura.units.map(u => u.uid);
    var b = makeBattle(KS, 'oura', 'ishikawa', ids, null, []); b.playerSide = 'atk'; startBattle(KS, b); kFightBattle(b);
    return { castle: b.castleName, atk: b.atkUnits.length, def: b.defUnits.length };
  });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: tag + '_battle.png' });
  const result = await p.evaluate(async () => {
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    var t0 = Date.now();
    while (!G.over && Date.now() - t0 < 180000) {
      if (G.side === G.playerSide && phase !== 'cpu' && !moveAnim) {
        var list = unitsOf(G, G.playerSide).filter(x => !x.acted);
        if (!list.length) { playerEndTurn(); await sleep(60); continue; }
        var u = list[0]; var plan = aiPlan(G, u); aiExecute(G, u, plan); u.acted = true; updateHud(); if (checkVictory(G)) { gameOver(); break; }
        await sleep(5);
      } else await sleep(60);
    }
    await sleep(800);
    return { over: G.over, winner: G.winner, reason: G.reason };
  });
  await p.screenshot({ path: tag + '_battle_end.png' });
  await p.click('#backMapBtn'); await p.waitForTimeout(500);
  await drain(true);
  const after = await p.evaluate(() => ({ ishikawa: KS.provs.ishikawa.owner, ouraN: KS.provs.oura.units.length }));
  // 領内マップ
  await p.evaluate(() => { kSel = 'oura'; if (typeof openDomain === 'function') openDomain('oura'); }); await p.waitForTimeout(500);
  await p.screenshot({ path: tag + '_domain.png' });
  // 保存→リロード→つづき
  await p.reload(); await p.waitForTimeout(400);
  await p.click('#startBtn'); await p.waitForTimeout(150);
  await p.click('#contBtn'); await p.waitForTimeout(500);
  await drain(true);
  const resumed = await p.evaluate(() => ({ y: KS.year, s: KS.season, scen: KS.scenario, ishikawa: KS.provs.ishikawa.owner, map: document.getElementById('mapScreen').classList.contains('on') }));
  // 1590 シナリオ（九戸）
  await p.evaluate(() => { kClear(); }); await p.reload(); await p.waitForTimeout(400);
  await p.click('#startBtn'); await p.waitForTimeout(150);
  await p.click('#ngBtn'); await p.waitForTimeout(150);
  await p.click('.kscen:nth-child(2)'); await p.waitForTimeout(200);
  await p.screenshot({ path: tag + '_clan1590.png' });
  await p.click('#kGoBtn'); await p.waitForTimeout(400);
  await drain(true);
  const s90 = await p.evaluate(() => ({ player: KS.player, oura: CLANS.oura.name + '/' + CLANS.oura.lord, provs: provsOf(KS, KS.player) }));
  await p.screenshot({ path: tag + '_map1590.png' });
  console.log(JSON.stringify({ s1, bt, result, after, resumed, s90, seen, errs }));
  await b.close();
})();
