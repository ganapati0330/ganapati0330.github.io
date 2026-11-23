const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { KS.clans.mori.gold = 0; kSel = 'yoshida'; var t = kAtkTargets()[0]; kAttackBox('yoshida', t.to, t.castle); });
  await p.waitForTimeout(300);
  const w = await p.evaluate(() => [document.getElementById('kFoodV').innerText, document.getElementById('kFoodW').innerText, document.getElementById('kFight').disabled]);
  await p.evaluate(() => document.getElementById('kFoodW').scrollIntoView()); await p.screenshot({ path: 'k_atkrice.png' });
  const f0 = await p.evaluate(() => castleFood(KS, 'yoshida', null));
  await p.click('#kFight'); await p.waitForTimeout(2500);
  const f1 = await p.evaluate(() => ({ food: castleFood(KS, 'yoshida', null), gold: KS.clans.mori.gold, g: G.food0, log: KS.log.slice(-3).map(l => l.text) }));
  // 補給
  await p.click('#supplyBtn').catch(() => {}); await p.waitForTimeout(200);
  const sup = await p.$$eval('#supplyOpts button', bs => bs.map(x => x.innerText.replace(/\n/g, ' ') + (x.disabled ? '(x)' : '')));
  console.log(JSON.stringify({ w, f0, f1, sup, errs }));
  await b.close();
})();
