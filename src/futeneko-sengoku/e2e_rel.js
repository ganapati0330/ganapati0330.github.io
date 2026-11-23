const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 850 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { noteWar(KS, 'mori', 'takeda'); KS.castles.bingon_1.owner = 'mori'; KS.officers.shiji.at = 'bingon_1'; kSel = 'yoshida'; var q = kMap.labels.yoshida; kMap.s *= 1.6; kMap.x = 550 - q[0] * kMap.s; kMap.y = 330 - q[1] * kMap.s; kUpdate(); });
  await p.waitForTimeout(300); await p.screenshot({ path: 'k_rel_map.png' });
  const info = await p.evaluate(() => { kSel = 'sato'; kUpdate(); return document.getElementById('kInfo').innerText.split('\n').slice(0, 4).join(' / '); });
  await p.click('#kLandBtn'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'k_table.png' });
  const acts = await p.$$eval('.kcrow', rs => rs.map(r => r.querySelector('td').innerText.split('\n')[0] + ' ' + r.querySelector('.kacts').innerText.replace(/\s+/g, '')));
  await p.click('[data-tab="rel"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'k_reltab.png' });
  const rel = await p.$$eval('.krrow', rs => rs.map(r => r.innerText.replace(/\s+/g, ' ').slice(0, 50)));
  // 支城から 調略
  await p.click('[data-tab="castle"]'); await p.waitForTimeout(200);
  await p.click('button.kact[data-k="bingon_1"][data-a="sch"]'); await p.waitForTimeout(200);
  const sl = await p.$$eval('#kBody .koff', bs => bs.map(x => x.innerText.replace(/\n/g, ' ')));
  await p.click('#kBody .koff >> nth=0'); await p.waitForTimeout(200);
  const sb = await p.evaluate(() => ({ t: document.getElementById('kTitle').textContent, off: [...document.querySelectorAll('#kSchOff option')].map(o => o.textContent), p: document.getElementById('ksAllyP').textContent }));
  await p.click('#ksAlly'); await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({ sch: KS.castles.bingon_1.sch === KS.turn, prov: didCmd(KS.provs.yoshida, 'scheme'), busy: offBusy(KS, KS.officers.shiji) }));
  console.log(JSON.stringify({ info, acts, rel, sl, sb, after, errs }));
  await b.close();
})();
