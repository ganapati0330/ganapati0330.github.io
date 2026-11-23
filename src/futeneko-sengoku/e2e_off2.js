'use strict';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(400);
  for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  const R = {};
  await p.evaluate(() => { kSel = 'yoshida'; kUpdate(); kRecruitBox(); }); await p.waitForTimeout(200);
  R.offs = await p.evaluate(() => [...document.querySelectorAll('#kRecOff option')].map(o => o.textContent));
  // 1人だけ
  await p.click('#kBody .pm[data-t="ashigaru"][data-d="1"]'); await p.waitForTimeout(80);
  await p.fill('#rc_yumi', '7'); await p.waitForTimeout(80);
  R.cost = await p.evaluate(() => document.getElementById('kCost').innerText.replace(/\n/g, ' '));
  await p.screenshot({ path: 'off_rec.png' });
  const m0 = await p.evaluate(() => menTotal(KS.provs.yoshida.units));
  await p.click('#kRecOk'); await p.waitForTimeout(300);
  R.men = [m0, await p.evaluate(() => menTotal(KS.provs.yoshida.units))];
  R.busy = await p.evaluate(() => officersOf(KS, KS.player).filter(o => offBusy(KS, o)).map(o => o.name));
  // 家臣一覧
  await p.evaluate(() => kOfficersBox()); await p.waitForTimeout(200);
  await p.screenshot({ path: 'off_list.png' });
  await p.evaluate(() => kCloseModal());
  // 調略：担当 えらび
  await p.evaluate(() => { var t = ADJ.yoshida.find(q => KS.provs[q].owner !== KS.player && KS.provs[q].owner !== 'ikki'); window._t = t; kSchemeBox('yoshida', t); }); await p.waitForTimeout(200);
  R.sch = await p.evaluate(() => ({ opts: [...document.querySelectorAll('#kSchOff option')].length, p: document.getElementById('kSchOffP').textContent }));
  await p.evaluate(() => kCloseModal());
  // 内政：奉行
  await p.evaluate(() => { KS.provs.yoshida.done = {}; openDomain('yoshida'); }); await p.waitForTimeout(400);
  R.dom = await p.evaluate(() => ({ off: KS.curOff && KS.officers[KS.curOff].name, sel: !!document.getElementById('dOff') }));
  await p.evaluate(() => closeDomain());
  // 出陣：大将
  await p.evaluate(() => { var id = attackTargets(KS, 'yoshida', 'mori').filter(t => t.to === 'bingon')[0].castle; KS.provs.yoshida.done = {}; kAttackBox('yoshida', 'bingon', id); }); await p.waitForTimeout(300);
  R.atk = await p.evaluate(() => ({ opts: [...document.querySelectorAll('#kAtkOff option')].map(o => o.textContent).slice(0, 3), p: document.getElementById('kAtkOffP').textContent }));
  await p.click('#kAuto'); await p.waitForTimeout(2500);
  R.atkOff = await p.evaluate(() => (KS.log.find(l => /出陣/.test(l.text)) || {}).text);
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
