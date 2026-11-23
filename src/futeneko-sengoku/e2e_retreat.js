const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  // 攻めて 撤退
  const n0 = await p.evaluate(() => { var to = ADJ.yoshida.filter(q => KS.provs[q].owner !== KS.player)[0]; window._to = to; var bt = makeBattle(KS, 'yoshida', to, KS.provs.yoshida.units.map(u => u.uid)); startBattle(KS, bt); bt.playerSide = 'atk'; kSave(); kFightBattle(bt); return menTotal(bt.atkUnits); });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: 'k_retreat_hud.png', clip: { x: 500, y: 0, width: 600, height: 50 } });
  await p.click('#retreatBtn'); await p.waitForTimeout(200);
  const msg = await p.textContent('#confirmMsg'); const yes = await p.textContent('#confirmYes');
  await p.click('#confirmYes'); await p.waitForTimeout(2500);
  const res1 = await p.evaluate(() => ({ title: document.getElementById('resultTitle').textContent, reason: document.getElementById('resultReason').textContent }));
  await p.click('#backMapBtn'); await p.waitForTimeout(500);
  const after1 = await p.evaluate(() => ({ home: menTotal(KS.provs.yoshida.units), owner: KS.provs[window._to].owner, rel: relationOf(KS, KS.player, KS.provs[window._to].owner), yes: document.getElementById('confirmYes').textContent }));
  const k1 = (await p.textContent('#kBody')).slice(0, 120);
  // 守りで 撤退
  const r2 = await p.evaluate(() => { kCloseModal(); var en = 'sato'; KS.provs.oasa.owner = KS.player; var bt = makeBattle(KS, en, 'yoshida', KS.provs[en].units.map(u => u.uid), null); startBattle(KS, bt); bt.playerSide = 'def'; kFightBattle(bt); return 1; });
  await p.waitForTimeout(2500);
  for (let k = 0; k < 40; k++) { if (await p.evaluate(() => G.side === G.playerSide && phase !== 'cpu')) break; await p.waitForTimeout(300); }
  const ex = await p.evaluate(() => ({ ex: G.exits.def.map(e => e.name), side: G.side, ps: G.playerSide, phase, over: G.over, dis: document.getElementById('retreatBtn').disabled, esc: (G.kBattle && battleEnv(KS, G.kBattle).escapes || []).map(e => e.name) }));
  console.log('EX', JSON.stringify(ex));
  await p.click('#retreatBtn'); await p.waitForTimeout(200);
  const msg2 = await p.textContent('#confirmMsg');
  await p.click('#confirmYes'); await p.waitForTimeout(2500);
  const res2 = await p.evaluate(() => document.getElementById('resultReason').textContent);
  await p.click('#backMapBtn'); await p.waitForTimeout(500);
  const after2 = await p.evaluate(() => ({ yo: KS.provs.yoshida.owner, oasa: menTotal(KS.provs.oasa.units) }));
  console.log(JSON.stringify({ n0, msg, yes, res1, after1, k1, ex, msg2, res2, after2, errs }));
  await b.close();
})();
