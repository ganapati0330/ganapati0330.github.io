const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'o_clan.png' });
  await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let __i = 0; __i < 5; __i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.screenshot({ path: 'o_map.png' });
  await p.click('#kOffBtn'); await p.waitForTimeout(200); await p.screenshot({ path: 'o_list.png' }); await p.click('#kBtns .act');
  // 城主の 任命：志道広良を 吉田に
  await p.evaluate(() => { kSel = 'yoshida'; kUpdate(); });
  await p.click('#kActs .act:has-text("城主")'); await p.waitForTimeout(150);
  await p.screenshot({ path: 'o_assign.png' });
  await p.click('.koff:has-text("志道広良")'); await p.waitForTimeout(150);
  const asg = await p.evaluate(() => ({ lord: KS.provs.yoshida.officer, info: document.getElementById('kInfo').textContent.slice(0, 80) }));
  // 元就に もどす
  await p.click('#kActs .act:has-text("城主")'); await p.click('.koff:has-text("毛利元就")'); await p.waitForTimeout(100);
  // 調略：佐東（武田）へ
  await p.click('#kActs .act:has-text("調略")'); await p.waitForTimeout(100);
  await p.evaluate(() => { kTap(kMap.x + kMap.labels.sato[0] * kMap.s, kMap.y + kMap.labels.sato[1] * kMap.s); }); await p.waitForTimeout(200);
  await p.screenshot({ path: 'o_scheme.png' });
  const odds = await p.evaluate(() => ['ksSubmit', 'ksNaio', 'ksAlly'].map(id => document.getElementById(id).textContent.slice(-6)));
  await p.click('#ksNaio'); await p.waitForTimeout(300);
  const sres = await p.evaluate(() => ({ gold: KS.clans.mori.gold, acted: KS.provs.yoshida.acted, log: KS.log.slice(-1)[0].text, naio: KS.provs.sato.naio }));
  // 合戦：大将の 名前と 能力
  await p.evaluate(() => { KS.provs.yoshida.acted = false; var bt = makeBattle(KS, 'yoshida', 'sato', KS.provs.yoshida.units.map(u => u.uid)); bt.playerSide = 'atk'; startBattle(KS, bt); kFightBattle(bt); });
  await p.waitForTimeout(1500);
  const bat = await p.evaluate(() => ({ myGen: generalName(general(G, 'atk')), enGen: generalName(general(G, 'def')), sm: G.sideMult }));
  await p.screenshot({ path: 'o_battle.png' });
  console.log(JSON.stringify({ asg, odds, sres, bat, errs }));
  await b.close();
})();
