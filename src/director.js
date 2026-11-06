// The race "director": turns stored lap snapshots and scored moments into a
// short playback script. Pure functions, so scripts can test them in Node.

// top: only fights for the top 3. highlights: the wider highlights reel.
export const DIRECTOR_MODES=['top','highlights','extended','result'];
const TOP_BATTLES=new Set(['overtake','undercut','contact']);
const isTopBattle=(m)=>TOP_BATTLES.has(m.type)&&m.position!=null&&m.position<=3;
const BATTLE_TYPES=new Set(['overtake','failedAttack','contact','undercut']);
const FLAG_TYPES=new Set(['sc','vsc','rain','restart']);

export function finalLapOf(race){return race?.snapshots?.at(-1)?.lap??race?.laps??0;}

// The first stored snapshot at or after a lap (long races skip odd laps).
export function snapshotAt(race,lap){
  const snaps=race.snapshots||[];
  for(const snap of snaps)if(snap.lap>=lap)return snap;
  return snaps.at(-1);
}

function momentsOf(race){return[...(race.moments||[])].sort((a,b)=>a.lap-b.lap||(b.score||0)-(a.score||0));}

function pickHighlights(candidates,count){
  const picked=[];
  const sorted=[...candidates].sort((a,b)=>(b.score||0)-(a.score||0));
  for(const moment of sorted){
    if(picked.length>=count)break;
    const pair=(moment.driverIds||[]).slice(0,2).sort().join('|');
    // Avoid repeating the same fight within a few laps.
    if(BATTLE_TYPES.has(moment.type)&&picked.some((other)=>BATTLE_TYPES.has(other.type)&&Math.abs(other.lap-moment.lap)<=3&&(other.driverIds||[]).slice(0,2).sort().join('|')===pair))continue;
    if(moment.type==='pit'&&picked.filter((other)=>other.type==='pit').length>=3)continue;
    picked.push(moment);
  }
  return picked;
}

function closingLapCount(race){
  const last=race.snapshots?.at(-1);
  const close=(last?.order||[]).slice(1,3).some((entry)=>entry.interval!=null&&entry.interval<2.5);
  return close?5:3;
}

/**
 * Returns {beats, duration}. Each beat: {lap, fromLap, snapshot, moments, duration, kind}.
 * Durations are milliseconds at 1x speed.
 */
export function buildDirectorScript(race,mode='top'){
  if(!race?.snapshots?.length)return{beats:[],duration:0};
  const laps=finalLapOf(race);
  const moments=momentsOf(race);
  const finishMoments=moments.filter((m)=>m.type==='finish'||m.type==='fastestLap');
  const beats=[];
  const add=(lap,beatMoments,duration,kind)=>{
    const snapshot=lap===0?race.snapshots[0]:snapshotAt(race,lap);
    const previous=beats.at(-1);
    if(previous&&previous.snapshot===snapshot&&kind!=='finish'){previous.moments.push(...beatMoments);previous.duration+=Math.min(1600,beatMoments.length*900);return;}
    beats.push({lap:snapshot.lap,fromLap:previous?.lap??null,snapshot,moments:beatMoments,duration,kind});
  };
  if(mode==='result'){
    add(laps,finishMoments,3500,'finish');
    return{beats,duration:beats.reduce((sum,beat)=>sum+beat.duration,0)};
  }
  const stepLaps=race.stepLaps||1;
  add(0,[],2400,'grid');
  add(Math.max(1,stepLaps),moments.filter((m)=>m.type==='start'),3600,'start');
  const closing=closingLapCount(race)*stepLaps;
  const closingFrom=laps-closing+1;
  const middle=moments.filter((m)=>m.type!=='start'&&m.type!=='finish'&&m.type!=='fastestLap'&&m.lap>stepLaps&&m.lap<closingFrom);
  if(mode==='top'){
    // Only position changes and contact for P1–P3, then straight to the flag.
    const picked=pickHighlights(moments.filter((m)=>isTopBattle(m)&&m.lap>stepLaps&&m.lap<laps),99).sort((a,b)=>a.lap-b.lap||(b.score||0)-(a.score||0));
    const byLap=new Map();
    picked.forEach((moment)=>{const key=snapshotAt(race,moment.lap).lap;byLap.set(key,[...(byLap.get(key)||[]),moment]);});
    [...byLap.entries()].sort((a,b)=>a[0]-b[0]).forEach(([lap,list])=>add(lap,list,3000+Math.min(2,list.length-1)*1000,'moment'));
    add(laps,finishMoments,4200,'finish');
    return{beats,duration:beats.reduce((sum,beat)=>sum+beat.duration,0)};
  }
  if(mode==='highlights'){
    const rich=middle.filter((m)=>(m.score||0)>=8).length;
    const count=Math.max(10,Math.min(20,Math.round(8+rich/2)));
    const picked=pickHighlights(middle,count).sort((a,b)=>a.lap-b.lap||(b.score||0)-(a.score||0));
    const byLap=new Map();
    picked.forEach((moment)=>{const key=snapshotAt(race,moment.lap).lap;byLap.set(key,[...(byLap.get(key)||[]),moment]);});
    [...byLap.entries()].sort((a,b)=>a[0]-b[0]).forEach(([lap,list])=>add(lap,list,3000+Math.min(2,list.length-1)*1000,FLAG_TYPES.has(list[0].type)?'flag':'moment'));
  }else{
    let lastLap=stepLaps;
    const every=3*stepLaps;
    for(let lap=every;lap<closingFrom;lap+=every){
      const between=middle.filter((m)=>m.lap>lastLap&&m.lap<=lap&&(m.score||0)>=6).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,3);
      add(lap,between,1300+between.length*1100,between.length?'moment':'lap');
      lastLap=lap;
    }
  }
  const closingMoments=moments.filter((m)=>m.lap>=closingFrom&&m.type!=='finish'&&m.type!=='fastestLap');
  for(let lap=closingFrom;lap<laps;lap+=stepLaps){
    const list=closingMoments.filter((m)=>m.lap===lap||(stepLaps>1&&m.lap>lap-stepLaps&&m.lap<=lap)).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,2);
    add(lap,list,2100+list.length*700,'closing');
  }
  add(laps,finishMoments,4200,'finish');
  return{beats,duration:beats.reduce((sum,beat)=>sum+beat.duration,0)};
}

// Driver of the day: biggest positive moment score plus positions gained.
export function driverOfTheDay(race){
  const totals=new Map();
  const bump=(id,value)=>{if(id)totals.set(id,(totals.get(id)||0)+value);};
  (race.moments||[]).forEach((m)=>{
    const [first,second]=m.driverIds||[];
    if(m.type==='overtake'||m.type==='undercut')bump(first,m.score||0);
    else if(m.type==='failedAttack')bump(second,(m.score||0)*.4);
    else if(m.type==='start')(m.driverIds||[]).slice(1).forEach((id)=>bump(id,(m.score||0)*.5));
    else if(m.type==='finish')bump(first,(m.score||0)*.5);
  });
  (race.rows||[]).forEach((row)=>{if(row.status==='Running')bump(row.driverId,Math.max(0,(row.grid||0)-(row.position||0))*2);});
  let best=null;
  totals.forEach((value,id)=>{if(!best||value>best.value)best={driverId:id,value};});
  if(!best)return null;
  const row=(race.rows||[]).find((item)=>item.driverId===best.driverId);
  return{...best,gained:row?Math.max(0,(row.grid||0)-(row.position||0)):0,position:row?.position||null};
}

// Position by lap for the position chart.
export function positionSeries(race){
  const series=new Map();
  (race.snapshots||[]).forEach((snap)=>{
    snap.order.forEach((entry,index)=>{
      if(!series.has(entry.driverId))series.set(entry.driverId,[]);
      if(entry.status!=='out')series.get(entry.driverId).push({lap:snap.lap,position:index+1});
    });
  });
  return series;
}
