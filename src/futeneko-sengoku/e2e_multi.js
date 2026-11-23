// 1つの 国で 1きせつに 複数の めいれい
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300);
  for (let i = 0; i < 6; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  const R = await p.evaluate(() => {
    KS.clans[KS.player].gold = 500;
    var labels = () => [...document.querySelectorAll('#kActs button')].map(x => x.textContent + (x.disabled ? '(x)' : ''));
    kSel = 'yoshida'; kUpdate();
    var l0 = labels();
    kRecruitBox(); document.querySelector('#kBox button.pm[data-t="ashigaru"][data-d="1"]').click(); document.getElementById('kRecOk').click();
    var l1 = labels();
    var gB = KS.clans[KS.player].gold; openDomain('yoshida'); DS.mode = 'field'; domRender(); var vk = Object.keys(DS.valid)[0].split(',').map(Number), q = domXY(vk[0], vk[1]); domTap(DS.x + q[0] * DS.s, DS.y + q[1] * DS.s); closeDomain(); kSel = 'yoshida'; kUpdate();
    var devTxt = 'field', devSpent = gB - KS.clans[KS.player].gold, devp = KS.provs.yoshida.koku;
    var l2 = labels();
    kAssignBox && 0;
    // 3つめ：調略（内応）→ 4つめは できない
    kSchemeBox('yoshida', 'sato'); var ss = document.getElementById('kSchAmt'); var pLow = (ss.value = 10, ss.oninput(), document.getElementById('ksNaioP').textContent); var pHigh = (ss.value = 80, ss.oninput(), document.getElementById('ksNaioP').textContent); var gS = KS.clans[KS.player].gold;
    document.getElementById('ksNaio').click(); var schSpent = gS - KS.clans[KS.player].gold; var r3 = { ok: true };
    var l3 = labels();
    var dot = cmdCount(KS.provs.yoshida);
    return { devTxt, devSpent, devp, pLow, pHigh, schSpent, l3, done: KS.provs.yoshida.done, dot, hint: document.getElementById('kInfo') ? document.getElementById('kInfo').textContent.slice(-60) : '' };
  });
  console.log(JSON.stringify({ R, errs }));
  await b.close();
})();
