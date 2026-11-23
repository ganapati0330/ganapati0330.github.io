const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/work/dist/index.html'); await p.waitForTimeout(300);
  await p.click('#startBtn'); await p.click('#quickBtn'); await p.click('#goBtn'); await p.waitForTimeout(1600);
  // 実際の画面クリックで操作するヘルパ
  async function clickHex(c, r) {
    const xy = await p.evaluate(([c, r]) => { var h = hexCenter(c, r), rc = canvas.getBoundingClientRect(); return [rc.left + cam.x + h[0] * cam.s, rc.top + cam.y + h[1] * cam.s]; }, [c, r]);
    await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(80);
  }
  const R = {};
  // 1) 自分をもう一度クリック → まつ
  let u1 = await p.evaluate(() => { var u = unitsOf(G, G.playerSide).filter(x => x.type === 'yumi')[0]; return [u.id, u.c, u.r]; });
  await clickHex(u1[1], u1[2]); await clickHex(u1[1], u1[2]);
  R.waitBySelfClick = await p.evaluate(id => G.units.find(x => x.id === id).acted && !sel, u1[0]);
  // 2) 青マスへ移動 → 別の味方クリックで前の兵は まつ、新しい兵が選ばれる
  let mv = await p.evaluate(() => { var u = unitsOf(G, G.playerSide).filter(x => x.type === 'ashigaru')[0]; selectUnit(u); var ks = Object.keys(reach).filter(k => k !== '__from' && k !== u.c + ',' + u.r); deselect(); return [u.id, u.c, u.r, ks[0].split(',').map(Number)]; });
  await clickHex(mv[1], mv[2]); await clickHex(mv[3][0], mv[3][1]); await p.waitForTimeout(900);
  let other = await p.evaluate(() => { var u = unitsOf(G, G.playerSide).filter(x => !x.acted && !x.moved && x.type === 'kiba')[0]; return [u.id, u.c, u.r]; });
  await clickHex(other[1], other[2]);
  R.switchFinishes = await p.evaluate(([a, b]) => G.units.find(x => x.id === a).acted && sel && sel.id === b, [mv[0], other[0]]);
  // 3) 遠くの敵をクリック1回で 移動＋攻撃
  const setup = await p.evaluate(kid => {
    var k = G.units.find(x => x.id === kid);
    var e = unitsOf(G, G.cpuSide).filter(x => x.type === 'ashigaru')[0];
    // 騎馬の 3 マス先の平地に敵を置く
    for (var r = 0; r < G.map.h; r++) for (var c = 0; c < G.map.w; c++) { var t = tileAt(G, c, r); if (hexDist(c, r, k.c, k.r) === 3 && '.='.indexOf(t.ch) >= 0 && !unitAt(G, c, r)) { e.c = c; e.r = r; deselect(); selectUnit(k); var tg = targets.find(x => x.unit === e); return { e: e.id, at: [c, r], hasFar: !!(tg && tg.from) }; } }
    return null;
  }, other[0]);
  await clickHex(setup.at[0], setup.at[1]); await p.waitForTimeout(1600);
  R.oneClickAttack = await p.evaluate(([kid, eid]) => { var k = G.units.find(x => x.id === kid), e = G.units.find(x => x.id === eid); return { hasFar: true, kMoved: k.moved, kActed: k.acted, eHp: e.hp, adj: hexDist(k.c, k.r, e.c, e.r) }; }, [other[0], setup.e]);
  R.oneClickAttack.hasFar = setup.hasFar;
  await p.screenshot({ path: 'v16_after.png' });
  console.log(JSON.stringify({ R, errs }));
  await b.close();
})();
