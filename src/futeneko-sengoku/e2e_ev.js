const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300);
  await p.click('#kBtns .act'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'ev_katoku.png' });
  const t1 = await p.textContent('#kTitle');
  await p.click('#kBtns .act'); await p.waitForTimeout(200);
  // 1525年 春へ
  await p.evaluate(() => { KS.year = 1524; KS.season = 3; KS.firedEv.aioi = 1; kSave(); kEndSeason(); });
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(400); const s = await p.evaluate(() => ({ ph: KS.phase, t: document.getElementById('kBox').classList.contains('on') ? document.getElementById('kTitle').textContent : '' })); if (s.t === '尼子か、大内か') break; if (s.t) { const o = await p.$('#kBox.on #kBtns .act:has-text("おまかせ")'); if (o) await o.click(); else if (s.t !== '尼子か、大内か') await p.click('#kBtns .act'); } }
  await p.screenshot({ path: 'ev_choice.png' });
  const choiceBtns = await p.evaluate(() => Array.from(document.querySelectorAll('#kBtns .act')).map(x => x.textContent));
  await p.click('#kBtns .act'); await p.waitForTimeout(200);
  const ally = await p.evaluate(() => ({ amago: isAlly(KS, 'mori', 'amago'), ouchi: isAlly(KS, 'mori', 'ouchi') }));
  // 1554年で 厳島
  await p.evaluate(() => { KS = newCampaign({ clan: 'mori', face: 'fute', difficulty: 'normal', scenario: '1554' }); KS.pendingEvents = []; KS.year = 1555; KS.season = 1; KS.phase = 'player'; kSave(); openMap(); kEndSeason(); });
  let ttl = '';
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); ttl = await p.evaluate(() => document.getElementById('kBox').classList.contains('on') ? document.getElementById('kTitle').textContent : ''); if (ttl === '厳島の 戦い') break; if (ttl) { const o = await p.$('#kBox.on #kBtns .act:has-text("おまかせ")'); if (o) await o.click(); else await p.click('#kBtns .act'); } }
  await p.screenshot({ path: 'ev_itsukushima.png', fullPage: false });
  const after = await p.evaluate(() => ({ title: document.getElementById('kTitle').textContent, ouchiLord: CLANS.ouchi.lord, ouchiName: CLANS.ouchi.name }));
  await p.click('#kBtns .act'); await p.waitForTimeout(300);
  for (let i = 0; i < 6; i++) { const on = await p.evaluate(() => document.getElementById('kBox').classList.contains('on')); if (!on) break; await p.click('#kBtns .act'); await p.waitForTimeout(200); }
  await p.click('#kHistBtn'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'ev_hist.png' });
  // 保存→リロードで 当主が もどらないか
  await p.reload(); await p.waitForTimeout(300); await p.click('#startBtn'); await p.click('#contBtn'); await p.waitForTimeout(400);
  const resumed = await p.evaluate(() => ({ ouchiLord: CLANS.ouchi.lord, hist: KS.history.length }));
  console.log(JSON.stringify({ t1, choiceBtns, ally, after, resumed, errs }));
  await b.close();
})();
