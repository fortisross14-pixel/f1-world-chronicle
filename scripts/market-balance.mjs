import assert from 'node:assert/strict';
import { createUniverse, currentDriverRating, getStaff, makeRng } from '../src/data.js';
import { advanceToNextSeason, constructorStandings } from '../src/sim.js';

const seeds=process.argv[2]?[Number(process.argv[2])]:[17,2026,20260731,451991,88021];
const avg=(a)=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
function teamStrength(u,t,series='F1'){
  if(series!=='F1')return t.rating||t.baseline||68;
  const car=avg(Object.values(t.car||{}));
  const fac=avg(Object.values(t.facilities||{}))*10;
  const staff=avg((t.staffIds||[]).map(id=>getStaff(u,id)?.rating||65));
  const sporting=car*.44+fac*.23+staff*.20+((t.staffIds||[]).map(id=>getStaff(u,id)).find(s=>s?.role==='Team Principal')?.rating||72)*.13;
  const brands={ferrari:[100,610],mclaren:[98,565],mercedes:[99,590],'red-bull':[97,620],aston:[91,500],audi:[94,530],alpine:[84,410],williams:[90,390],haas:[75,330],'racing-bulls':[74,345],cadillac:[83,465]};
  const [prestige,funding]=brands[t.mainBrandId]||[78,t.finances?.mainFunding||360];
  const brandPower=Math.max(45,Math.min(100,prestige*.58+funding/8.5*.42));
  const cash=Math.max(35,Math.min(100,48+(t.finances?.cash||0)/11+(t.finances?.projectedBalance||0)*.05));
  const pos=t.career?.seasons?.at(-1)?.position||6;const form=Math.max(54,100-(pos-1)*4.3);
  return sporting*.45+brandPower*.22+fac*.13+cash*.12+form*.08;
}
function syntheticSeason(u,seed){
  const rng=makeRng(seed+u.year*9817);
  for(const series of ['F1','F2','F3','F4','FE','WEC']){
    const teams=series==='F1'?u.teams:(u.feederTeams?.[series]||[]);
    const drivers=u.drivers.filter(d=>d.active&&d.series===series&&d.role==='Race driver');
    const scored=drivers.map(d=>{const team=teams.find(t=>t.id===d.teamId);const strength=teamStrength(u,team,series);const score=currentDriverRating(d)*.66+strength*.34+(rng.next()-.5)*13;return{d,score};}).sort((a,b)=>b.score-a.score);
    const basePoints=[330,292,255,224,198,176,156,138,121,105,90,77,65,54,44,35,27,20,14,9,5,2,1,0];
    scored.forEach(({d},i)=>{const pts=Math.max(0,(basePoints[i]??0)+Math.round((rng.next()-.5)*18));d.season.points=pts;d.season.wins=i<8?Math.max(0,Math.round((8-i)*.75+rng.next()*2-1)):0;d.season.podiums=Math.max(d.season.wins,i<12?Math.max(0,10-i+Math.round(rng.next()*3)):0);d.season.poles=i<10?Math.max(0,Math.round((7-i*.5)*rng.next())):0;d.season.starts=series==='F1'?24:16;d.season.form=[i+1];});
    teams.forEach(t=>{const td=drivers.filter(d=>d.teamId===t.id);const pts=td.reduce((n,d)=>n+d.season.points,0);const wins=td.reduce((n,d)=>n+d.season.wins,0);if(series==='F1'){t.season.points=pts;t.season.wins=wins;}else{t.points=pts;t.wins=wins;t.season={...(t.season||{}),points:pts,wins};}});
  }
  u.phase='Season complete';u.currentWeek=52;u.currentRound=u.calendar.length;
  return u;
}
const reports=[];
for(const seed of seeds){
  let u=createUniverse(seed);const years=[];const f2EliteYears=new Map();const topDriverOutsideTop4Streak=new Map();const topDriverOutsideTitleBandStreak=new Map();const topDriverWeakF1Streak=new Map();const topDriverOutsideF1Streak=new Map();let maxTop7OutsideTop4Streak=0;let maxTop7OutsideTitleBandStreak=0;let maxTop7WeakF1Streak=0;let maxTop7OutsideF1Streak=0;
  for(let season=0;season<12;season++){
    u=syntheticSeason(u,seed+season*37);u=advanceToNextSeason(u);
    const teamOrder=[...u.teams].sort((a,b)=>teamStrength(u,b)-teamStrength(u,a));
    const top4=new Set(teamOrder.slice(0,4).map(t=>t.id));
    const fourthStrength=teamStrength(u,teamOrder[Math.min(3,teamOrder.length-1)]);
    const titleBand=new Set(teamOrder.filter((t,index)=>index<6&&teamStrength(u,t)>=fourthStrength-3).map(t=>t.id));
    const eligible=u.drivers.filter(d=>d.active&&d.age>=21&&d.age<=35&&d.role!=='Retired').sort((a,b)=>currentDriverRating(b)-currentDriverRating(a));
    const top7=eligible.slice(0,7);
    const top7F1=top7.filter(d=>d.series==='F1'&&d.role==='Race driver').length;
    const top7Top4=top7.filter(d=>d.series==='F1'&&d.role==='Race driver'&&top4.has(d.teamId)).length;
    const top7TitleBand=top7.filter(d=>d.series==='F1'&&d.role==='Race driver'&&titleBand.has(d.teamId)).length;
    const top7Ids=new Set(top7.map(d=>d.id));
    for(const d of top7){
      const inF1=d.series==='F1'&&d.role==='Race driver';
      const inTop4=inF1&&top4.has(d.teamId);
      const f1Streak=inF1?0:(topDriverOutsideF1Streak.get(d.id)||0)+1;topDriverOutsideF1Streak.set(d.id,f1Streak);maxTop7OutsideF1Streak=Math.max(maxTop7OutsideF1Streak,f1Streak);
      const topStreak=inTop4?0:(topDriverOutsideTop4Streak.get(d.id)||0)+1;topDriverOutsideTop4Streak.set(d.id,topStreak);maxTop7OutsideTop4Streak=Math.max(maxTop7OutsideTop4Streak,topStreak);
      const inTitleBand=inF1&&titleBand.has(d.teamId);const titleStreak=inTitleBand?0:(topDriverOutsideTitleBandStreak.get(d.id)||0)+1;topDriverOutsideTitleBandStreak.set(d.id,titleStreak);maxTop7OutsideTitleBandStreak=Math.max(maxTop7OutsideTitleBandStreak,titleStreak);
      const teamRank=inF1?teamOrder.findIndex(t=>t.id===d.teamId)+1:99;const weakF1=inF1&&teamRank>6;const weakStreak=weakF1?(topDriverWeakF1Streak.get(d.id)||0)+1:0;topDriverWeakF1Streak.set(d.id,weakStreak);maxTop7WeakF1Streak=Math.max(maxTop7WeakF1Streak,weakStreak);
    }
    for(const id of [...topDriverOutsideTop4Streak.keys()])if(!top7Ids.has(id))topDriverOutsideTop4Streak.set(id,0);
    for(const id of [...topDriverOutsideTitleBandStreak.keys()])if(!top7Ids.has(id))topDriverOutsideTitleBandStreak.set(id,0);
    for(const id of [...topDriverWeakF1Streak.keys()])if(!top7Ids.has(id))topDriverWeakF1Streak.set(id,0);
    for(const id of [...topDriverOutsideF1Streak.keys()])if(!top7Ids.has(id))topDriverOutsideF1Streak.set(id,0);
    const primeEliteOutside=u.drivers.filter(d=>d.active&&d.age>=21&&d.age<=32&&currentDriverRating(d)>=87&&!(d.series==='F1'&&d.role==='Race driver'));
    const eliteFree=u.drivers.filter(d=>d.active&&d.role==='Free agent'&&d.age>=21&&d.age<=34&&currentDriverRating(d)>=84);
    const f2Elite=u.drivers.filter(d=>d.active&&d.series==='F2'&&d.role==='Race driver'&&d.age>=21&&currentDriverRating(d)>=84);
    for(const d of f2Elite)f2EliteYears.set(d.id,(f2EliteYears.get(d.id)||0)+1);
    const moves=(u.marketHistory||[]).filter(m=>m.year===u.year);
    const f1NewTeamMoves=moves.filter(m=>m.to?.series==='F1'&&m.to?.role==='Race driver'&&m.from?.teamId!==m.to?.teamId).length;
    const f1Renewals=moves.filter(m=>m.to?.series==='F1'&&m.from?.teamId===m.to?.teamId).length;
    years.push({year:u.year,top7F1,top7Top4,top7TitleBand,primeEliteOutside:primeEliteOutside.length,eliteFree:eliteFree.length,f2Elite:f2Elite.length,f1NewTeamMoves,f1Renewals,bestDriver:top7[0]?.name,bestDriverRating:top7[0]?currentDriverRating(top7[0]):0,bestDriverSeries:top7[0]?.series,bestDriverTeamRank:top7[0]?.teamId?teamOrder.findIndex(t=>t.id===top7[0].teamId)+1:null});
  }
  const stalled=[...f2EliteYears.values()].filter(n=>n>=2).length;
  assert.ok(u.drivers.every(d=>!d.careerCurve?.length||Math.max(...d.careerCurve)>=1),'Every career curve must reach at least 1.000');
  reports.push({seed,years,summary:{avgTop7F1:Number(avg(years.map(y=>y.top7F1)).toFixed(2)),avgTop7Top4:Number(avg(years.map(y=>y.top7Top4)).toFixed(2)),avgTop7TitleBand:Number(avg(years.map(y=>y.top7TitleBand)).toFixed(2)),maxEliteFree:Math.max(...years.map(y=>y.eliteFree)),maxPrimeEliteOutside:Math.max(...years.map(y=>y.primeEliteOutside)),avgF1NewTeamMoves:Number(avg(years.map(y=>y.f1NewTeamMoves)).toFixed(2)),stalledEliteF2:stalled,maxTop7OutsideF1Streak,maxTop7OutsideTop4Streak,maxTop7OutsideTitleBandStreak,maxTop7WeakF1Streak}});
}
for(const report of reports){
  const s=report.summary;
  assert.ok(s.avgTop7F1>=6,`Seed ${report.seed}: too many world-class drivers outside F1 (${s.avgTop7F1}/7 in F1)`);
  assert.ok(s.avgTop7TitleBand>=4.25,`Seed ${report.seed}: elite talent is not concentrated enough in title-capable teams (${s.avgTop7TitleBand}/7)`);
  assert.ok(s.maxTop7OutsideF1Streak<=2,`Seed ${report.seed}: a top-seven driver stayed outside F1 too long (${s.maxTop7OutsideF1Streak} years)`);
  assert.ok(s.maxTop7WeakF1Streak<=3,`Seed ${report.seed}: a top-seven driver stayed on a bottom-five F1 project too long (${s.maxTop7WeakF1Streak} years)`);
  assert.ok(s.maxEliteFree<=1,`Seed ${report.seed}: too many elite free agents at once (${s.maxEliteFree})`);
  assert.ok(s.avgF1NewTeamMoves<=8,`Seed ${report.seed}: F1 market churn is too high (${s.avgF1NewTeamMoves} new-team moves/year)`);
  assert.equal(s.stalledEliteF2,0,`Seed ${report.seed}: an elite F2 driver remained stuck for multiple years`);
}
console.log(JSON.stringify(reports,null,2));
