import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getDriver, getTeam } from './data.js';
import { buildDirectorScript, driverOfTheDay, positionSeries, finalLapOf } from './director.js';
import { TYRE_BY_CODE } from './raceEngine.js';

const TYRE_COLORS={S:'#e8352e',M:'#f2c230',H:'#e9e9ee',I:'#3fb950',W:'#3a86ff'};
const BATTLE_TYPES=new Set(['overtake','failedAttack','contact','undercut']);
const ROW=32;
const MODES=[['top','Highlights'],['highlights','Extended highlights'],['extended','Every 3rd lap'],['result','Result only']];
const SPEEDS=[1,2,4];

export const driverCode=(driver)=>{const last=String(driver?.name||'???').trim().split(/\s+/).at(-1)||'???';return last.normalize('NFD').replace(/[̀-ͯ]/g,'').slice(0,3).toUpperCase();};
const teamColor=(team)=>team?.primary||team?.color||'#777';
const prefersReducedMotion=()=>{try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return false;}};
const readMuted=()=>{try{return window.localStorage.getItem('f1wc-live-muted')!=='0';}catch{return true;}};
const writeMuted=(value)=>{try{window.localStorage.setItem('f1wc-live-muted',value?'1':'0');}catch{/* storage unavailable */}};

// Small synthesized cues. Created lazily after a user gesture.
function useAudioCues(muted){
  const ctxRef=useRef(null);
  return (kind)=>{
    if(muted)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      const ctx=ctxRef.current||(ctxRef.current=new Ctx());
      const tone=(freq,start,length,type='sine',gain=.07)=>{const osc=ctx.createOscillator();const amp=ctx.createGain();osc.type=type;osc.frequency.value=freq;amp.gain.setValueAtTime(gain,ctx.currentTime+start);amp.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+start+length);osc.connect(amp).connect(ctx.destination);osc.start(ctx.currentTime+start);osc.stop(ctx.currentTime+start+length+.05);};
      if(kind==='lights'){[0,.35,.7,1.05,1.4].forEach((t)=>tone(440,t,.18,'square',.04));tone(880,1.95,.45,'square',.05);}
      else if(kind==='overtake'){tone(660,0,.12,'triangle');tone(990,.1,.16,'triangle');}
      else if(kind==='flag'){tone(523,0,.4,'triangle');tone(659,.12,.4,'triangle');tone(784,.24,.6,'triangle');}
      else if(kind==='sc'){tone(330,0,.3,'sawtooth',.03);tone(330,.4,.3,'sawtooth',.03);}
    }catch{/* audio blocked */}
  };
}

function TyreChip({code,age}){return <span className="live-tyre" style={{'--tyre':TYRE_COLORS[code]||'#888'}} title={`${TYRE_BY_CODE[code]||code}${age!=null?`, ${age} laps old`:''}`}><b>{code}</b>{age!=null&&<small>{age}</small>}</span>;}

function flagBanner(beat,isFinal){
  if(!beat)return null;
  if(isFinal)return{kind:'chequered',text:'Chequered flag'};
  const flag=beat.snapshot.flag;
  if(flag==='red')return{kind:'red',text:'Red flag'};
  if(flag==='sc')return{kind:'sc',text:'Safety Car'};
  if(flag==='vsc')return{kind:'vsc',text:'Virtual Safety Car'};
  if(beat.moments.some((m)=>m.type==='fastestLap'))return{kind:'purple',text:'Fastest lap'};
  if(beat.snapshot.track==='Wet')return{kind:'rain',text:'Rain · wet track'};
  if(beat.snapshot.track==='Damp')return{kind:'rain',text:'Rain · damp track'};
  return null;
}

function Tower({universe,snapshot,previous,focus,openDriver}){
  const prevPos=new Map((previous?.order||[]).map((entry,index)=>[entry.driverId,index]));
  return <div className="live-tower" style={{height:snapshot.order.length*ROW}} role="list" aria-label="Running order">
    {snapshot.order.map((entry,index)=>{
      const driver=getDriver(universe,entry.driverId);const team=getTeam(universe,driver?.teamId);
      const before=prevPos.get(entry.driverId);const move=before==null||entry.status==='out'?0:before-index;
      const gap=entry.status==='out'?'OUT':entry.status==='pit'?'PIT':index===0?(snapshot.lap===0?'GRID':'Leader'):`+${(entry.gap??0).toFixed(1)}`;
      return <button key={entry.driverId} role="listitem" className={`live-row ${entry.status} ${focus.has(entry.driverId)?'focus':''}`} style={{transform:`translateY(${index*ROW}px)`}} onClick={()=>openDriver?.(entry.driverId)}>
        <strong>{entry.status==='out'?'—':index+1}</strong>
        <i className={move>0?'up':move<0?'down':''} aria-label={move>0?`up ${move}`:move<0?`down ${-move}`:'no change'}>{move>0?'▲':move<0?'▼':''}</i>
        <span className="live-stripe" style={{background:teamColor(team)}}/>
        <b>{driverCode(driver)}<small>{driver?.name}</small></b>
        <TyreChip code={entry.tyre} age={entry.status==='out'?null:entry.tyreAge}/>
        <em>{gap}</em>
      </button>;
    })}
  </div>;
}

function GapStrip({universe,snapshot}){
  const running=snapshot.order.filter((entry)=>entry.status!=='out');
  const windowSeconds=Math.max(8,Math.min(30,running.at(-1)?.gap||8));
  // Label the top three only where there is room, so close cars do not overprint.
  let lastLabel=-1;const labelled=new Set();running.slice(0,3).forEach((entry)=>{const x=Math.min(1,(entry.gap||0)/windowSeconds);if(lastLabel<0||x-lastLabel>=.11){labelled.add(entry.driverId);lastLabel=x;}});
  return <div className="live-gapstrip" aria-label="Gap to leader"><div className="live-gaptrack">
    <div className="live-gapline"/>
    {running.map((entry,index)=>{
      const driver=getDriver(universe,entry.driverId);const team=getTeam(universe,driver?.teamId);
      const x=Math.min(1,(entry.gap||0)/windowSeconds);
      return <span key={entry.driverId} className={`live-dot ${labelled.has(entry.driverId)?'labelled':''}`} style={{left:`${x*100}%`,background:teamColor(team),zIndex:40-index}} title={`P${index+1} ${driver?.name} +${(entry.gap||0).toFixed(1)}s`}>{labelled.has(entry.driverId)&&<small>{driverCode(driver)}</small>}</span>;
    })}
    <div className="live-gapscale"><span>Leader</span><span>+{Math.round(windowSeconds/2)}s</span><span>+{Math.round(windowSeconds)}s{running.at(-1)?.gap>windowSeconds?'+':''}</span></div>
  </div></div>;
}

function BattleCard({universe,moment,revealed}){
  if(!moment)return <div className="live-battle quiet"><small>RACE CONTROL</small><p>Running order settles.</p></div>;
  const [a,b]=moment.driverIds||[];const da=getDriver(universe,a),db=getDriver(universe,b);
  if(!BATTLE_TYPES.has(moment.type)){
    return <div className={`live-battle note ${moment.type}`}><small>{labelFor(moment.type)}</small><p>{moment.text}</p></div>;
  }
  const verb=moment.type==='undercut'?'is undercutting':'attacks';
  const result=moment.type==='overtake'?`${da?.name} makes it stick — P${moment.position}`:moment.type==='failedAttack'?`${db?.name} holds P${moment.position}`:moment.type==='contact'?'Contact!':`${da?.name} jumps ahead in the stops`;
  return <div className={`live-battle ${revealed?`done ${moment.type}`:''}`}>
    <small>BATTLE FOR P{moment.type==='overtake'||moment.type==='undercut'?moment.position:moment.position}</small>
    <p><b>{da?.name}</b> {verb} <b>{db?.name}</b> for P{moment.position}{moment.gap!=null?` · ${moment.gap.toFixed(1)}s`:''}</p>
    <strong aria-live="polite">{revealed?result:'…'}</strong>
  </div>;
}
function labelFor(type){return{sc:'SAFETY CAR',vsc:'VIRTUAL SAFETY CAR',restart:'RESTART',rain:'WEATHER',dnf:'RETIREMENT',pit:'PIT LANE',teamOrder:'TEAM ORDERS',fastestLap:'FASTEST LAP',finish:'CHEQUERED FLAG',start:'LIGHTS OUT'}[type]||'RACE CONTROL';}

function StrategyChart({universe,race}){
  const laps=finalLapOf(race)||race.laps||1;
  return <div className="live-strategy" role="table" aria-label="Tyre strategy by driver">
    {race.rows.map((row)=>{const driver=getDriver(universe,row.driverId);return <div key={row.driverId} role="row" className="live-strategy-row">
      <span role="rowheader">{row.position}. {driverCode(driver)}</span>
      <div className="live-stints">{(row.stints||[]).map((stint,index)=>{const width=Math.max(1,(stint.to-stint.from+1)/laps*100);const code={Soft:'S',Medium:'M',Hard:'H',Intermediate:'I',Wet:'W'}[stint.compound]||'?';return <i key={index} role="cell" style={{left:`${(stint.from-1)/laps*100}%`,width:`${width}%`,'--tyre':TYRE_COLORS[code]}} title={`${stint.compound}: laps ${stint.from}–${stint.to}`}>{width>=7?code:''}</i>;})}{row.status!=='Running'&&<em>DNF</em>}</div>
    </div>;})}
  </div>;
}

function PositionChart({universe,race}){
  const [hover,setHover]=useState(null);
  const series=useMemo(()=>positionSeries(race),[race]);
  const laps=finalLapOf(race)||1;const cars=race.rows.length;
  const W=640,H=cars*15+24,padL=8,padR=44,padT=10,padB=14;
  const x=(lap)=>padL+lap/laps*(W-padL-padR);const y=(pos)=>padT+(pos-1)/(Math.max(1,cars-1))*(H-padT-padB);
  const seenTeams=new Set();
  const lines=race.rows.map((row)=>{const driver=getDriver(universe,row.driverId);const team=getTeam(universe,driver?.teamId);const dashed=seenTeams.has(team?.id);seenTeams.add(team?.id);return{row,driver,color:teamColor(team),dashed,points:series.get(row.driverId)||[]};});
  const active=lines.find((line)=>line.row.driverId===hover);
  return <div className="live-poschart">
    <p className="live-chart-readout" aria-live="polite">{active?`${active.driver?.name}: started P${active.row.grid}, finished ${active.row.status==='Running'?`P${active.row.position}`:'DNF'}`:'Hover or tap a line to follow one driver. Dashed lines are the second car of a team.'}</p>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Position by lap for every driver">
      {[1,Math.ceil(cars/2),cars].map((pos)=><line key={pos} x1={padL} x2={W-padR} y1={y(pos)} y2={y(pos)} className="grid"/>)}
      {lines.map((line)=>{const d=line.points.map((p,i)=>`${i?'L':'M'}${x(p.lap).toFixed(1)},${y(p.position).toFixed(1)}`).join(' ');const dim=hover&&hover!==line.row.driverId;return <g key={line.row.driverId} onMouseEnter={()=>setHover(line.row.driverId)} onMouseLeave={()=>setHover(null)} onClick={()=>setHover(hover===line.row.driverId?null:line.row.driverId)}>
        <path d={d} className="hit"/>
        <path d={d} stroke={line.color} strokeDasharray={line.dashed?'5 3':undefined} className={`line ${dim?'dim':''} ${hover===line.row.driverId?'active':''}`}/>
        {line.points.length>0&&<text x={x(line.points.at(-1).lap)+5} y={y(line.points.at(-1).position)+3.5} className={dim?'dim':''}>{driverCode(line.driver)}</text>}
      </g>;})}
      <text x={padL} y={H-2} className="axis">Lap 0</text><text x={W-padR} y={H-2} textAnchor="end" className="axis">Lap {laps}</text>
    </svg>
  </div>;
}

function RaceSummary({universe,race,openDriver}){
  const dotd=driverOfTheDay(race);const dotdDriver=getDriver(universe,dotd?.driverId);
  return <div className="live-summary">
    <div className="live-podium">{race.rows.slice(0,3).map((row)=>{const driver=getDriver(universe,row.driverId);const team=getTeam(universe,driver?.teamId);return <button key={row.driverId} className={`p${row.position}`} onClick={()=>openDriver?.(row.driverId)} style={{'--team':teamColor(team)}}><strong>P{row.position}</strong><b>{driver?.name}</b><small>{team?.name}</small><em>{row.position===1?row.gap:row.gap}</em></button>;})}</div>
    {dotdDriver&&<div className="live-dotd"><small>DRIVER OF THE DAY</small><b>{dotdDriver.name}</b><span>{dotd.gained>0?`+${dotd.gained} places · `:''}finished {dotd.position?`P${dotd.position}`:'DNF'}</span></div>}
    <section className="panel"><header><div><small>TYRE STINTS</small><h2>Strategy</h2></div></header><StrategyChart universe={universe} race={race}/><p className="live-legend">{Object.entries(TYRE_COLORS).map(([code,color])=><span key={code}><i style={{background:color}}/>{TYRE_BY_CODE[code]}</span>)}</p></section>
    <section className="panel"><header><div><small>LAP BY LAP</small><h2>Positions</h2></div></header><PositionChart universe={universe} race={race}/></section>
  </div>;
}

/**
 * record: an event record whose sessions.R holds the replay.
 * pending: true while this race's result is not committed to the universe yet.
 */
export function LiveRace({universe,record,series='F1',pending=false,onComplete,onSkip,onBack,openDriver}){
  const race=record?.sessions?.R;
  const [mode,setMode]=useState('top');
  const [speed,setSpeed]=useState(1);
  const [playing,setPlaying]=useState(false);
  const [index,setIndex]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [muted,setMuted]=useState(readMuted);
  const completedRef=useRef(false);
  const cue=useAudioCues(muted);
  const script=useMemo(()=>buildDirectorScript(race,mode),[race,mode]);
  const beats=script.beats;
  const beat=beats[Math.min(index,beats.length-1)];
  const isFinal=index>=beats.length-1&&beats.length>0;
  const reduced=prefersReducedMotion();

  useEffect(()=>{setIndex(0);setRevealed(false);},[mode]);
  useEffect(()=>{
    setRevealed(false);
    if(!beat)return;
    const reveal=window.setTimeout(()=>setRevealed(true),(reduced?200:beat.duration*.45)/speed);
    if(playing){
      const kinds=beat.moments.map((m)=>m.type);
      if(beat.kind==='start')cue('lights');else if(beat.kind==='finish')cue('flag');else if(kinds.includes('sc')||kinds.includes('vsc'))cue('sc');else if(kinds.includes('overtake'))window.setTimeout(()=>cue('overtake'),beat.duration*.45/speed);
    }
    return()=>window.clearTimeout(reveal);
  },[index,mode,beat]);
  useEffect(()=>{
    if(!playing||!beat||isFinal)return;
    const timer=window.setTimeout(()=>setIndex((value)=>Math.min(beats.length-1,value+1)),beat.duration/speed);
    return()=>window.clearTimeout(timer);
  },[playing,index,speed,beats.length,beat,isFinal]);
  useEffect(()=>{if(isFinal){setPlaying(false);if(pending&&!completedRef.current){completedRef.current=true;onComplete?.();}}},[isFinal]);

  if(!race?.snapshots?.length){
    return <section className="page live-page"><button className="back-link" onClick={onBack}>← Back</button><div className="empty"><b>F1</b><h3>No replay for this race</h3><p>Races from older saves and archived seasons keep their full classification, but lap-by-lap replay data is only stored for the current season.</p></div></section>;
  }
  const laps=finalLapOf(race);
  const step=race.stepLaps||1;
  const banner=flagBanner(beat,isFinal);
  const focus=new Set((beat?.moments||[]).flatMap((m)=>BATTLE_TYPES.has(m.type)||m.type==='pit'||m.type==='dnf'?(m.driverIds||[]).slice(0,2):[]));
  const battle=(beat?.moments||[]).find((m)=>BATTLE_TYPES.has(m.type))||(beat?.moments||[]).find((m)=>m.type!=='fastestLap')||null;
  const feed=beats.slice(0,index+1).flatMap((item)=>item.moments).filter(Boolean).reverse().slice(0,8);
  const previous=index>0?beats[index-1]?.snapshot:null;
  const lapLabel=!beat?'—':beat.lap===0?'Grid':beat.fromLap!=null&&beat.lap-beat.fromLap>step?`Lap ${beat.fromLap} → ${beat.lap}`:`Lap ${beat.lap}`;
  const nextFlag=()=>{const target=beats.findIndex((item,i)=>i>index&&(item.snapshot.flag!=='green'||item.kind==='flag'));setIndex(target>=0?target:beats.length-1);};
  const toggleMute=()=>{setMuted((value)=>{writeMuted(!value);return !value;});};
  const event=record.event||{};
  return <section className="page live-page">
    <div className="live-top"><button className="back-link" onClick={onBack}>← Back</button>{pending&&!isFinal&&<button className="outline small" onClick={onSkip}>Skip to result</button>}</div>
    <header className="live-head">
      <div><small>{series} · ROUND {record.round} · {pending?'LIVE':'REPLAY'}</small><h1>{event.name||record.eventId}</h1></div>
      <div className="live-lap" aria-live="polite"><b>{lapLabel}</b><small>of {laps}</small></div>
    </header>
    {banner&&<div className={`live-flag ${banner.kind}`} role="status">{banner.text}</div>}
    <div className="live-controls">
      <button className="primary small" onClick={()=>{if(isFinal){setIndex(0);setPlaying(true);}else setPlaying((value)=>!value);}} aria-pressed={playing}>{isFinal?'Replay':playing?'Pause':index===0?'Start':'Play'}</button>
      <div className="live-seg" role="group" aria-label="Speed">{SPEEDS.map((value)=><button key={value} className={speed===value?'active':''} onClick={()=>setSpeed(value)}>{value}×</button>)}</div>
      <select value={mode} onChange={(e)=>setMode(e.target.value)} aria-label="Playback mode">{MODES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <button className="outline small" onClick={nextFlag} disabled={isFinal}>Skip to {beats.slice(index+1).some((item)=>item.snapshot.flag!=='green'||item.kind==='flag')?'next flag':'flag'}</button>
      <button className="outline small" onClick={toggleMute} aria-pressed={!muted}>{muted?'Sound off':'Sound on'}</button>
    </div>
    {beat&&<div className="live-grid">
      <div className="live-main">
        <GapStrip universe={universe} snapshot={beat.snapshot}/>
        <BattleCard universe={universe} moment={battle} revealed={revealed||isFinal}/>
        <Tower universe={universe} snapshot={beat.snapshot} previous={previous} focus={focus} openDriver={openDriver}/>
      </div>
      <aside className="live-side">
        <section className="panel live-radio"><header><div><small>RACE RADIO</small><h2>Moments</h2></div></header>
          <ol>{feed.length?feed.map((m,i)=><li key={`${m.lap}-${m.type}-${i}`} className={m.type}><b>L{m.lap}</b><span>{m.text}</span></li>):<li className="quiet"><span>Waiting for lights out.</span></li>}</ol>
        </section>
        <div className="live-progress" aria-hidden="true"><i style={{width:`${beats.length>1?index/(beats.length-1)*100:100}%`}}/></div>
        <p className="live-note">{mode==='top'?`Highlights: top-3 fights only, about ${Math.round(script.duration/1000)}s at 1×.`:mode==='highlights'?`Extended highlights: about ${Math.round(script.duration/1000)}s at 1×.`:mode==='extended'?`Extended: every third lap, about ${Math.round(script.duration/1000)}s at 1×.`:'Result only.'}</p>
      </aside>
    </div>}
    {isFinal&&<RaceSummary universe={universe} race={race} openDriver={openDriver}/>}
  </section>;
}
