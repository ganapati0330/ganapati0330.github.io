var g=require('./game.js');g.RNG.mode='seed';
var N=+process.argv[2]||10, sizes=(process.argv[3]||'0,1,2').split(',').map(Number);
var t0=Date.now();
sizes.forEach(function(si){var line=[];var tot={atk:0,def:0},T=[];
g.CASTLES.forEach(function(c,mi){var st={atk:0,def:0};for(var s=0;s<N;s++){g.RNG.seed=9000+s*17+mi*3+si;var G=g.newGame({mapIndex:mi,sizeIndex:si,mapSeed:500+s*101+mi,playerSide:'atk',playerChar:'fute',cpuChar:'kuro',playerArmy:g.defaultArmy('atk',si,mi),cpuArmy:g.defaultArmy('def',si,mi),difficulty:'normal'});var gd=0;while(!G.over&&gd++<400){g.aiOrder(G,G.side).forEach(function(u){if(u.hp>0&&!u.acted)g.aiExecute(G,u,g.aiPlan(G,u));});g.endTurn(G);}st[G.winner]++;tot[G.winner]++;T.push(Math.min(G.turn,G.turnLimit));}line.push(c.id+' '+st.atk+'-'+st.def);});
console.log('size',si,'turns',g.SIZES[si].turns,'|',line.join('  '),'| total',tot.atk+'-'+tot.def,'avg turn',(T.reduce((a,b)=>a+b,0)/T.length).toFixed(1));});
console.log('sec',((Date.now()-t0)/1000).toFixed(0));
