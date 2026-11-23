const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
 const p = await (await b.newContext({ viewport: { width: 765, height: 760 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
 await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(400);
 for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
 await p.evaluate(() => { kSel = 'yoshida'; kRecruitBox(); }); await p.waitForTimeout(200);
 await p.click('#kBody .pm[data-t="ashigaru"][data-d="10"]'); await p.waitForTimeout(100);
 await p.screenshot({ path: 'rec.png' }); console.log('errs', errs); await b.close(); })();
