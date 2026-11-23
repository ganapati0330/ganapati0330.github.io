const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const out = {};
  for (const [name, vp] of [['desk', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(400); for (let __i = 0; __i < 5; __i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
    await p.screenshot({ path: `m_${name}.png` });
    // 出陣モードの 表示
    await p.evaluate(() => { kSel = 'yoshida'; kMode = 'attack'; kUpdate(); }); await p.waitForTimeout(150);
    await p.screenshot({ path: `m_${name}_atk.png` });
    // 全部の国を クリックで えらべるか（家紋・国の中）
    const ok = await p.evaluate(() => {
      kMode = 'idle'; var bad = [];
      PROVS.forEach(function (pr) {
        var q = kMap.labels[pr.id], rc = kMap.cv.getBoundingClientRect();
        kTap(kMap.x + q[0] * kMap.s, kMap.y + q[1] * kMap.s); if (kSel !== pr.id) bad.push('label:' + pr.id);
        var pin = kProj(pr.pin[0], pr.pin[1]); kTap(kMap.x + pin[0] * kMap.s, kMap.y + pin[1] * kMap.s); if (kSel !== pr.id) bad.push('pin:' + pr.id);
      });
      return bad;
    });
    out[name] = { bad: ok, errs };
    await p.close();
  }
  console.log(JSON.stringify(out));
  await b.close();
})();
