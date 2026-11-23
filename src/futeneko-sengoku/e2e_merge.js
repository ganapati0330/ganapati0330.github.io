const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 850 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  // 本城の 隊を へらして まとめる
  await p.evaluate(() => { var P = KS.provs.yoshida; P.units[0].hp = 3; P.units[1].hp = 4; P.units[2].hp = 2; kSel = 'yoshida'; kUpdate(); });
  const hint = await p.evaluate(() => !!document.querySelector('#kInfo .kbr[data-main]') && document.getElementById('kInfo').innerText.includes('まとめる'));
  await p.evaluate(() => kMainCastleBox('yoshida')); await p.waitForTimeout(200);
  const before = await p.evaluate(() => KS.provs.yoshida.units.map(u => u.type + ':' + u.hp));
  await p.screenshot({ path: 'k_merge_box.png' });
  await p.click('[data-mrg]'); await p.waitForTimeout(200);
  const after = await p.evaluate(() => KS.provs.yoshida.units.map(u => u.type + ':' + u.hp));
  // 合戦で 合流
  await p.evaluate(() => { kCloseModal(); var to = ADJ.yoshida.filter(q => KS.provs[q].owner !== KS.player)[0];
    var bt = makeBattle(KS, 'yoshida', to, KS.provs.yoshida.units.map(u => u.uid)); startBattle(KS, bt); bt.playerSide = 'atk'; kSave(); kFightBattle(bt); });
  await p.waitForTimeout(2500);
  const pair = await p.evaluate(() => {
    var mine = G.units.filter(u => u.side === G.playerSide && u.type !== 'taisho' && u.type !== 'konida');
    for (var a of mine) { var t = mergeTargets(G, a); if (t.length) return true; }
    // となりに ならべる
    var a0 = mine[0], b0 = mine[1]; var nb = hexNbs(a0.c, a0.r).find(n => { var t = tileAt(G, n[0], n[1]); return t && !unitAt(G, n[0], n[1]) && '.=fhb'.indexOf(t.ch) >= 0; });
    b0.type = a0.type; b0.c = nb[0]; b0.r = nb[1]; a0.hp = 3; b0.hp = 5; return false;
  });
  const res = await p.evaluate(() => { var a0 = G.units.filter(u => u.side === G.playerSide).find(u => mergeTargets(G, u).length); sel = a0; phase = 'idle'; selectUnit(a0); return { hp: a0.hp, t: mergeTargets(G, a0).map(t => t.hp) }; });
  await p.waitForTimeout(200);
  const btn = await p.$$eval('#actBar button', bs => bs.map(x => x.textContent));
  await p.screenshot({ path: 'k_merge_battle.png' });
  await p.evaluate(() => [...document.querySelectorAll('#actBar button')].find(x => /合流/.test(x.textContent)).click()); await p.waitForTimeout(300);
  const after2 = await p.evaluate(() => ({ n: G.units.filter(u => u.side === G.playerSide).map(u => u.type + ':' + u.hp), log: LOG.slice(-1)[0].text }));
  console.log(JSON.stringify({ hint, before, after, pair, res, btn, after2, errs }));
  await b.close();
})();
