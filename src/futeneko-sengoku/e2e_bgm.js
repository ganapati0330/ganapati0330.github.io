const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.screenshot({ path: 'bgm_title.png' });
  await p.click('#startBtn'); await p.waitForTimeout(2500);
  const r1 = await p.evaluate(() => ({ loaded: !!BGM.buf, dur: BGM.buf && BGM.buf.duration.toFixed(1), playing: !!BGM.src, loop: BGM.src && BGM.src.loop, ctx: AC && AC.state }));
  await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let __i = 0; __i < 5; __i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.click('#bgmBtn2'); await p.waitForTimeout(100);
  const r2 = await p.evaluate(() => ({ on: BGM.on, playing: !!BGM.src, label: document.getElementById('bgmBtn2').textContent, saved: localStorage.getItem('futeneko-sengoku-bgm') }));
  await p.reload(); await p.waitForTimeout(300);
  const r3 = await p.evaluate(() => ({ on: BGM.on, playing: !!BGM.src, label3: document.getElementById('bgmBtn3').textContent }));
  await p.click('#bgmBtn3'); await p.waitForTimeout(2000);
  const r4 = await p.evaluate(() => ({ on: BGM.on, playing: !!BGM.src }));
  console.log(JSON.stringify({ r1, r2, r3, r4, errs }));
  await b.close();
})();
