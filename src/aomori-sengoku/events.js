/* ===== フテ猫 北奥羽の戦国シミュレーション : 史実イベント（DOM非依存） ===== */
'use strict';
// 話す人：'@大浦為信' のように 名前。'#語り' は ナレーション。
// when: [年, 季節(0春1夏2秋3冬)]、scen: その シナリオだけ、cond(S)、apply(S, choice)
// choices が ある できごとは、chooser の 家を プレイヤーが えらんで いる ときだけ えらべる（CPU は 1つめ＝史実）
function lordName(S, cid) { return CLANS[cid] ? CLANS[cid].lord : ''; }
function alive(S, cid) { return !!(S.clans[cid] && S.clans[cid].alive); }
function hasOff(S, id, cid) { var o = S.officers && S.officers[id]; return !!(o && (!cid || o.clan === cid)); }
function hurtProv(S, pid, n, min) { var P = S.provs[pid]; if (!P) return; P.units.forEach(function (u) { u.hp = Math.max(min || 1, u.hp - n); }); }
function hurtClan(S, cid, n, min) { provsOf(S, cid).forEach(function (pid) { hurtProv(S, pid, n, min); }); }

var EVENTS = [
  { id:'tatsu', when:[1571, 0], scen:'1571', title:'為信、たつ',
    cond: function (S) { return alive(S, 'oura'); },
    lines: [['沼田祐光', '殿、南部の 晴政どのと 信直どのの 仲は わるく、南部家は 一枚岩では ありませぬ。いまこそ 好機かと。'],
            ['大浦為信', '津軽は 津軽の 者が おさめる。南部の 下には もう いない。この 為信が 津軽を ひとつに する！']],
    note:'大浦為信（のちの 津軽為信）は 南部家の 一族・家臣で、津軽の 大浦城（いまの 弘前市）に いました。1571年（元亀2年）、為信は 南部家から 独立する ために 兵を あげます。このとき 22さい。軍師の 沼田祐光が 為信を ささえました。' },

  { id:'ishikawajo', when:[1571, 1], scen:'1571', title:'石川城 夜討ち', chooser:'oura',
    cond: function (S) { return alive(S, 'oura') && alive(S, 'ishikawa') && S.provs.ishikawa.owner === 'ishikawa' && lordName(S, 'ishikawa') === '石川高信'; },
    lines: [['大浦為信', 'こよい 石川城を おそう。郡代の 石川高信どのを たおせば、津軽の 南部方は ばらばらに なる。'],
            ['森岡信元', 'はっ！ 夜の うちに 城へ せまりまする！']],
    choices: [
      { label:'石川城を おそう（史実）', apply: function (S) {
          hurtProv(S, 'ishikawa', 5, 1);
          if (isAlly(S, 'oura', 'ishikawa')) breakAlliance(S, 'oura', 'ishikawa', '石川城 夜討ち');
          noteWar(S, 'oura', 'ishikawa');
          setLord(S, 'ishikawa', '滝本重行', [72, 56, 62], 'takimoto');
          logC(S, '大浦為信が 石川城を 夜討ちした！', S.player === 'oura' ? 'good' : 'sys'); } },
      { label:'まだ まつ', apply: function (S) { logC(S, '為信は 石川城を おそうのを 見おくった', 'sys'); } }
    ],
    note:'1571年5月、為信は 南部家の 津軽郡代・石川高信が いる 石川城（大仏ヶ鼻城）を 夜討ちしました。津軽がわの 記録では 高信は この とき 自害したと されます（南部がわの 記録では 1581年に 病で なくなったとも いわれ、説が わかれます）。ゲームでは 石川の へいが よわり、大光寺城の 滝本重行が 石川家を ひきつぎます。' },

  { id:'nobunao_leave', when:[1572, 0], scen:'1571', title:'信直、三戸を はなれる',
    cond: function (S) { return alive(S, 'nanbu') && hasOff(S, 'nobunao', 'nanbu'); },
    lines: [['南部晴政', '晴継が うまれた。南部の あとつぎは 晴継じゃ。'],
            ['南部信直', '……わたしは 身を ひきましょう。（晴政さまの 心は もう わたしには ない……）'],
            ['北信愛', '信直さま、この 信愛は いつまでも 信直さまの 味方ですぞ。']],
    note:'南部晴政には 男の子が いなかったので、いとこの 子・信直を 長女の 婿養子に して あとつぎに していました。ところが 1570年に 実の 子・晴継が うまれると、晴政と 信直の 仲は わるくなり、信直は あとつぎを おりました。この 南部家の 内輪もめが、為信が 独立できた 理由の ひとつです。' },

  { id:'daikoji', when:[1575, 0], scen:'1571', title:'大光寺城の 戦い',
    cond: function (S) { return alive(S, 'oura') && S.provs.daikoji.owner !== 'oura' && !isAlly(S, 'oura', S.provs.daikoji.owner) && S.player !== S.provs.daikoji.owner; },
    apply: function (S) { hurtProv(S, 'daikoji', 2, 2); },
    lines: [['乳井建清', '大光寺城の 滝本は 手ごわい。雪の なかでの 戦に なりまするぞ。'],
            ['大浦為信', '一度で だめなら 二度 せめる。大光寺を とれば 津軽の 南が 手に はいる！']],
    note:'1575年（天正3年）、為信は 南部方の 大光寺城（いまの 平川市）を せめ、城代の 滝本重行を 追いだしました。一度は 大雪の なかで やぶれたとも いわれますが、ついに 城を おとしました。ゲームでは 大光寺の へいが すこし よわります（大光寺を まもる 家が プレイヤーでない とき）。' },

  { id:'namioka', when:[1578, 1], scen:'1571', title:'浪岡御所の 落日',
    cond: function (S) { return alive(S, 'namioka') && S.player !== 'namioka'; },
    apply: function (S) { hurtProv(S, 'namioka', 3, 2); },
    lines: [['北畠顕村', '北畠の 家も、もはや これまでか……。'],
            ['#語り', '大浦為信の 軍が 浪岡城に せまった。浪岡御所は 家中の あらそいで 力を うしなっていた。']],
    note:'浪岡北畠氏は 南朝の 公家・北畠顕家の 流れを くむと いわれる 名門で「浪岡御所」と よばれました。しかし 1562年の 一族の あらそい（川原御所の 乱）で 力を うしない、1578年7月、為信に 浪岡城を おとされました。当主の 北畠顕村は 自害したと 伝わります。ゲームでは 浪岡の へいが よわります。' },

  { id:'harumasa_d', when:[1582, 0], title:'晴政・晴継の 死と 信直の 家督',
    cond: function (S) { return alive(S, 'nanbu') && lordName(S, 'nanbu') === '南部晴政'; },
    apply: function (S) {
      setLord(S, 'nanbu', '南部信直', [74, 78, 82], 'nobunao');
      if (alive(S, 'kunohe') && isAlly(S, 'nanbu', 'kunohe')) breakAlliance(S, 'nanbu', 'kunohe', '家督あらそい');
    },
    lines: [['#語り', '南部晴政が なくなり、あとを ついだ 晴継も まもなく 13さいで 世を さった……。'],
            ['北信愛', 'つぎの 当主は 信直さま しか おられませぬ！'],
            ['九戸政実', '信直だと？ 南部の あとつぎは 弟の 実親こそ ふさわしい。わしは みとめぬぞ。'],
            ['南部信直', 'わたしが 南部を まとめる。九戸どの、いずれ わかって もらおう。']],
    note:'1582年（天正10年）、南部晴政が なくなり、晴継も すぐに なぞの 死を とげました。北信愛たちが おして 信直が 26代 当主に なりましたが、晴政の 次女の 婿・九戸実親を おす 九戸政実は 不満を もちました。これが のちの 九戸政実の 乱の もとに なります。ゲームでは 南部家と 九戸家の 同盟が きれます。' },

  { id:'asari_end', when:[1582, 2], scen:'1571', title:'浅利勝頼、たおれる',
    cond: function (S) { return alive(S, 'asari') && alive(S, 'ando') && S.player !== 'asari' && lordName(S, 'asari') === '浅利勝頼'; },
    apply: function (S) { absorbClan(S, 'ando', 'asari'); },
    lines: [['安東愛季', '比内は 安東が もらう。浅利どのには ここで しんで もらおう。'],
            ['#語り', '浅利勝頼は 安東愛季に まねかれた 席で 討たれた……。']],
    note:'比内（いまの 大館市あたり）の 浅利勝頼は、1582年ごろ 安東愛季に 討たれたと 伝わります。こうして 比内は 安東家の ものに なりました。勝頼の 子・頼平は 津軽へ にげ、のちに 為信の 助けで 比内に もどります。ゲームでは 浅利家が 安東家に くわわります。' },

  { id:'aburakawa', when:[1585, 0], scen:'1571', title:'油川城・田舎館城の 戦い',
    cond: function (S) { return alive(S, 'oura') && S.provs.sotogahama.owner !== 'oura' && S.player !== S.provs.sotogahama.owner && !isAlly(S, 'oura', S.provs.sotogahama.owner); },
    apply: function (S) { hurtProv(S, 'sotogahama', 2, 2); },
    lines: [['大浦為信', '外ヶ浜の 油川城を とれば、津軽は ぜんぶ わしの ものだ！'],
            ['#語り', '油川城の 奥瀬善九郎は 戦わずに 城を すてて 南部へ にげた。']],
    note:'1585年（天正13年）春、為信は 外ヶ浜の 油川城（いまの 青森市）を せめ、城主の 奥瀬善九郎は 南部領へ にげました。同じ年、田舎館城・横内城も おとし、為信は 津軽の ほとんどを 手に いれました。ゲームでは 外ヶ浜の へいが すこし よわります（プレイヤーが まもる ときを のぞく）。' },

  { id:'chikasue_d', when:[1587, 2], title:'安東愛季、死す',
    cond: function (S) { return alive(S, 'ando') && lordName(S, 'ando') === '安東愛季'; },
    apply: function (S) { setLord(S, 'ando', '安東実季', [62, 72, 74], 'sanesue'); },
    lines: [['安東愛季', '……実季よ、安東の 家を、出羽の 北を たのむぞ……'],
            ['安東実季', '父上。この 実季が 安東家を まもりぬきます。']],
    note:'1587年、「斗星（北の 北斗七星）」と よばれた 安東愛季が 戦の とちゅうに 病で なくなり、12さいの 子・実季が あとを つぎました。実季は のちに 名字を「秋田」と あらためます。' },

  { id:'takadate', when:[1588, 1], scen:'1571', title:'飯詰 高楯城の 戦い',
    cond: function (S) { return alive(S, 'oura') && S.provs.iizume.owner !== 'oura' && S.player !== S.provs.iizume.owner && !isAlly(S, 'oura', S.provs.iizume.owner); },
    apply: function (S) { hurtProv(S, 'iizume', 2, 2); },
    lines: [['朝日行安', '高楯城は わたさぬ！ さいごの 一兵まで 戦うぞ！'],
            ['兼平綱則', 'しぶとい 城よ……。だが 津軽の 統一は もうすぐだ！']],
    note:'飯詰（いまの 五所川原市）の 高楯城の 朝日行安は、浪岡北畠氏が ほろびた あとも 為信に 抵抗しつづけ、1588年（天正16年）ごろに 落城したと されます。こうして 為信は 津軽を ほぼ 平定しました。' },

  { id:'shiba_end', when:[1588, 2], scen:'1571', title:'斯波御所の 最後',
    cond: function (S) { return alive(S, 'shiba') && alive(S, 'nanbu') && S.player !== 'shiba'; },
    apply: function (S) { hurtProv(S, 'shiwa', 4, 1); if (isAlly(S, 'nanbu', 'shiba')) breakAlliance(S, 'nanbu', 'shiba', '斯波攻め'); noteWar(S, 'nanbu', 'shiba'); },
    lines: [['南部信直', '斯波の 高水寺城を せめる。岩手から 南へ 道を ひらくのだ！'],
            ['#語り', '家臣の うらぎりも あって、斯波詮直は 高水寺城を すてて にげた。']],
    note:'1588年（天正16年）、南部信直は 斯波郡（いまの 紫波町あたり）の 斯波詮直を せめ、高水寺城を おとしました。足利一門の 名門で「斯波御所」と よばれた 斯波氏は、ここで 戦国大名としては ほろびました。ゲームでは 斯波の へいが 大きく よわります。' },

  { id:'odawara', when:[1590, 0], title:'小田原参陣',
    cond: function (S) { return alive(S, 'oura'); },
    apply: function (S) {
      var nm = lordName(S, 'oura') === '大浦為信' ? '津軽為信' : lordName(S, 'oura');
      var L = S.officers && S.officers[lordId('oura')];
      setLord(S, 'oura', nm, L ? L.st : [84, 82, 94], null, { name:'津軽家', crest:'津' });
      S.clans.oura.gold += 30;
    },
    lines: [['大浦為信', '天下は 豊臣秀吉どのに きまった。南部より 先に 小田原へ ゆき、津軽を みとめて もらうのだ！'],
            ['沼田祐光', '殿、いそぎましょう。海を わたり、だれよりも はやく！'],
            ['#語り', '為信は 小田原の 陣で 秀吉に 会い、津軽を おさめる ことを みとめられた。']],
    note:'1590年（天正18年）、豊臣秀吉が 小田原の 北条氏を せめると、為信は いちはやく 秀吉に 会いに いき、津軽三郡を おさめる ことを みとめられました。南部信直より 先に うごいた ことで、南部家からの 独立が 正式に きまったのです。このころから「津軽」を 名字に します。ゲームでは 大浦家が 津軽家に なり、お金が ふえます。' },

  { id:'kunohe_ran', when:[1591, 0], title:'九戸政実の 乱',
    cond: function (S) { return alive(S, 'kunohe') && alive(S, 'nanbu'); },
    apply: function (S) { if (isAlly(S, 'nanbu', 'kunohe')) breakAlliance(S, 'nanbu', 'kunohe', '九戸政実の 乱'); noteWar(S, 'nanbu', 'kunohe'); },
    lines: [['九戸政実', '信直の 下には つかぬ！ 天下人が なんだ、北奥羽の ことは 北奥羽の 者が きめる！'],
            ['九戸実親', '兄上、九戸の 意地を みせましょうぞ！'],
            ['南部信直', '政実め……。わが 力だけでは おさえきれぬ。秀吉さまに 助けを もとめよう。']],
    note:'1591年（天正19年）3月、九戸政実は 南部信直に そむいて 兵を あげました（九戸政実の 乱・九戸一揆）。政実は 強く、信直は 自分の 力だけでは しずめられず、豊臣秀吉に 助けを もとめました。ゲームでは 南部家と 九戸家が 敵どうしに なります。' },

  { id:'kunohe_siege', when:[1591, 2], title:'九戸城の 戦い（奥州再仕置）',
    cond: function (S) { return alive(S, 'kunohe') && S.player !== 'kunohe'; },
    apply: function (S) { hurtClan(S, 'kunohe', 5, 1); },
    lines: [['#語り', '豊臣秀次を 総大将に、蒲生氏郷・浅野長政・井伊直政らの 大軍が 九戸城を とりかこんだ。'],
            ['九戸政実', 'これほどの 大軍とは……。城の 者の 命を たすけると いうなら、門を ひらこう。'],
            ['#語り', 'しかし 約束は まもられず、政実たちは 討たれた……。']],
    note:'1591年9月、豊臣の 大軍（6万とも いわれる）が 九戸城を かこみました。政実は 約5千の 兵で よく まもりましたが、「城兵の 命を たすける」と いう 話を うけて 城を 出たところ、政実らは 処刑されました。これが 豊臣秀吉の 天下統一の 最後の 戦いと いわれます。ゲームでは 九戸家の へいが 大きく よわります（九戸家が プレイヤーで ない とき）。' },

  { id:'sekigahara', when:[1600, 2], title:'関ヶ原の 戦い',
    cond: function (S) { return true; },
    lines: [['#語り', '美濃の 関ヶ原で、徳川家康の 東軍と 石田三成の 西軍が 天下を かけて 戦った。']],
    note:'1600年の 関ヶ原の 戦いで、津軽為信・南部利直（信直の 子）は 東軍（徳川方）に つきました。江戸時代、北奥羽は 弘前藩（津軽家）・盛岡藩（南部家）・八戸藩・秋田藩（佐竹家。秋田実季は 常陸へ うつされた）などに わかれて おさめられます。' }
];

// 家臣の 加入・寝返り・死去の セリフ
var OFF_SAY = {
  numata:    { die:'殿……津軽の ゆくすえ、この 祐光は 草葉の かげから 見まもりますぞ……' },
  nobutake:  { join:'父上、信建に ございます。津軽の ため 力を つくします。' },
  nobuhira:  { join:'信枚、ここに。いつか 岩木山を のぞむ 大きな 城を きずきとう ございます。' },
  sentoku:   { join:'千徳政氏、為信どのに 力を かそう！' },
  kitaN:     { die:'信直さま……南部を、たのみますぞ……' },
  sakuraba:  { join:'桜庭直綱、南部の ために はたらきまする。' },
  nakano:    { defect:'兄上には すまぬが、南部の 家を まもるのは 信直さまだ。わたしは 南部に つく！' },
  anetai:    { join:'姉帯兼興、九戸の ために この 槍を ふるおう！' },
  sanesue:   { join:'安東実季に ございます。父上の あとを 学んで まいります。' },
  takimoto:  { die:'津軽を……南部の 手に……もどせなんだか……' },
  sanechika: { die:'兄上……九戸の 意地は、みせましたぞ……' }
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
           choices: ev.choices && S.player === ev.chooser ? ev.choices.map(function (c) { return c.label; }) : null };
}
function fireEvents(S) {
  S.firedEv = S.firedEv || {}; S.pendingEvents = S.pendingEvents || []; S.history = S.history || [];
  EVENTS.forEach(function (ev) {
    if (S.firedEv[ev.id]) return;
    if (ev.scen && ev.scen !== S.scenario) return;
    if (ev.when[0] !== S.year || ev.when[1] !== S.season) return;
    if (!ev.cond(S)) return;
    S.firedEv[ev.id] = 1;
    var playerChooses = ev.choices && S.player === ev.chooser;
    if (ev.choices && !playerChooses) ev.choices[0].apply(S);   // CPU は 史実どおり
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
