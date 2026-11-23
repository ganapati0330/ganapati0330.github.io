// 「ひとつ前に もどす」の テスト（合戦・国取り）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(400);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#quickBtn'); await p.waitForTimeout(200); await p.click('#goBtn'); await p.waitForTimeout(3000);
  const R = {};
  // 1) まつ → もどす
  R.wait = await p.evaluate(() => {
    var u = unitsOf(G, G.playerSide).filter(x => x.type === 'ashigaru')[0];
    onTapHex(u.c, u.r); onTapHex(u.c, u.r);   // えらんで もう一度 ＝ まつ
    var acted = u.acted, btn = !!document.getElementById('undoBtn');
    document.getElementById('undoBtn').click();
    return { acted, btn, after: u.acted };
  });
  // 2) 移動して ほかを クリック（＝まつ）→ もどす で 元の 場所へ
  R.move = await p.evaluate(async () => {
    var u = unitsOf(G, G.playerSide).filter(x => x.type === 'kiba')[0], c0 = u.c, r0 = u.r;
    onTapHex(u.c, u.r);
    var ks = Object.keys(reach).filter(k => k !== '__from' && k !== c0 + ',' + r0 && !targets.length || true).filter(k => k !== '__from' && k !== c0 + ',' + r0);
    var p = ks[0].split(',').map(Number); onTapHex(p[0], p[1]);
    await new Promise(r => setTimeout(r, 1500));
    var moved = [u.c, u.r];
    onTapHex(0, 0);   // ほかを クリック ＝ まつ
    var acted = u.acted;
    document.getElementById('undoBtn').click();
    return { moved: moved[0] !== c0 || moved[1] !== r0, acted, back: u.c === c0 && u.r === r0, actedAfter: u.acted, movedFlag: u.moved };
  });
  // 3) ぜんぶ まつ → 自動で ターンが おわらず「もどす」が でる
  R.all = await p.evaluate(async () => {
    unitsOf(G, G.playerSide).forEach(u => { if (!u.acted) { selectUnit(u); finishUnit(); } });
    await new Promise(r => setTimeout(r, 800));
    var still = G.side === G.playerSide, btn = !!document.getElementById('undoBtn'), end = !!document.getElementById('endBtn2');
    document.getElementById('undoBtn').click();
    var left = unitsOf(G, G.playerSide).filter(u => !u.acted).length;
    return { still, btn, end, left };
  });
  // 4) こうげきの あとは もどせない
  R.attack = await p.evaluate(() => { clearUndo(); return { n: undoStack.length }; });
  // 5) 国取り：徴兵 → もどす
  await p.evaluate(() => { G = null; });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300);
  for (let i = 0; i < 6; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  R.kuni = await p.evaluate(() => {
    var g0 = KS.clans[KS.player].gold, n0 = KS.provs[kSel].units.length;
    kRecruitBox(); document.querySelector('#kBox button.pm[data-t="ashigaru"][data-d="1"]').click(); var ok = document.getElementById('kRecOk');
    ok.click();
    var g1 = KS.clans[KS.player].gold, n1 = KS.provs[kSel].units.length, acted = didCmd(KS.provs[kSel], 'recruit');
    var btn = [...document.querySelectorAll('#kActs button')].find(x => x.textContent.indexOf('もどす') >= 0);
    if (btn) btn.click();
    return { g0, g1, n0, n1, acted, btn: !!btn, g2: KS.clans[KS.player].gold, n2: KS.provs[kSel].units.length, acted2: didCmd(KS.provs[kSel], 'recruit') };
  });
  console.log(JSON.stringify({ R, errs }));
  await b.close();
})();
