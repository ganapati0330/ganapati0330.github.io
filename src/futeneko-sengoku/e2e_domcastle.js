const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1300, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { kSel = 'yoshida'; kUpdate(); openDomain('yoshida'); }); await p.waitForTimeout(600);
  await p.screenshot({ path: 'k_dom_back.png' });
  const taps = await p.evaluate(() => DS.ctaps.filter(t => t.own === KS.player).map(t => [t.key, Math.round(t.x), Math.round(t.y)]));
  const sar = taps.find(t => t[0] === 'yoshida_0');
  await p.mouse.click(sar[1], sar[2] - 10); await p.waitForTimeout(300);
  const box = await p.evaluate(() => ({ t: document.getElementById('kTitle') ? document.getElementById('kTitle').textContent : '', btns: [...document.querySelectorAll('#kBtns button')].map(x => x.textContent + (x.disabled ? '(x)' : '')) }));
  await p.screenshot({ path: 'k_dom_castle.png' });
  // 家臣を よぶ → 志道
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /よぶ/.test(x.textContent)).click()); await p.waitForTimeout(200);
  await p.click('#kBody [data-o="shiji"]'); await p.waitForTimeout(200);
  const offs = await p.evaluate(() => document.getElementById('kBody').innerText.match(/いる 家臣[\s\S]*?(?=\n\n|$)/)[0].slice(0, 80));
  // 徴兵
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /徴兵/.test(x.textContent)).click()); await p.waitForTimeout(200);
  const rec = await p.evaluate(() => ({ t: document.getElementById('kTitle') ? document.getElementById('kTitle').textContent : '', off: [...document.querySelectorAll('#kRecOff option')].map(o => o.textContent), txt: document.getElementById('kBody').innerText.slice(0, 120) }));
  await p.click('#kBody .pm[data-t="ashigaru"][data-d="10"]'); await p.click('#kRecOk'); await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({ units: KS.castles.yoshida_0.units.length, men: menTotal(KS.castles.yoshida_0.units), rec: KS.castles.yoshida_0.rec === KS.turn, prov: didCmd(KS.provs.yoshida, 'recruit'), title: document.getElementById('kTitle') ? document.getElementById('kTitle').textContent : '', dom: getComputedStyle(document.getElementById('domScreen')).display }));
  await p.evaluate(() => kCloseModal());
  await p.click('#dActs .dback'); await p.waitForTimeout(300);
  const map = await p.evaluate(() => getComputedStyle(document.getElementById('mapScreen')).display);
  console.log(JSON.stringify({ taps, box, offs, rec, after, map, errs }));
  await b.close();
})();
