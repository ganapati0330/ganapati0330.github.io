// 領内マップ：開墾・町・鉱山・名産・塩田
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const out = {}, errs = [];
  for (const [tag, vp] of [['pc', { width: 1280, height: 800 }], ['sp', { width: 390, height: 780 }]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
    p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300);
    for (let i = 0; i < 6; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
    out[tag] = await p.evaluate(() => {
      KS.clans[KS.player].gold = 400;
      // 石見東部（銀山）を じぶんの 国に して ためす
      KS.provs.iwamie.owner = KS.player; KS.year = 1530;
      kSel = 'iwamie'; kUpdate();
      [...document.querySelectorAll('#kActs button')].find(x => x.textContent.indexOf('内政') >= 0).click();
      var R = { open: document.getElementById('domScreen').classList.contains('on'), btns: [...document.querySelectorAll('#dActs .dbld')].map(x => x.textContent + (x.disabled ? '(x)' : '')) };
      var g0 = KS.clans[KS.player].gold, k0 = KS.provs.iwamie.koku, inc0 = bldIncome(KS, 'iwamie');
      function tryBuild(type) { DS.mode = type; domRender(); var ks = Object.keys(DS.valid || {}); if (!ks.length) return 'none'; var h = ks[0].split(',').map(Number); var q = domXY(h[0], h[1]); domTap(DS.x + q[0] * DS.s, DS.y + q[1] * DS.s); return ks.length; }
      R.field = tryBuild('field'); R.town = tryBuild('town'); R.mine = tryBuild('mine'); R.meib = tryBuild('meibutsu');
      R.koku = [k0, KS.provs.iwamie.koku]; R.gold = [g0, KS.clans[KS.player].gold]; R.inc = [inc0, bldIncome(KS, 'iwamie')]; R.built = DS.built;
      domUndo(); R.afterUndo = { built: DS.built, gold: KS.clans[KS.player].gold, inc: bldIncome(KS, 'iwamie') };
      return R;
    });
    await p.waitForTimeout(300);
    await p.evaluate(() => { DS.mode = 'field'; domFit(); domRender(); });
    await p.waitForTimeout(200);
    await p.screenshot({ path: `dom_${tag}.png` });
    // 合戦マップに 町が でるか
    out[tag].battle = await p.evaluate(() => { closeDomain(); var bt = makeBattle(KS, 'yoshida', 'sato', KS.provs.yoshida.units.map(u => u.uid)); startBattle(KS, bt); bt.playerSide = 'atk'; kFightBattle(bt); var n = 0; G.map.tiles.forEach(row => row.forEach(t => { if (t.bld) n++; })); return n; });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `dom_battle_${tag}.png` });
    await p.close();
  }
  console.log(JSON.stringify({ out, errs }));
  await b.close();
})();
