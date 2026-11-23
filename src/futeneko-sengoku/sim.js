var g=require('./game.js');g.RNG.mode='seed';
var args=process.argv.slice(2).map(Number); if(args.length) g.setTune(args[0],args[1]);
var tot={atk:0,def:0},T=[];
for(var mi=0;mi<3;mi++){var st={atk:0,def:0};for(var s=0;s<30;s++){g.RNG.seed=7000+s*13+mi;var G=g.newGame({mapIndex:mi,playerSide:'atk',playerChar:'fute',cpuChar:'kuro',playerArmy:g.defaultArmy('atk'),cpuArmy:g.defaultArmy('def'),difficulty:'normal'});var gd=0;while(!G.over&&gd++<400){g.aiOrder(G,G.side).forEach(function(u){if(u.hp>0&&!u.acted)g.aiExecute(G,u,g.aiPlan(G,u));});g.endTurn(G);}st[G.winner]++;tot[G.winner]++;T.push(Math.min(G.turn,15));}console.log(g.MAPS[mi].id,st);}
console.log('total',tot,'avg turn',(T.reduce((a,b)=>a+b,0)/T.length).toFixed(1));
