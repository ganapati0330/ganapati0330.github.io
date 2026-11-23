const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 1280, height: 720 }, { width: 844, height: 390 }]) {
    const p = await b.newPage({ viewport: vp });
    await p.goto('file:///home/claude/work/dist/index.html'); await p.waitForTimeout(200);
    await p.click('#startBtn'); await p.click('#goBtn'); await p.waitForTimeout(1500);
    // 何か1体選んで下パネルを大きくした状態でも調べる
    const res = await p.evaluate(() => {
      function chk() {
        var out = []; var rc = canvas.getBoundingClientRect();
        unitsOf(G, G.playerSide).forEach(function (u) {
          var h = hexCenter(u.c, u.r), x = rc.left + cam.x + h[0] * cam.s, y = rc.top + cam.y + h[1] * cam.s;
          var el = document.elementFromPoint(x, y);
          if (el !== canvas) out.push(u.type + '@' + Math.round(y) + '→' + (el ? (el.id || el.className) : 'none'));
        });
        return out;
      }
      logMsg('テスト1');logMsg('テスト2');logMsg('テスト3');
      var a = chk();
      selectUnit(unitsOf(G, G.playerSide).filter(x => x.type === 'kiba')[0]);
      var bpanel = document.getElementById('bottom').getBoundingClientRect().top;
      var b2 = chk();
      return { blockedIdle: a, blockedSelected: b2, panelTop: Math.round(bpanel), H: innerHeight };
    });
    console.log(vp.width + 'x' + vp.height, JSON.stringify(res));
    await p.close();
  }
  await b.close();
})();
