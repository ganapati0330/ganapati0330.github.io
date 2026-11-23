const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  const s0 = await p.evaluate(() => officersOf(KS, KS.player).map(o => o.name + '@' + o.at + (o.prov ? '*' : '')));
  const info0 = await p.textContent('#kInfo');
  await p.evaluate(() => kOfficersBox()); await p.waitForTimeout(300);
  await p.screenshot({ path: 'k_offbox.png' });
  const mv = await p.$$eval('.koffmv', bs => bs.length);
  await p.click('.koffmv >> nth=1'); await p.waitForTimeout(300);
  const mvTxt = await p.textContent('#kBody');
  await p.screenshot({ path: 'k_offmove.png' });
  await p.click('#kBody .koff >> nth=0'); await p.waitForTimeout(300);
  const s1 = await p.evaluate(() => officersOf(KS, KS.player).map(o => o.name + '@' + o.at + (o.prov ? '*' : '') + (offBusy(KS, o) ? '(busy)' : '')));
  await p.evaluate(() => { kCloseModal(); kSel = 'yoshida'; kUpdate(); kRecruitBox(); }); await p.waitForTimeout(300);
  const rec = await p.$$eval('#kRecOff option', os => os.map(o => o.textContent));
  console.log(JSON.stringify({ s0, info0: info0.match(/家臣：[^本へ]*/)?.[0], mv, mvTxt: mvTxt.slice(0, 200), s1, rec, errs }));
  await b.close();
})();
