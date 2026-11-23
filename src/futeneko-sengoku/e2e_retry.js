const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/work/dist/index.html'); await p.click('#startBtn'); await p.click('#quickBtn'); await p.click('#goBtn'); await p.waitForTimeout(1500);
  await p.evaluate(() => { logMsg('まえの しあいの ログ'); G.over = true; G.winner = 'def'; G.reason = 'テスト'; gameOver(); });
  await p.waitForTimeout(1000);
  await p.click('#againBtn'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ n: LOG.length, txt: document.getElementById('logLine').textContent, turn: G.turn }));
  console.log(JSON.stringify({ r, errs })); await b.close();
})();
