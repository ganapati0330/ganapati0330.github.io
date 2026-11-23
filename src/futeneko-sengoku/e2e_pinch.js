// ピンチ・ドラッグで 画面が とばないか（3画面）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300);
  for (let i = 0; i < 6; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  // 2本指を まねる
  const gesture = (id, getCam) => p.evaluate(([id, getCam]) => {
    var cv = document.getElementById(id), rc = cv.getBoundingClientRect(), cam = new Function('return ' + getCam);
    function ev(type, pid, x, y) { cv.dispatchEvent(new PointerEvent(type, { pointerId: pid, clientX: rc.left + x, clientY: rc.top + y, bubbles: true, cancelable: true, pointerType: 'touch' })); }
    var c0 = cam(), mid0 = [195, 400], w0 = [(mid0[0] - c0.x) / c0.s, (mid0[1] - c0.y) / c0.s];
    ev('pointerdown', 1, 145, 400); ev('pointerdown', 2, 245, 400);
    var maxErr = 0;
    for (var k = 1; k <= 20; k++) {
      var sp = 50 + k * 4, sh = k * 3;   // ひろげながら すこし 動かす
      ev('pointermove', 1, 195 - sp + sh, 400 + sh); ev('pointermove', 2, 195 + sp + sh, 400 + sh);
      var c = cam(), mid = [195 + sh, 400 + sh], w = [(mid[0] - c.x) / c.s, (mid[1] - c.y) / c.s];
      maxErr = Math.max(maxErr, Math.hypot(w[0] - w0[0], w[1] - w0[1]) * c.s);
    }
    var c1 = cam();
    ev('pointerup', 2, 195 + 130 + 60, 460);   // 1本 はなす
    ev('pointermove', 1, 195 - 130 + 60 + 5, 465);   // のこった 指を すこし 動かす
    var c2 = cam(); ev('pointerup', 1, 195 - 130 + 65, 465);
    return { zoom: +(c1.s / c0.s).toFixed(2), anchorErrPx: +maxErr.toFixed(2), jumpAfterLift: +Math.hypot(c2.x - c1.x, c2.y - c1.y).toFixed(1) };
  }, [id, getCam]);
  const R = {};
  R.kuni = await gesture('kcv', '({x:kMap.x,y:kMap.y,s:kMap.s})');
  await p.evaluate(() => { openDomain('yoshida'); });
  R.dom = await gesture('dcv', '({x:DS.x,y:DS.y,s:DS.s})');
  await p.evaluate(() => { closeDomain(); var bt = makeBattle(KS, 'yoshida', 'sato', KS.provs.yoshida.units.map(u => u.uid)); startBattle(KS, bt); bt.playerSide = 'atk'; kFightBattle(bt); cam.s = 0.6; });
  await p.waitForTimeout(2500);
  R.battle = await gesture('cv', '({x:cam.x,y:cam.y,s:cam.s})');
  console.log(JSON.stringify({ R, errs }));
  await b.close();
})();
