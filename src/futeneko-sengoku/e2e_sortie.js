const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  // 志道広良を 猿掛城へ
  await p.evaluate(() => { KS.officers.shiji.at = 'yoshida_0'; kSel = 'yoshida'; kUpdate(); });
  await p.evaluate(() => kSortieBox('yoshida')); await p.waitForTimeout(300);
  const sortie = await p.$$eval('#kBody .koff', bs => bs.map(x => x.innerText.replace(/\n/g, ' ')));
  await p.screenshot({ path: 'k_sortie.png' });
  await p.click('#kBody [data-m]'); await p.waitForTimeout(300);
  // 地図で 目標：攻撃 先の 1つめ
  await p.evaluate(() => { var t = kAtkTargets()[0]; kAttackBox(kSel, t.to, t.castle); });
  await p.waitForTimeout(300);
  const gen0 = await p.$$eval('#kAtkOff option', os => os.map(o => o.textContent));
  const cos = await p.$$eval('#kBody details.kco summary', ss => ss.map(x => x.innerText));
  // 猿掛城の 応援を ひらいて 1隊
  await p.evaluate(() => { var d = [...document.querySelectorAll('details.kco')].find(x => /猿掛/.test(x.innerText)); d.open = true; d.querySelector('.pm[data-d="1"]').click(); });
  await p.waitForTimeout(200);
  const gen1 = await p.$$eval('#kAtkOff option', os => os.map(o => o.textContent));
  await p.evaluate(() => { var s = document.getElementById('kAtkOff'); s.value = 'shiji'; s.onchange(); });
  await p.screenshot({ path: 'k_sortie_box.png', fullPage: false });
  const odds = await p.textContent('#kOdds');
  await p.click('#kFight'); await p.waitForTimeout(2500);
  const g = await p.evaluate(() => ({ gen: G.generals.atk.name, n: G.units.filter(u => u.side === 'atk').length, sar: KS.castles.yoshida_0.units.length, busy: offBusy(KS, KS.officers.shiji) }));
  console.log(JSON.stringify({ sortie, gen0, cos, gen1, odds, g, errs }));
  await b.close();
})();
