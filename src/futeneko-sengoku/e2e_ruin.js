const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 850 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { KS.provs.yoshida.ruin = 1; KS.castles.yoshida_0.ruin = 1; kSel = 'yoshida'; kUpdate(); kMainCastleBox('yoshida'); });
  await p.waitForTimeout(300); await p.screenshot({ path: 'k_ruin_box.png' });
  const info = await p.evaluate(() => document.getElementById('kInfo').innerText.match(/本城：[^\n]*/)[0]);
  const g0 = await p.evaluate(() => KS.clans.mori.gold);
  await p.click('[data-rep]'); await p.waitForTimeout(200);
  const after = await p.evaluate(() => ({ ruin: KS.provs.yoshida.ruin, gold: KS.clans.mori.gold, art: castleArtOf(KS, 'yoshida', null) }));
  // 内政画面の なおす ボタン（猿掛城）
  await p.evaluate(() => { kCloseModal(); openDomain('yoshida'); }); await p.waitForTimeout(500);
  const dbtn = await p.$$eval('#dActs .dbld', bs => bs.map(x => x.innerText.split('\n')[0]).slice(0, 4));
  // 合戦：こわれた 城の 石垣
  await p.evaluate(() => { closeDomain(); var en = ADJ.yoshida.filter(q => KS.provs[q].owner !== KS.player)[0]; KS.provs.yoshida.ruin = 1; var bt = makeBattle(KS, en, 'yoshida', KS.provs[en].units.map(u => u.uid), null); startBattle(KS, bt); bt.playerSide = 'def'; kFightBattle(bt); });
  await p.waitForTimeout(2000);
  const walls = await p.evaluate(() => { var a = []; G.map.tiles.forEach(r => r.forEach(t => { if ((t.ch === 'W' && !t.wood) || t.ch === 'G') a.push(t.hp + '/' + t.maxHp); })); return { ruin: G.ruin, w: a.slice(0, 6), intro: LOG[0].text.match(/こわれた[^。]*/) }; });
  console.log(JSON.stringify({ info, g0, after, dbtn, walls, errs }));
  await b.close();
})();
