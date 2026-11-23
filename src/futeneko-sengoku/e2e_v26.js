const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let __i = 0; __i < 5; __i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.screenshot({ path: 'v26_map.png' });
  const hud = await p.evaluate(() => [document.getElementById('kGold').textContent, document.getElementById('kProv').textContent, document.getElementById('kInfo').textContent.slice(0, 160)]);
  await p.click('#kActs .act:has-text("徴兵")'); await p.waitForTimeout(150); await p.click('#kBody .pm[data-t="ashigaru"][data-d="1"]');
  await p.screenshot({ path: 'v26_recruit.png' });
  const cost = await p.textContent('#kCost'); await p.click('#kBtns .act.sub');
  // 季節を すすめて 秋の 年貢
  const inc = await p.evaluate(() => { var g0 = KS.clans.mori.gold; seasonStart(KS); var s = KS.season; KS.season = 2; var g1 = KS.clans.mori.gold; seasonStart(KS); var g2 = KS.clans.mori.gold; KS.season = s; return { summerOnly: g1 - g0, autumn: g2 - g1, log: KS.log.slice(-1)[0].text }; });
  // 実在の 城で 合戦
  await p.evaluate(() => { var bt = makeBattle(KS, 'yoshida', 'sato', KS.provs.yoshida.units.map(u => u.uid)); bt.playerSide = 'atk'; startBattle(KS, bt); kFightBattle(bt); });
  await p.waitForTimeout(1500);
  const bt = await p.evaluate(() => ({ castle: G.castle.id, w: G.map.w, h: G.map.h, turns: G.turnLimit, men: unitsOf(G, G.playerSide).map(u => menOf(u)) }));
  await p.click('#fitBtn'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'v26_battle.png' });
  await p.evaluate(() => { var u = unitsOf(G, G.playerSide).filter(x => x.type === 'ashigaru')[0]; selectUnit(u); });
  await p.waitForTimeout(150);
  const info = await p.evaluate(() => document.getElementById('infoBox').textContent);
  console.log(JSON.stringify({ hud, cost, inc, bt, info, errs }));
  await b.close();
})();
