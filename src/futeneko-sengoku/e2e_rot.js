// スマホ縦持ち（自動で 90度 まわる）の 確認：表示・ボタン・地図タップ・ドラッグ・ピンチ・スクロール・横持ち
// node e2e_rot.js [url]
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8765/index.html';
// 自分の 国・となりの 敵の 国・タップする 国（中国地方版は yoshida sato iwamiw など）
const [HOME, ENEMY, TAPP] = (process.argv[3] || 'oura,ishikawa,hiyama').split(',');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  const out = {};
  await p.goto(URL); await p.waitForTimeout(500);
  out.rot = await p.evaluate(() => ({ ROT, cls: document.body.className, bw: document.body.offsetWidth, bh: document.body.offsetHeight }));
  await p.screenshot({ path: 'rot_title.png' });
  await p.tap('#startBtn'); await p.waitForTimeout(200);
  await p.tap('#ngBtn'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'rot_clan.png' });
  await p.tap('#kGoBtn'); await p.waitForTimeout(500);
  // 開始の できごとを とじる（ボタンを タップ）
  for (let i = 0; i < 10; i++) {
    const on = await p.evaluate(() => document.getElementById('kBox').classList.contains('on'));
    if (!on) break;
    if (i === 0) {
      // 長い 文の スクロール（指で 論理の 上へ ＝ 物理の 右から 左… ではなく、物理の 左へ スワイプ）
      const r = await p.evaluate(() => { var e = document.getElementById('kBody'); return { sh: e.scrollHeight, ch: e.clientHeight }; });
      const bb = await p.locator('#kBody').boundingBox();
      await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(bb.x + bb.width / 2), y: Math.round(bb.y + bb.height / 2), xDistance: 150, yDistance: 0, gestureSourceType: 'touch', speed: 600 });
      await p.waitForTimeout(300);
      out.scroll = Object.assign(r, { top: await p.evaluate(() => document.getElementById('kBody').scrollTop) });
      await p.screenshot({ path: 'rot_event.png' });
    }
    await p.tap('#kBtns .act >> nth=0'); await p.waitForTimeout(250);
  }
  await p.screenshot({ path: 'rot_map.png' });
  // 地図タップ：檜山の 城の ピンを 物理座標で タップ → kSel が 檜山に なるか
  const pt = await p.evaluate((TAPP) => {
    var cv = document.getElementById('kcv') || document.querySelector('#mapScreen canvas');
    var P = PROVS.filter(function (q) { return q.id === TAPP; })[0], w = kProj(P.pin[0], P.pin[1]);
    var lx = kMap.x + w[0] * kMap.s, ly = kMap.y + w[1] * kMap.s;
    // 要素の 論理位置（body 基準）
    var ox = 0, oy = 0, e = cv; while (e && e !== document.body) { ox += e.offsetLeft; oy += e.offsetTop; e = e.offsetParent; }
    var W = window.innerWidth;
    return { id: cv.id, lx: lx, ly: ly, X: W - (oy + ly), Y: ox + lx, inside: lx > 0 && ly > 0 && lx < cv.offsetWidth && ly < cv.offsetHeight };
  }, TAPP);
  out.pt = pt;
  await p.touchscreen.tap(pt.X, pt.Y); await p.waitForTimeout(400);
  out.selAfterTap = await p.evaluate(() => kSel);
  // ドラッグ：物理で 下へ 120px ＝ 論理で 左へ（地図の x が へる）
  const before = await p.evaluate(() => ({ x: kMap.x, y: kMap.y, s: kMap.s }));
  await p.mouse.move(200, 300); await p.mouse.down();
  for (let i = 1; i <= 6; i++) { await p.mouse.move(200, 300 + i * 20); await p.waitForTimeout(16); }
  await p.mouse.up();
  await p.waitForTimeout(200);
  const after = await p.evaluate(() => ({ x: kMap.x, y: kMap.y, s: kMap.s }));
  out.drag = { dx: Math.round(after.x - before.x), dy: Math.round(after.y - before.y) };
  // ピンチ（ひろげる）
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 380, id: 1 }, { x: 195, y: 420, id: 2 }] });
  for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 380 - i * 15, id: 1 }, { x: 195, y: 420 + i * 15, id: 2 }] }); await p.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(200);
  out.pinch = { s0: before.s, s1: await p.evaluate(() => kMap.s) };
  // 合戦の 画面
  await p.evaluate((a) => { var ids = KS.provs[a[0]].units.map(u => u.uid); var bt = makeBattle(KS, a[0], a[1], ids, null, []); bt.playerSide = 'atk'; startBattle(KS, bt); kFightBattle(bt); }, [HOME, ENEMY]);
  await p.waitForTimeout(1500);
  for (let i = 0; i < 5; i++) { const m = await p.$('.modal.on .act, .modal.on button.big'); if (!m) break; await m.tap(); await p.waitForTimeout(250); }
  await p.screenshot({ path: 'rot_battle.png' });
  // 合戦の 地図を タップ → 味方の 部隊を えらべるか
  const up = await p.evaluate(() => {
    var u = unitsOf(G, G.playerSide)[0]; var c = document.getElementById('cv');
    var wp = hexCenter(u.c, u.r); if (!wp) return null;
    var lx = (wp[0]) * cam.s + cam.x, ly = (wp[1]) * cam.s + cam.y;
    var ox = 0, oy = 0, e = c; while (e && e !== document.body) { ox += e.offsetLeft; oy += e.offsetTop; e = e.offsetParent; }
    return { X: window.innerWidth - (oy + ly), Y: ox + lx, uid: u.id || u.uid, inside: lx > 0 && ly > 0 && lx < c.offsetWidth && ly < c.offsetHeight };
  }).catch(e => ({ err: e.message }));
  out.unitPt = up;
  if (up && up.X) { await p.touchscreen.tap(up.X, up.Y); await p.waitForTimeout(300); out.selUnit = await p.evaluate(() => !!sel); }
  await p.screenshot({ path: 'rot_battle_sel.png' });
  // 横持ちに すると まわさない
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(500);
  out.land = await p.evaluate(() => ({ ROT, bw: document.body.offsetWidth, bh: document.body.offsetHeight, tr: document.body.style.transform }));
  await p.screenshot({ path: 'land_battle.png' });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
  out.back = await p.evaluate(() => ({ ROT, W: document.getElementById('cv').offsetWidth, H: document.getElementById('cv').offsetHeight }));
  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
