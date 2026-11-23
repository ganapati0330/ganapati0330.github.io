const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'a_clan.png' });
  await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'a_event.png' });
  for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'a_map.png' });
  await p.evaluate(() => { var bt = makeBattle(KS, 'sato', 'yoshida', KS.provs.sato.units.map(u => u.uid)); bt.playerSide = 'def'; startBattle(KS, bt); kFightBattle(bt); });
  await p.waitForTimeout(1500);
  const gens = await p.evaluate(() => ({ me: G.units.find(u => u.type === 'taisho' && u.side === G.playerSide).charId, en: G.units.find(u => u.type === 'taisho' && u.side === G.cpuSide).charId }));
  await p.evaluate(() => { var g = general(G, G.playerSide); cam.s = 1.1; var h = hexCenter(g.c, g.r); cam.x = W / 2 - h[0] * cam.s; cam.y = H / 2 - h[1] * cam.s; });
  await p.waitForTimeout(200);
  await p.screenshot({ path: 'a_battle.png' });
  console.log(JSON.stringify({ gens, errs }));
  await b.close();
})();
