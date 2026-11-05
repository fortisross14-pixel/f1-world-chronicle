// Sporting rivalries, the head-to-head ledger and the Hall of Fame.
// Everything here is narrative: it reads race results and never changes them,
// and it never draws from a race rng, so seeded results stay identical.

export const RIVALRY_RULES={
  igniteHeat:36,          // rolling two-season heat needed to ignite
  hotHeat:48,             // needed to ignite while already at the target ceiling
  replaceMargin:8,        // at the hard cap a newcomer must beat the coolest live rivalry by this much
  targetMax:4,            // F1 target is 2–4 live rivalries
  hardMax:5,              // never more than five live F1 rivalries
  feederMax:1,            // at most one live rivalry per feeder series
  dormantAfter:2,         // seasons without a clash before a rivalry goes dormant
};
export const HALL_RULES={minTitles:1,minWins:20,topShare:.10,maxPerYear:2,ballotYears:5,
  // Legacy weights. Rarity is deliberately absent.
  weights:{title:50,win:6,pole:2,podium:1.5,peakSeason:12,record:30}};
const FEEDERS=['F2','F3','F4','FE','WEC'];

const pairKey=(a,b)=>a<b?`${a}|${b}`:`${b}|${a}`;
const driverIndexes=new WeakMap();
const byId=(universe)=>{let index=driverIndexes.get(universe.drivers);if(!index||index.size!==universe.drivers.length){index=new Map(universe.drivers.map((driver)=>[driver.id,driver]));driverIndexes.set(universe.drivers,index);}return index;};
const findDriver=(universe,id)=>{const hit=byId(universe).get(id);return hit&&hit.id===id?hit:universe.drivers.find((driver)=>driver.id===id);};

export function ensureLegacyState(universe){
  // Only sporting rivalries (they always carry a status) belong here.
  universe.rivalries=Array.isArray(universe.rivalries)?universe.rivalries.filter((item)=>item&&item.status):[];
  universe.rivalries.forEach((item)=>{item.timeline=item.timeline||[];});
  universe.headToHead=universe.headToHead||{};
  universe.hallOfFame=universe.hallOfFame||{inductees:[],ballot:[],legends:[],votes:[]};
  universe.hallOfFame.inductees=universe.hallOfFame.inductees||[];universe.hallOfFame.ballot=universe.hallOfFame.ballot||[];
  universe.hallOfFame.legends=universe.hallOfFame.legends||[];universe.hallOfFame.votes=universe.hallOfFame.votes||[];
  return universe;
}

function ledgerEntry(universe,a,b){
  const key=pairKey(a,b);
  let entry=universe.headToHead[key];
  if(!entry){const [first,second]=a<b?[a,b]:[b,a];entry=universe.headToHead[key]={a:first,b:second,races:0,aAhead:0,bAhead:0,winFights:0,podiumFights:0,contacts:0,titleFights:0,lastYear:universe.year,seasons:{},keyRaces:[]};}
  return entry;
}
function seasonOf(entry,year){return entry.seasons[year]||(entry.seasons[year]={heat:0,races:0,aAhead:0,bAhead:0,winFights:0,clashes:0});}
function windowStats(entry,year){
  const out={heat:0,races:0,aAhead:0,bAhead:0,winFights:0,clashes:0};
  [year,year-1].forEach((y)=>{const s=entry.seasons[y];if(!s)return;Object.keys(out).forEach((key)=>{out[key]+=s[key]||0;});});
  return out;
}

// Clashes between two drivers in one race, read from the replay.
function raceClashes(race){
  const clashes=new Map();
  const add=(a,b,kind)=>{if(!a||!b||a===b)return;const key=pairKey(a,b);const item=clashes.get(key)||{a,b,win:false,podium:false,contact:false};item[kind]=true;clashes.set(key,item);};
  (race.snapshots||[]).forEach((snap)=>{
    // Laps one and two are start bunching, not a fight.
    if(snap.lap<=2||snap.flag!=='green')return;
    const top=snap.order.slice(0,3);
    for(let i=1;i<top.length;i+=1){
      const entry=top[i];if(entry.status!=='run'||top[i-1].status!=='run'||entry.interval==null||entry.interval>1.0)continue;
      add(top[i-1].driverId,entry.driverId,i===1?'win':'podium');
    }
  });
  (race.moments||[]).forEach((moment)=>{
    const [a,b]=moment.driverIds||[];
    if(!['overtake','failedAttack','contact'].includes(moment.type)||!a||!b)return;
    if(moment.position===1)add(a,b,'win');else if(moment.position<=3)add(a,b,'podium');
    if(moment.type==='contact')add(a,b,'contact');
  });
  return [...clashes.values()];
}
function clashHeat(clash){return(clash.win?3:clash.podium?1.5:0)+(clash.contact?2:0);}

function activeRivalry(universe,a,b){const key=pairKey(a,b);return universe.rivalries.find((item)=>pairKey(item.a,item.b)===key);}
function liveIn(universe,series){return universe.rivalries.filter((item)=>item.status==='live'&&item.series===series);}

export function rivalryHeatBetween(universe,a,b){
  if(!universe?.rivalries?.length||!a||!b)return 0;
  const rivalry=activeRivalry(universe,a,b);
  if(!rivalry)return 0;
  if(rivalry.status==='live')return Math.min(6,1.5+(rivalry.heat||0)/3);
  return rivalry.status==='dormant'?1:0;
}

function rivalryTimelineEntry(universe,record,clash,heat){
  const event=record.event||{};
  const what=[clash.win?'fight for the win':clash.podium?'podium fight':null,clash.contact?'contact':null].filter(Boolean).join(' and ');
  return{year:universe.year,series:record.series,round:record.round,eventId:record.eventId,eventName:event.name||record.eventId,heat,text:`${event.name||'Race'}: ${what}`};
}

function igniteOrRevive(universe,entry,series,type,heat,story,round){
  const existing=activeRivalry(universe,entry.a,entry.b);
  const A=findDriver(universe,entry.a),B=findDriver(universe,entry.b);
  if(!A?.active||!B?.active)return null;
  // Caps: F1 aims for 2–4, hard max 5; feeders allow one each.
  const live=liveIn(universe,series);
  const cap=series==='F1'?RIVALRY_RULES.hardMax:RIVALRY_RULES.feederMax;
  if(series==='F1'&&live.length>=RIVALRY_RULES.targetMax&&heat<RIVALRY_RULES.hotHeat)return null;
  if(live.length>=cap){
    const coolest=[...live].sort((x,y)=>(x.heat||0)-(y.heat||0))[0];
    if(!coolest||heat<=(coolest.heat||0)+RIVALRY_RULES.replaceMargin)return null;
    coolest.status='dormant';coolest.cooledYear=universe.year;coolest.statusReason=`Pushed aside by ${A.name} vs ${B.name}`;
  }
  let rivalry=existing;
  const revived=Boolean(existing);
  if(!rivalry){
    rivalry={id:`rivalry-${entry.a}-${entry.b}`,a:entry.a,b:entry.b,series,type,status:'live',ignitedYear:universe.year,ignitedRound:round,lastClashYear:universe.year,heat,peakHeat:heat,timeline:[],revivals:0};
    universe.rivalries.push(rivalry);
  }else{rivalry.status='live';rivalry.series=series;rivalry.type=type;rivalry.revivals=(rivalry.revivals||0)+1;rivalry.lastClashYear=universe.year;rivalry.heat=heat;}
  rivalry.peakHeat=Math.max(rivalry.peakHeat||0,heat);
  const keyRaces=entry.keyRaces.slice(0,3).map((race)=>race.eventName).filter(Boolean);
  rivalry.timeline.unshift({year:universe.year,series,round,text:revived?'The rivalry reignites':type==='teammate'?'Teammate rivalry ignites':'Rivalry ignites',heat,milestone:true});
  rivalry.timeline=rivalry.timeline.slice(0,30);
  story?.({category:'Press Room',
    headline:type==='teammate'?`${A.name} and ${B.name}: the garage is now a battleground`:revived?`${A.name} vs ${B.name} is back on`:`A new rivalry: ${A.name} vs ${B.name}`,
    dek:type==='teammate'?`Equal machinery, a near-even head-to-head and a relationship that has turned sour. The ${series} paddock now treats them as rivals.`:`Repeated fights at the front${keyRaces.length?` — ${keyRaces.join(', ')} —`:''} and wins traded both ways have turned this into a genuine ${series} rivalry.`,
    priority:series==='F1'?92:70,subjects:[A.id,B.id],round,thread:'title-rivalry'});
  return rivalry;
}

function relationshipScore(A,B){
  const ab=A?.mind?.people?.[B?.id],ba=B?.mind?.people?.[A?.id];
  const values=[ab,ba].filter((value)=>Number.isFinite(value));
  return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
}
function seasonStandings(universe,series){
  return universe.drivers.filter((driver)=>driver.active&&driver.series===series&&((driver.season?.starts||0)>0||(driver.season?.points||0)>0))
    .sort((a,b)=>(b.season.points||0)-(a.season.points||0)||(b.season.wins||0)-(a.season.wins||0));
}
function tryTeammate(universe,entry,series,story,round){
  const A=findDriver(universe,entry.a),B=findDriver(universe,entry.b);
  if(!A?.active||!B?.active||A.teamId!==B.teamId||A.series!==series||B.series!==series)return null;
  const w=windowStats(entry,universe.year);const decided=w.aAhead+w.bAhead;
  if(decided<8)return null;
  const share=w.aAhead/decided;
  if(share<.4||share>.6)return null;
  const table=seasonStandings(universe,series);const rank=(id)=>table.findIndex((driver)=>driver.id===id)+1||99;
  const scoringWell=series==='F1'?rank(A.id)<=8&&rank(B.id)<=8:rank(A.id)<=6&&rank(B.id)<=6;
  if(!scoringWell||relationshipScore(A,B)>-25)return null;
  return igniteOrRevive(universe,entry,series,'teammate',Math.max(w.heat,RIVALRY_RULES.igniteHeat),story,round);
}

/** After every race (F1 and feeders). record: the event record with sessions.R. */
export function updateRivalriesAfterRace(universe,record,{story}={}){
  ensureLegacyState(universe);
  const race=record?.sessions?.R;if(!race?.rows?.length)return;
  const series=record.series;const year=universe.year;
  const rows=race.rows;const pos=new Map(rows.map((row)=>[row.driverId,row.position]));
  const clashes=raceClashes(race).filter((clash)=>pos.has(clash.a)&&pos.has(clash.b));
  const teams=new Map();rows.forEach((row)=>{if(!teams.has(row.teamId))teams.set(row.teamId,[]);teams.get(row.teamId).push(row.driverId);});
  const teammatePairs=[];teams.forEach((ids)=>{for(let i=0;i<ids.length;i+=1)for(let j=i+1;j<ids.length;j+=1)teammatePairs.push([ids[i],ids[j]]);});
  // F1 keeps a head-to-head for every pair; feeders only for teammates and pairs that clash.
  const counted=series==='F1'
    ?rows.flatMap((row,i)=>rows.slice(i+1).map((other)=>[row.driverId,other.driverId]))
    :[...new Map([...teammatePairs,...clashes.map((clash)=>[clash.a,clash.b])].map((pair)=>[pairKey(pair[0],pair[1]),pair])).values()];
  counted.forEach(([x,y])=>{
    const entry=ledgerEntry(universe,x,y);const season=seasonOf(entry,year);
    entry.races+=1;season.races+=1;entry.lastYear=year;
    if(pos.get(entry.a)<pos.get(entry.b)){entry.aAhead+=1;season.aAhead+=1;}else{entry.bAhead+=1;season.bAhead+=1;}
  });
  clashes.forEach((clash)=>{
    const entry=ledgerEntry(universe,clash.a,clash.b);const season=seasonOf(entry,year);
    const heat=clashHeat(clash);if(!heat)return;
    season.heat+=heat;season.clashes+=1;if(clash.win){season.winFights+=1;entry.winFights+=1;}else if(clash.podium)entry.podiumFights+=1;if(clash.contact)entry.contacts+=1;
    const timeline=rivalryTimelineEntry(universe,record,clash,heat);
    entry.keyRaces.push({year:timeline.year,series:timeline.series,round:timeline.round,eventId:timeline.eventId,eventName:timeline.eventName,heat,kind:clash.win?(clash.contact?'win+contact':'win'):clash.podium?(clash.contact?'podium+contact':'podium'):'contact',aPos:pos.get(entry.a),bPos:pos.get(entry.b)});
    entry.keyRaces.sort((x,y)=>y.heat-x.heat||y.year-x.year);entry.keyRaces=entry.keyRaces.slice(0,5);
    const rivalry=activeRivalry(universe,entry.a,entry.b);
    if(rivalry&&rivalry.status!=='historic'){
      rivalry.lastClashYear=year;rivalry.timeline.unshift(timeline);rivalry.timeline=rivalry.timeline.slice(0,30);
      rivalry.heat=windowStats(entry,year).heat;rivalry.peakHeat=Math.max(rivalry.peakHeat||0,rivalry.heat);
    }
    if(rivalry?.status==='live')return;
    const w=windowStats(entry,year);
    if(w.heat>=RIVALRY_RULES.igniteHeat&&w.winFights>=1&&w.aAhead>=1&&w.bAhead>=1)igniteOrRevive(universe,entry,series,'title',w.heat,story,record.round);
  });
  // Teammates can become rivals without fighting at the front.
  teammatePairs.forEach(([x,y])=>{
    const entry=ledgerEntry(universe,x,y);
    if(activeRivalry(universe,entry.a,entry.b)?.status!=='live')tryTeammate(universe,entry,series,story,record.round);
  });
}

/** Season end, before the driver market: the title fight adds heat. */
export function rivalryTitleHeat(universe,{story}={}){
  ensureLegacyState(universe);
  ['F1',...FEEDERS].forEach((series)=>{
    const table=seasonStandings(universe,series);if(table.length<2)return;
    const [first,second]=table;const entry=ledgerEntry(universe,first.id,second.id);const season=seasonOf(entry,universe.year);
    season.heat+=4;season.clashes+=1;entry.titleFights+=1;entry.lastYear=universe.year;
    const rivalry=activeRivalry(universe,entry.a,entry.b);
    if(rivalry&&rivalry.status!=='historic'){rivalry.lastClashYear=universe.year;rivalry.heat=windowStats(entry,universe.year).heat;rivalry.timeline.unshift({year:universe.year,series,round:null,text:`${first.name} beats ${second.name} to the ${series} title`,heat:4,milestone:true});rivalry.timeline=rivalry.timeline.slice(0,30);}
    if(rivalry?.status==='live')return;
    const w=windowStats(entry,universe.year);
    if(w.heat>=RIVALRY_RULES.igniteHeat&&w.winFights>=1&&w.aAhead>=1&&w.bAhead>=1)igniteOrRevive(universe,entry,series,'title',w.heat,story,null);
  });
}

/** Season end, after retirements: dormant and historic transitions, ledger pruning. */
export function rivalryLifecycle(universe,completedYear){
  ensureLegacyState(universe);
  universe.rivalries.forEach((rivalry)=>{
    const A=findDriver(universe,rivalry.a),B=findDriver(universe,rivalry.b);
    if(!A?.active||!B?.active){if(rivalry.status!=='historic'){rivalry.status='historic';rivalry.endedYear=completedYear;rivalry.statusReason=`${!A?.active?A?.name:B?.name} retired`;}return;}
    if(rivalry.status==='live'&&completedYear-(rivalry.lastClashYear||0)>=RIVALRY_RULES.dormantAfter){rivalry.status='dormant';rivalry.cooledYear=completedYear;rivalry.statusReason='Two seasons without a clash';}
    if(rivalry.status==='live'){const entry=universe.headToHead[pairKey(rivalry.a,rivalry.b)];rivalry.heat=entry?windowStats(entry,completedYear+1).heat:0;}
  });
  // Keep the ledger small: drop old seasons and pairs nobody will look at.
  const keep=new Set(universe.rivalries.map((rivalry)=>pairKey(rivalry.a,rivalry.b)));
  Object.entries(universe.headToHead).forEach(([key,entry])=>{
    Object.keys(entry.seasons).forEach((year)=>{if(Number(year)<completedYear-1)delete entry.seasons[year];});
    if(keep.has(key))return;
    const A=findDriver(universe,entry.a),B=findDriver(universe,entry.b);
    const clashed=entry.winFights+entry.podiumFights+entry.contacts+entry.titleFights>0;
    if((!A?.active||!B?.active)&&entry.winFights===0&&entry.titleFights===0)delete universe.headToHead[key];
    else if(!clashed&&completedYear-entry.lastYear>=2)delete universe.headToHead[key];
    else if(!A?.active&&!B?.active&&completedYear-entry.lastYear>3)delete universe.headToHead[key];
  });
}

export function headToHead(universe,a,b){return universe.headToHead?.[pairKey(a,b)]||null;}
export function rivalryFor(universe,a,b){return activeRivalry(ensureLegacyState(universe),a,b)||null;}

// ---- Hall of Fame

function recordHolders(universe){
  const f1=universe.drivers.filter((driver)=>(driver.career?.f1Starts||0)>0);
  const best=(key)=>{let top=null;f1.forEach((driver)=>{if(!top||(driver.career[key]||0)>(top.career[key]||0))top=driver;});return top&&(top.career[key]||0)>0?top.id:null;};
  return new Set(['titles','f1Wins','f1Poles','f1Podiums','f1Starts','f1Points'].map(best).filter(Boolean));
}
// Legacy from results only. Rarity is deliberately not used.
export function legacyScore(driver,holders=new Set()){
  const c=driver.career||{};
  const peakSeasons=(c.seasons||[]).filter((season)=>season.series==='F1'&&season.position&&season.position<=3).length;
  const w=HALL_RULES.weights;const records=holders.has(driver.id)?w.record:0;
  return Math.round(((c.titles||0)*w.title+(c.f1Wins||0)*w.win+(c.f1Poles||0)*w.pole+(c.f1Podiums||0)*w.podium+peakSeasons*w.peakSeason+records)*10)/10;
}
export function motorsportLegacyScore(driver){
  const c=driver.career||{};
  const rows=(c.seasons||[]).filter((season)=>season.series==='FE'||season.series==='WEC');
  const wins=rows.reduce((sum,season)=>sum+(season.wins||0),0);const podiums=rows.reduce((sum,season)=>sum+(season.podiums||0),0);
  return Math.round(((c.feTitles||0)*100+(c.wecTitles||0)*100+(c.leMansWins||0)*40+wins*6+podiums*1.5)*10)/10;
}

/** Runs once per off-season for the completed year. */
export function runHallOfFameVote(universe,completedYear,{story}={}){
  ensureLegacyState(universe);
  const hall=universe.hallOfFame;
  if(hall.votes.some((vote)=>vote.year===completedYear))return;
  const holders=recordHolders(universe);
  const inducted=new Set([...hall.inductees.map((item)=>item.driverId),...hall.legends.map((item)=>item.driverId)]);
  const retiredF1=universe.drivers.filter((driver)=>!driver.active&&(driver.career?.f1Starts||0)>0);
  const scored=retiredF1.map((driver)=>({driver,score:legacyScore(driver,holders)})).sort((a,b)=>b.score-a.score);
  const topCount=Math.max(1,Math.ceil(scored.length*HALL_RULES.topShare));
  const topSet=new Set(scored.slice(0,topCount).map((item)=>item.driver.id));
  const eligible=(driver)=>driver.retiredYear!=null&&driver.retiredYear<=completedYear-1;
  const floor=(driver)=>(driver.career.titles||0)>=HALL_RULES.minTitles||(driver.career.f1Wins||0)>=HALL_RULES.minWins;
  // New names join the ballot; others age on it.
  scored.forEach(({driver})=>{
    if(inducted.has(driver.id)||!eligible(driver)||!floor(driver))return;
    if(!hall.ballot.some((item)=>item.driverId===driver.id)&&!(hall.dropped||[]).includes(driver.id))hall.ballot.push({driverId:driver.id,name:driver.name,firstYear:completedYear,years:0});
  });
  const ballot=hall.ballot.map((item)=>({item,driver:findDriver(universe,item.driverId)})).filter(({driver})=>driver);
  ballot.forEach((entry)=>{entry.score=legacyScore(entry.driver,holders);entry.passes=floor(entry.driver)&&topSet.has(entry.driver.id);});
  const chosen=ballot.filter((entry)=>entry.passes).sort((a,b)=>b.score-a.score).slice(0,HALL_RULES.maxPerYear);
  const chosenIds=new Set(chosen.map((entry)=>entry.driver.id));
  chosen.forEach(({driver,score,item})=>{
    hall.inductees.push({driverId:driver.id,name:driver.name,year:completedYear,legacy:score,titles:driver.career.titles||0,wins:driver.career.f1Wins||0,poles:driver.career.f1Poles||0,podiums:driver.career.f1Podiums||0,ballotYear:item.years+1});
    driver.hallOfFame={year:completedYear,kind:'F1'};
  });
  const remaining=[];const droppedNow=[];
  ballot.forEach(({item,driver})=>{if(chosenIds.has(driver.id))return;item.years+=1;if(item.years>=HALL_RULES.ballotYears)droppedNow.push(driver);else remaining.push(item);});
  hall.ballot=remaining;hall.dropped=[...(hall.dropped||[]),...droppedNow.map((driver)=>driver.id)];
  // Motorsport Legends: FE and WEC careers, at most one a year.
  const altRetired=universe.drivers.filter((driver)=>!driver.active&&eligible(driver)&&!inducted.has(driver.id)&&!chosenIds.has(driver.id)&&((driver.career?.feTitles||0)+(driver.career?.wecTitles||0)>=2||(driver.career?.leMansWins||0)>=2));
  const altPool=universe.drivers.filter((driver)=>!driver.active).map((driver)=>motorsportLegacyScore(driver)).filter((value)=>value>0).sort((a,b)=>b-a);
  const altCut=altPool[Math.max(0,Math.ceil(altPool.length*HALL_RULES.topShare)-1)]??Infinity;
  const legend=altRetired.map((driver)=>({driver,score:motorsportLegacyScore(driver)})).filter((item)=>item.score>=altCut).sort((a,b)=>b.score-a.score)[0];
  if(legend){hall.legends.push({driverId:legend.driver.id,name:legend.driver.name,year:completedYear,legacy:legend.score,feTitles:legend.driver.career.feTitles||0,wecTitles:legend.driver.career.wecTitles||0,leMansWins:legend.driver.career.leMansWins||0});legend.driver.motorsportLegend={year:completedYear};}
  const vote={year:completedYear,inducted:chosen.map((entry)=>entry.driver.id),ballot:ballot.map((entry)=>({driverId:entry.driver.id,score:entry.score,passes:entry.passes})),dropped:droppedNow.map((driver)=>driver.id),legend:legend?.driver.id||null};
  hall.votes.push(vote);hall.votes=hall.votes.slice(-40);
  // Every year produces a Hall of Fame debate story.
  const names=chosen.map((entry)=>entry.driver.name);
  const nearMiss=ballot.filter((entry)=>!chosenIds.has(entry.driver.id)).sort((a,b)=>b.score-a.score)[0];
  story?.({category:'Hall of Fame',
    headline:names.length?`${names.join(' and ')} ${names.length>1?'enter':'enters'} the Hall of Fame`:nearMiss?`Hall of Fame debate: ${nearMiss.driver.name} waits again`:'Hall of Fame debate: no new inductees this year',
    dek:names.length?`Voters required a title or 20 wins and a legacy in the top tenth of every retired F1 driver.${nearMiss?` ${nearMiss.driver.name} stays on the ballot.`:''}${legend?` ${legend.driver.name} joins the Motorsport Legends.`:''}`:nearMiss?`${nearMiss.driver.name} has the results to be considered but did not clear the top-tenth legacy bar. ${HALL_RULES.ballotYears-((hall.ballot.find((item)=>item.driverId===nearMiss.driver.id)?.years)||HALL_RULES.ballotYears)} ballot year(s) remain.${legend?` ${legend.driver.name} joins the Motorsport Legends.`:''}`:`No retired driver met both the results floor and the legacy bar.${legend?` ${legend.driver.name} joins the Motorsport Legends.`:''}`,
    priority:names.length?96:62,subjects:[...chosen.map((entry)=>entry.driver.id),nearMiss?.driver.id,legend?.driver.id].filter(Boolean),round:0});
}
