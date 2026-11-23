/* ===== フテ猫 毛利元就の戦国シミュレーション : 史実イベント（DOM非依存） ===== */
'use strict';
// 話す人：'@毛利元就' のように 名前。'#語り' は ナレーション。
// when: [年, 季節(0春1夏2秋3冬)]、scen: その シナリオだけ、cond(S)、apply(S, choice)
function lordName(S, cid) { return CLANS[cid] ? CLANS[cid].lord : ''; }
function alive(S, cid) { return !!(S.clans[cid] && S.clans[cid].alive); }
function hasOff(S, id, cid) { var o = S.officers && S.officers[id]; return !!(o && (!cid || o.clan === cid)); }

var EVENTS = [
  { id:'katoku', when:[1523, 1], scen:'1523', title:'元就、毛利家を つぐ',
    cond: function (S) { return alive(S, 'mori'); },
    lines: [['志道広良', '幸松丸さまが なくなられた 今、毛利を まとめられるのは 元就さましか おりませぬ。'],
            ['毛利元就', 'わかった。この 元就が 毛利家を ひきいよう。小さな 家だが、かならず 大きく してみせる。']],
    note:'1523年、毛利家の 当主・幸松丸が 9さいで なくなり、叔父の 元就（27さい）が 重臣たちに おされて 家督を つぎました。このころの 毛利は 安芸の 小さな 国人で、出雲の 尼子家に したがっていました。' },

  { id:'aioi', when:[1524, 0], scen:'1523', title:'相合元綱の 謀反',
    cond: function (S) { return alive(S, 'mori'); },
    lines: [['志道広良', '殿、一大事！ 坂・渡辺の 者どもが 弟君の 元綱さまを かつぎ、殿に 謀反を くわだてて おります！'],
            ['毛利元就', '……いたしかたない。毛利の 家を まもるためだ。'],
            ['#語り', '元就は 弟の 元綱を 討ち、家中を まとめた。']],
    note:'元就の 家督相続に 不満な 家臣たちが、尼子経久の 後押しを うけて、元就の 異母弟・相合元綱を 当主に しようと しました。元就は これを 討ちました。この 一件で、元就は 尼子に 不信を いだくように なります。' },

  { id:'to_ouchi', when:[1525, 0], scen:'1523', title:'尼子か、大内か',
    cond: function (S) { return alive(S, 'mori') && alive(S, 'amago') && alive(S, 'ouchi') && isAlly(S, 'mori', 'amago'); },
    lines: [['毛利元就', '尼子は 毛利を 下に みて、家の ことにまで 口を だしてくる。このまま 尼子に つくべきか……。'],
            ['陶興房', '毛利どの。大内は 毛利を こころから むかえますぞ。']],
    choices: [
      { label:'大内に つく（史実）', apply: function (S) { breakAlliance(S, 'mori', 'amago', '毛利が 大内に ついた'); if (!isAlly(S, 'mori', 'ouchi')) S.allies.push(['mori', 'ouchi']); logC(S, '毛利家と 大内家が 同盟を むすんだ', 'good'); } },
      { label:'尼子に のこる', apply: function (S) { logC(S, '毛利家は 尼子方に のこった', 'sys'); } }
    ],
    note:'1525年、元就は 尼子と 手を 切り、西国 一の 大名・大内義興の 側に つきました。以後、元就は 大内の 力を 背景に、安芸の 国人たちを まとめて いきます。' },

  { id:'ginzan', when:[1527, 0], scen:'1523', title:'石見銀山の 開発',
    cond: function (S) { return true; },
    lines: [['神屋寿禎', '石見の 山から 銀が ざくざく 出るぞ！ これは 大きな 宝の 山だ！']],
    note:'博多の 商人・神屋寿禎が 石見銀山（大森銀山）の 開発を はじめました。のちに「灰吹法」という 技術で 生産が 大きく ふえ、大内・尼子・毛利が この 銀山を うばいあいました。ゲームでは 石見東部の 収入が ふえます。' },

  { id:'yoshioki_d', when:[1528, 3], scen:'1523', title:'大内義興、死す',
    cond: function (S) { return alive(S, 'ouchi') && lordName(S, 'ouchi') === '大内義興'; },
    apply: function (S) { setLord(S, 'ouchi', '大内義隆', [48, 80, 72], 'yoshitaka'); },
    lines: [['大内義隆', '父上の あとは この 義隆が つぐ。大内の 都・山口を さらに さかえさせよう。']],
    note:'1528年、大内義興が なくなり、子の 義隆が あとを つぎました。義隆は 京都の 文化を このみ、山口は「西の京」と よばれるほど さかえました。' },

  { id:'koriyama', when:[1540, 2], title:'吉田郡山城の 戦い',
    cond: function (S) { return alive(S, 'mori') && alive(S, 'amago') && !isAlly(S, 'mori', 'amago') && S.scenario === '1523' && provsOf(S, 'mori').indexOf('yoshida') >= 0; },
    apply: function (S) {
      var P = S.provs.yoshida;
      if (isAlly(S, 'mori', 'ouchi')) for (var i = 0; i < 2 && P.units.length < PROV_CAP; i++) P.units.push(newUnit(S, 'ashigaru'));
      var A = S.provs.izumo; if (A.owner === 'amago') for (var j = 0; j < 4 && A.units.length < PROV_CAP; j++) A.units.push(newUnit(S, 'ashigaru'));
    },
    lines: [['尼子詮久', '毛利を ひねりつぶせ！ 3万の 兵で 吉田を かこむのだ！'],
            ['毛利元就', '城に こもって たえしのべ。領民も みな 城に いれよ。かならず 大内の 援軍が くる！'],
            ['陶隆房', '毛利どの、大内の 援軍 まいった！ ともに 尼子を うちはらおうぞ！']],
    note:'1540〜41年、尼子詮久（のちの 晴久）が 約3万の 大軍で 吉田郡山城を かこみました。元就は 約2400の 兵と 領民で 城に こもり、大内の 陶隆房の 援軍と ともに 尼子軍を 追いはらいました。この 勝利で 元就の 名は 中国地方に ひろまりました。ゲームでは 大内と 同盟して いれば 吉田に 足軽の 援軍が きます（尼子も 出雲で 兵を あつめます）。' },

  { id:'tsunehisa_d', when:[1541, 3], scen:'1523', title:'尼子経久、死す',
    cond: function (S) { return alive(S, 'amago') && lordName(S, 'amago') === '尼子経久'; },
    apply: function (S) { setLord(S, 'amago', '尼子晴久', [80, 72, 72], 'haruhisa'); },
    lines: [['尼子経久', '……晴久よ、尼子を たのむぞ……'], ['尼子晴久', 'おじいさまの ゆめ、この 晴久が つぎます。']],
    note:'1541年、「謀将」と よばれた 尼子経久が 84さいで なくなりました。孫の 晴久（詮久）が あとを つぎ、尼子家は この あと 最大の 勢力を きずきます。' },

  { id:'gassan1', when:[1542, 2], scen:'1523', title:'大内の 出雲遠征',
    cond: function (S) { return alive(S, 'ouchi') && alive(S, 'amago') && S.player !== 'ouchi'; },
    apply: function (S) { provsOf(S, 'ouchi').forEach(function (pid) { S.provs[pid].units.forEach(function (u) { u.hp = Math.max(2, u.hp - 3); }); }); },
    lines: [['大内義隆', '尼子を たおす！ 出雲の 月山富田城へ すすめ！'],
            ['#語り', 'しかし 城は かたく、大内軍は 大敗。元就も 命からがら 安芸へ にげかえった……']],
    note:'1542〜43年、大内義隆は 大軍で 出雲に せめこみましたが、月山富田城を 落とせず 大敗しました（第一次月山富田城の 戦い）。養子の 晴持も なくなり、義隆は 戦を きらうように なります。ゲームでは 大内の へいが よわります。' },

  { id:'teppo', when:[1543, 0], title:'鉄砲 伝来',
    cond: function (S) { return true; },
    lines: [['#語り', '南の 種子島に、遠い 国から 鉄砲が つたわった。']],
    note:'1543年、種子島に ポルトガル人が 来て 鉄砲が 伝わったと されます（年には 諸説あり）。やがて 日本じゅうで つくられ、戦の やりかたを かえて いきます。ゲームでは ここから 鉄砲隊が ふつうの ねだんで やとえます（それまでは 明（中国）などから 入った めずらしい 火器として ねだん 2ばい）。' },

  { id:'takakage', when:[1544, 1], title:'隆景、小早川家へ',
    cond: function (S) { return alive(S, 'mori') && alive(S, 'kobayakawa') && S.player !== 'kobayakawa' && hasOff(S, 'takakage', 'mori'); },
    apply: function (S) { absorbClan(S, 'mori', 'kobayakawa', 'takakage'); },
    lines: [['毛利元就', '隆景よ、小早川の 家を つぎ、毛利を 助けよ。'],
            ['小早川隆景', 'はい、父上。小早川の 水軍、毛利の ために つかいましょう。']],
    note:'1544年、元就の 三男・隆景が 安芸の 小早川家（竹原）の 養子と なり、のちに 沼田 小早川家も まとめました。こうして 瀬戸内の 水軍を もつ 小早川家が 毛利の 味方に なりました。ゲームでは 小早川家が 毛利に くわわります。' },

  { id:'inkyo', when:[1546, 0], title:'家督を 隆元へ',
    cond: function (S) { return alive(S, 'mori') && hasOff(S, 'takamoto', 'mori') && lordName(S, 'mori') === '毛利元就'; },
    lines: [['毛利元就', '家督は 隆元に ゆずる。だが まだ まだ 目は はなさぬぞ。'], ['毛利隆元', '父上の おしえ、むねに きざみます。']],
    note:'1546年ごろ、元就は 長男の 隆元に 家督を ゆずり 隠居しました。しかし じっさいの 政治や 戦は ひきつづき 元就が うごかしました。' },

  { id:'motoharu', when:[1547, 1], title:'元春、吉川家へ',
    cond: function (S) { return alive(S, 'mori') && alive(S, 'kikkawa') && S.player !== 'kikkawa' && hasOff(S, 'motoharu', 'mori'); },
    apply: function (S) { absorbClan(S, 'mori', 'kikkawa', 'motoharu'); },
    lines: [['毛利元就', '元春、吉川の 家を たのむ。'], ['吉川元春', '吉川の 家は この 元春が まもります！ 戦なら おまかせを！']],
    note:'1547年、元就の 次男・元春が 母の 実家である 吉川家の 養子と なりました。元春は 生涯 負けしらずと いわれる 猛将で、のちに 山陰の 戦を まかされます。ゲームでは 吉川家が 毛利に くわわります。' },

  { id:'taineiji', when:[1551, 2], title:'大寧寺の変',
    cond: function (S) { return alive(S, 'ouchi') && (lordName(S, 'ouchi') === '大内義隆' || lordName(S, 'ouchi') === '大内義興'); },
    apply: function (S) { setLord(S, 'ouchi', '陶晴賢', [90, 58, 70], 'harukata', { name:'陶家（大内）', crest:'陶' }); },
    lines: [['陶隆房', '義隆さまは 武の みちを わすれ、あそびに ふけって おられる。大内は この 陶が たてなおす！'],
            ['#語り', '陶隆房は 兵を あげ、主君・大内義隆は 長門の 大寧寺で 自害した。隆房は 名を 晴賢と あらためた。']],
    note:'1551年、大内家の 重臣・陶隆房（のちの 晴賢）が 謀反を おこし、主君の 大内義隆は 長門の 大寧寺で 自害しました。晴賢は 大友家から 大内義長を 当主に むかえ、実権を にぎりました。' },

  { id:'bogei', when:[1554, 0], title:'防芸引分',
    cond: function (S) { return alive(S, 'mori') && alive(S, 'ouchi') && lordName(S, 'ouchi') === '陶晴賢'; },
    apply: function (S) { if (isAlly(S, 'mori', 'ouchi')) breakAlliance(S, 'mori', 'ouchi', '防芸引分'); },
    lines: [['毛利元就', '陶とは もう ともに あゆめぬ。毛利は 陶と たたかう！'],
            ['陶晴賢', '安芸の 国人ふぜいが、この 陶に さからうか！']],
    note:'1554年、元就は 陶晴賢と 手を 切り、安芸の 陶方の 城を つぎつぎに 落としました（防芸引分）。いよいよ 毛利と 陶の 決戦が ちかづきます。' },

  { id:'shingu', when:[1554, 3], title:'新宮党の 粛清',
    cond: function (S) { return alive(S, 'amago') && (hasOff(S, 'kunihisa', 'amago') || hasOff(S, 'sanehisa', 'amago')); },
    apply: function (S) { ['kunihisa', 'sanehisa'].forEach(function (id) { var o = S.officers[id]; if (o && o.clan === 'amago') { if (o.prov) S.provs[o.prov].officer = null; delete S.officers[id]; } }); autoAssign(S, 'amago', S.player !== 'amago'); },
    lines: [['尼子晴久', '新宮党は 力を もちすぎた。……ゆるせ、叔父上。'],
            ['#語り', '尼子の 精鋭「新宮党」を ひきいる 尼子国久・誠久は 討たれた。']],
    note:'1554年、尼子晴久は 一族の 精鋭部隊「新宮党」を ひきいる 叔父の 国久・誠久らを 討ちました。元就の 謀略が あったとも いわれます。尼子家は 大きな 戦力を うしないました。' },

  { id:'itsukushima', when:[1555, 2], title:'厳島の 戦い',
    cond: function (S) { return alive(S, 'mori') && alive(S, 'ouchi') && lordName(S, 'ouchi') === '陶晴賢' && !isAlly(S, 'mori', 'ouchi') && S.player !== 'ouchi'; },
    apply: function (S) {
      provsOf(S, 'ouchi').forEach(function (pid) { S.provs[pid].units.forEach(function (u) { u.hp = Math.max(1, u.hp - 4); }); });
      setLord(S, 'ouchi', '大内義長', [40, 50, 40], 'yoshinaga', { name:'大内家', crest:'大' });
      S.clans.mori.gold += 20;
    },
    lines: [['毛利元就', '厳島の 宮尾城に 陶の 大軍を さそいこむ。せまい 島では 大軍は うごけぬ。'],
            ['小早川隆景', '村上水軍も 味方に つけました。嵐の 夜に 海を わたりましょう！'],
            ['吉川元春', 'うしろの 山から 一気に せめおとす！ いくぞ！'],
            ['陶晴賢', 'し、しまった……！ これは 毛利の わなか……！'],
            ['#語り', '陶軍は 総くずれと なり、陶晴賢は 厳島で 自害した。']],
    note:'1555年10月、元就は 厳島（宮島）に 陶晴賢の 大軍（約2万とも いわれる）を さそいこみ、嵐の 夜に 奇襲して 大勝しました。晴賢は 自害し、この 勝利で 毛利が 中国地方の 主役に なりました。日本三大奇襲の 一つと いわれます。ゲームでは 陶（大内）の へいが 大きく よわります。' },

  { id:'sanbon', when:[1557, 3], title:'三本の矢',
    cond: function (S) { return alive(S, 'mori') && ['takamoto', 'motoharu', 'takakage'].filter(function (id) { return hasOff(S, id, 'mori'); }).length >= 2; },
    apply: function (S) { ['takamoto', 'motoharu', 'takakage'].forEach(function (id) { var o = S.officers[id]; if (o && o.clan === 'mori') o.st = o.st.map(function (v) { return Math.min(100, v + 3); }); }); },
    lines: [['毛利元就', '一本の 矢は たやすく 折れる。だが 三本 たばねれば、かんたんには 折れぬ。'],
            ['毛利元就', '隆元・元春・隆景、三人が 心を ひとつに すれば、毛利は けっして ほろびぬ。'],
            ['毛利隆元', '父上の 教え、けっして わすれませぬ。'],
            ['吉川元春', '兄上を ささえて まいります！'],
            ['小早川隆景', '三人 力を あわせましょう。']],
    note:'1557年、元就は 3人の 息子に 長い 手紙「三子教訓状」を 書き、兄弟が 力を あわせる 大切さを 説きました。有名な「三本の矢」の 話は、この 手紙を もとに 後の 時代に つくられた 逸話です。ゲームでは 3人の 能力が すこし あがります。' },

  { id:'ouchi_end', when:[1557, 1], title:'大内家の 最後',
    cond: function (S) { return alive(S, 'ouchi') && lordName(S, 'ouchi') === '大内義長' && S.player !== 'ouchi'; },
    lines: [['#語り', '周防・長門に 毛利軍が せまり、大内義長は 長門で 自害した……（史実）']],
    note:'厳島の 戦いの あと、元就は 周防・長門へ せめこみ（防長経略）、1557年に 大内義長は 自害、名門 大内家は ほろびました。ゲームでは まだ 大内家が のこって いるので、決着は あなた しだいです。' },

  { id:'haruhisa_d', when:[1560, 3], title:'尼子晴久、死す',
    cond: function (S) { return alive(S, 'amago') && lordName(S, 'amago') === '尼子晴久'; },
    apply: function (S) { setLord(S, 'amago', '尼子義久', [55, 60, 58]); },
    lines: [['尼子義久', '父上の あとは わたしが つぐ。月山富田城は 落とさせぬ。']],
    note:'1560年（一説に 1561年）、尼子晴久が とつぜん なくなり、子の 義久が あとを つぎました。尼子家は この あと 毛利に おされ、1566年に 月山富田城が 落ちて 戦国大名としての 尼子家は ほろびます。' },

  { id:'motonari_d', when:[1571, 1], title:'元就、死す',
    cond: function (S) { return alive(S, 'mori') && lordName(S, 'mori') === '毛利元就'; },
    apply: function (S) { setLord(S, 'mori', '毛利輝元', [62, 72, 66]); },
    lines: [['毛利元就', '……毛利は 天下を のぞむな。中国を まもり、家を たもつのだ……'],
            ['毛利輝元', 'おじいさま……。この 輝元、元春おじ・隆景おじと ともに 毛利を まもります。']],
    note:'1571年、毛利元就は 吉田郡山城で 75さいの 生涯を とじました。小さな 国人から 中国地方 10か国を おさめる 大大名に なった 元就の あとは、孫の 輝元が つぎ、吉川元春・小早川隆景の「両川」が ささえました。' }
];

// 家臣の 加入・寝返り・死去の セリフ
var OFF_SAY = {
  shiji:     { die:'殿……毛利の ゆくすえを、たのみますぞ……' },
  takamoto:  { join:'父上、隆元 ただいま もどりました。毛利の ため 力を つくします。', die:'……父上、さきに ゆく ふこうを おゆるしください……' },
  motoharu:  { join:'吉川元春、見参！ 戦なら この 元春に おまかせを！' },
  takakage:  { join:'小早川隆景に ございます。知恵で 父上を おたすけします。' },
  kumagai:   { join:'毛利どのの もとで はたらこう。', defect:'武田に ついていても 先は ない。これからは 毛利どのに 力を かそう！' },
  shishido:  { join:'宍戸隆家、毛利と 縁を むすび、ともに 戦いまする。' },
  nomi:      { join:'乃美宗勝、海の 戦なら まかされよ！' },
  kodama:    { join:'児玉就忠、算用（お金の 計算）なら おまかせを。' },
  harukata:  { join:'陶隆房、大内の ために この 刀を ふるおう。' },
  hironaka:  { join:'弘中隆包、知恵と 武で 大内を ささえまする。' },
  shikanosuke:{ join:'願わくば、我に 七難八苦を 与えたまえ！ 尼子の ために この 身を ささげる！', die:'尼子の 再興、かなわなかったか……' },
  naoie:     { join:'宇喜多直家……いずれ この 備前を おさめて みせよう。' },
  okifusa:   { die:'晴賢……いや、隆房よ、大内を たのむ……' },
  kunihisa:  { die:'晴久め……新宮党を うたがうとは……' }
};

// ---- 当主の 交代 ----
function setLord(S, cid, name, st, removeOff, extra) {
  S.clanOv = S.clanOv || {};
  var ov = S.clanOv[cid] || {}; ov.lord = name; if (extra) { if (extra.name) ov.name = extra.name; if (extra.crest) ov.crest = extra.crest; }
  S.clanOv[cid] = ov;
  applyClanOv(S);
  var L = S.officers && S.officers[lordId(cid)];
  if (L) { L.name = name; L.st = st.slice(); }
  if (removeOff && S.officers && S.officers[removeOff]) { var o = S.officers[removeOff]; if (o.prov) S.provs[o.prov].officer = null; delete S.officers[removeOff]; }
  if (S.seenOff && removeOff) S.seenOff[removeOff] = 1;
  logC(S, CLANS[cid].name + 'の 当主が ' + name + 'に かわった', cid === S.player ? 'good' : 'sys');
}
function applyClanOv(S) { var ov = S.clanOv || {}; for (var cid in ov) if (CLANS[cid]) { for (var k in ov[cid]) CLANS[cid][k] = ov[cid][k]; } }
// 家ごと したがう（養子 など）
function absorbClan(S, to, from, newLordOff) {
  if (!alive(S, from) || !alive(S, to)) return;
  provsOf(S, from).forEach(function (pid) { S.provs[pid].owner = to; });
  if (S.castles) for (var k in S.castles) if (S.castles[k].owner === from) S.castles[k].owner = to;
  officersOf(S, from).forEach(function (o) { o.clan = to; o.lord = false; });
  S.allies = (S.allies || []).filter(function (p) { return p[0] !== from && p[1] !== from; });
  S.clans[to].gold += Math.floor(S.clans[from].gold / 2);
  S.clans[from].alive = false;
  logC(S, CLANS[from].name + 'が ' + CLANS[to].name + 'に くわわった', to === S.player ? 'good' : 'sys');
  autoAssign(S, to, to !== S.player);
  if (newLordOff && S.officers[newLordOff]) {
    var home = provsOf(S, to).filter(function (pid) { return PROV_BY[pid] && START_FROM(S, from).indexOf(pid) >= 0; })[0];
    if (home) setOfficer(S, home, newLordOff);
  }
  checkClans(S);
}
function START_FROM(S, cid) { var sc = SCEN_BY[S.scenario], st = sc && sc.start[cid]; return st ? Object.keys(st.provs) : []; }

// ---- イベントの 発生 ----
function eventView(S, ev) {
  return { id: ev.id, title: ev.title, y: S.year, s: S.season, lines: ev.lines, note: ev.note,
           choices: ev.choices && (S.player === 'mori' || ev.id !== 'to_ouchi') ? ev.choices.map(function (c) { return c.label; }) : null };
}
function fireEvents(S) {
  S.firedEv = S.firedEv || {}; S.pendingEvents = S.pendingEvents || []; S.history = S.history || [];
  EVENTS.forEach(function (ev) {
    if (S.firedEv[ev.id]) return;
    if (ev.scen && ev.scen !== S.scenario) return;
    if (ev.when[0] !== S.year || ev.when[1] !== S.season) return;
    if (!ev.cond(S)) return;
    S.firedEv[ev.id] = 1;
    var playerChooses = ev.choices && S.player === 'mori';
    if (ev.choices && !playerChooses) ev.choices[0].apply(S);   // CPU の 毛利は 史実どおり
    if (ev.apply) ev.apply(S);
    var v = eventView(S, ev); if (!playerChooses) v.choices = null;
    S.pendingEvents.push(v);
    S.history.push({ id: ev.id, title: ev.title, y: S.year, s: S.season, note: ev.note });
    logC(S, '【' + ev.title + '】', 'sys');
  });
}
function chooseEvent(S, id, idx) {
  var ev = EVENTS.filter(function (e) { return e.id === id; })[0];
  if (ev && ev.choices && ev.choices[idx]) ev.choices[idx].apply(S);
}
function sayEvent(S, o, kind) {
  var s = OFF_SAY[o.id]; if (!s || !s[kind]) return;
  S.pendingEvents = S.pendingEvents || [];
  var head = kind === 'join' ? o.name + 'が くわわった' : kind === 'die' ? o.name + 'が なくなった' : o.name + 'が 寝返った';
  S.pendingEvents.push({ id: 'say_' + o.id + '_' + kind, title: head, y: S.year, s: S.season, lines: [[o.name, s[kind]]], note: null, small: true, clan: o.clan });
}

if (typeof module !== 'undefined') module.exports = { EVENTS: EVENTS };
