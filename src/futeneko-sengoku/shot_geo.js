// 実地形の 合戦マップを いくつか 撮る ＋ プレイヤーの 退却を ためす
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const cases = [['hoki', 'mimasaka', 'atk'], ['yoshida', 'sato', 'def'], ['inaba', 'mimasaka', 'atk'], ['sato', 'suo', 'atk'], ['izumo', 'bingon', 'atk'], ['iwamie', 'oasa', 'def']];
  for (const [vp, tag] of [[{ width: 1280, height: 800 }, 'pc'], [{ width: 390, height: 780 }, 'sp']]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: tag === 'sp' ? 2 : 1 });
    p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack||'').split('\n').slice(1,4).join(' | ')));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300);
    for (let i = 0; i < 6; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
    const list = tag === 'pc' ? cases : cases.slice(0, 2);
    for (const [to, from, side] of list) {
      const info = await p.evaluate(([to, from, side]) => {
        PROVS.forEach(pp => { if (pp.id !== to && pp.id !== from) KS.provs[pp.id].owner = 'amago'; });
        var me = 'mori', en = 'amago';
        KS.provs[from].owner = side === 'atk' ? me : en; KS.provs[to].owner = side === 'atk' ? en : me;
        ADJ[to].forEach(q => { if (q !== from) KS.provs[q].owner = KS.provs[to].owner; });
        var mk = (k, n) => { var a = []; for (var i = 0; i < n; i++) a.push({ uid: k + Date.now() + i, type: ['ashigaru', 'yumi', 'kiba', 'teppo', 'kosaku'][i % 5], hp: 10 }); return a; };
        KS.provs[from].units = mk('a', 8); KS.provs[to].units = mk('d', 6);
        var bt = makeBattle(KS, from, to, KS.provs[from].units.map(u => u.uid));
        startBattle(KS, bt); bt.playerSide = side; kFightBattle(bt);
        return { log: LOG[0] && LOG[0].text, ex: G.exits.def.length, north: G.north };
      }, [to, from, side]);
      await p.waitForTimeout(1900);
      await p.evaluate(() => { fitCamera(); });
      await p.waitForTimeout(200);
      await p.screenshot({ path: `geo_${tag}_${to}_${from}.png` });
      console.log(tag, to, from, JSON.stringify(info));
    }
    // 退却：守りの 足軽を 退き口に おいて にげる
    const fl = await p.evaluate(() => {
      var u = unitsOf(G, G.playerSide).filter(x => x.type === 'ashigaru')[0]; var e = G.exits[G.playerSide][0];
      if (!u || !e) return 'no';
      u.c = e.c; u.r = e.r; selectUnit(u);
      var btn = [...document.querySelectorAll('#actBar button')].find(x => x.textContent.indexOf('にげる') >= 0);
      if (!btn) return 'nobtn'; btn.click();
      return { fled: u.fled, to: u.fledName, alive: unitsOf(G, G.playerSide).length, esc: escaped(G, G.playerSide).length };
    });
    console.log(tag, 'flee', JSON.stringify(fl));
    await p.close();
  }
  console.log('errs', errs);
  await b.close();
})();
