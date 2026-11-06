import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getDriver, getTeam, currentDriverRating } from './data.js';
import { driverStandings, constructorStandings, raceForecast, showcaseReason, isTitleDecider, circuitFitRanking, hasReplay, qualifyingCuts } from './sim.js';
import { driverOfTheDay } from './director.js';
import { LiveRace } from './LiveRace.jsx';
import { L, useLinks, restoreScroll } from './Links.jsx';

// Guided Grand Prix weekend. See docs/GRAND_PRIX_WEEKEND.md for the spoiler rules.
const STEP_LABELS={pre:'Pre-race',quali:'Qualifying',sprint:'Sprint',race:'Race',post:'Post-race'};
export const weekendSteps=(record)=>record?.sessions?.S?['pre','quali','sprint','race','post']:['pre','quali','race','post'];

const prefersReducedMotion=()=>{try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return false;}};
const lap=(value)=>{if(value==null)return'—';if(typeof value==='string')return value;const minutes=Math.floor(value/60);return `${minutes}:${(value-minutes*60).toFixed(3).padStart(6,'0')}`;};
const teamColor=(team)=>team?.primary||team?.color||'#777';
const zScores=(values)=>{const mean=values.reduce((s,v)=>s+v,0)/Math.max(1,values.length);const sd=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/Math.max(1,values.length))||1;return values.map((v)=>(v-mean)/sd);};

// Win odds from what is visible before the race: driver rating, car fit, last-5 form, championship position.
export function winOdds(universe,event,limit=8){
  const table=driverStandings(universe,'F1');
  const drivers=table.filter((driver)=>driver.role==='Race driver');
  if(drivers.length<2)return[];
  const fit=new Map(circuitFitRanking(universe,event).map((team)=>[team.id,team.fitScore]));
  const avgForm=(driver)=>{const form=driver.season?.form||[];return form.length?form.reduce((s,v)=>s+v,0)/form.length:11;};
  const rating=zScores(drivers.map((driver)=>currentDriverRating(driver)));
  const car=zScores(drivers.map((driver)=>fit.get(driver.teamId)??0));
  const form=zScores(drivers.map((driver)=>-avgForm(driver)));
  const champ=zScores(drivers.map((driver)=>-(table.indexOf(driver)+1)));
  const strength=drivers.map((_,i)=>1.6*car[i]+0.9*rating[i]+0.6*form[i]+0.4*champ[i]);
  const k=1.4;const top=Math.max(...strength);const exp=strength.map((s)=>Math.exp(k*(s-top)));const total=exp.reduce((s,v)=>s+v,0);
  return drivers.map((driver,i)=>({driver,p:exp[i]/total})).sort((a,b)=>b.p-a.p).slice(0,limit).map((item)=>({...item,odds:1/item.p}));
}

// Previous edition at this circuit, from the archive plus this season's results.
function previousEdition(universe,record,event){
  const circuitId=record?.circuitId||event?.circuitId||event?.id;const year=record?.year??universe.year;
  return [...(universe.eventArchive||[]),...(universe.competitionEventResults?.F1||[])]
    .filter((item)=>item.series==='F1'&&item.circuitId===circuitId&&item.year<year).sort((a,b)=>b.year-a.year)[0]||null;
}

function Crumbs({steps,step,reached,go,onSkip,canSkip}){
  const nextId=steps[steps.indexOf(step)+1];
  const index=steps.indexOf(step);
  return <nav className="gpw-crumbs" aria-label="Grand Prix weekend">
    <span className="gpw-count">{index+1}/{steps.length}</span>
    <ol>{steps.map((id,i)=><li key={id}><button className={`${id===step?'active':''} ${i<=reached?'reached':''}`} disabled={i>reached} aria-current={id===step?'step':undefined} onClick={()=>go(id)}>{STEP_LABELS[id]}</button>{i<steps.length-1&&<i aria-hidden="true">›</i>}</li>)}</ol>
    {canSkip&&<button className="outline small gpw-skip" onClick={onSkip}>Skip<span> to result</span></button>}
    {nextId&&<button className="primary small gpw-top-next" onClick={()=>go(nextId)}>Next ›</button>}
  </nav>;
}

function NextButton({label,onClick}){return <div className="gpw-next"><button className="primary" onClick={onClick}>{label}</button></div>;}

// pre: the universe from just before the race (null for a replay). universe: used for names and history.
function PreRace({universe,pre,record,event,pendingReason,ui,next}){
  const {Flag,Panel}=ui;
  const forecast=pre&&event?raceForecast(pre,event):null;
  const reason=pendingReason||(pre&&event?showcaseReason(pre,event):null);
  const odds=useMemo(()=>pre&&event?winOdds(pre,event):[],[pre,event]);
  const last=previousEdition(universe,record,event);
  const drivers=pre?driverStandings(pre,'F1').slice(0,3):[];const teams=pre?constructorStandings(pre).slice(0,3):[];
  const decider=pre&&event?isTitleDecider(pre,event):false;
  const info=event||record?.event||{};const total=(pre||universe)?.calendar?.length;
  const maxP=odds[0]?.p||1;
  const name=(id)=>getDriver(universe,id)?.name||'Historic driver';
  return <>
    <div className="gpw-hero">
      <small>ROUND {record?.round||info.round||'—'}{total?` OF ${total}`:''} · {info.city||''}</small>
      <h1><Flag country={info.country}/> {info.name||'Grand Prix'}</h1>
      <p>{info.country}{forecast?` · Forecast: ${forecast.forecastChance}% chance of rain · ${forecast.temperature}°C`:info.rain!=null?` · ${info.rain}% rain baseline`:''}</p>
      <div className="gpw-tags">{reason&&<span className="gpw-tag">{reason}</span>}{decider&&<span className="gpw-tag hot">Title decider</span>}</div>
    </div>
    <div className="gpw-grid">
      {pre?<Panel title="Win odds" eyebrow="BEFORE QUALIFYING">
        {odds.length?<div className="gpw-odds">{odds.map(({driver,p,odds:value})=>{const team=getTeam(universe,driver.teamId);return <div key={driver.id}><Flag driver={driver}/><span><b><L kind="driver" id={driver.id}>{driver.name}</L></b><small><L kind="team" id={team?.id}>{team?.name}</L></small></span><i><b style={{width:`${p/maxP*100}%`,background:teamColor(team)}}/></i><em>{value>=100?Math.round(value):value.toFixed(value>=10?1:2)}</em></div>;})}</div>:<p>No odds available.</p>}
        <p className="model-note">Decimal odds from driver rating, car fit for this circuit, last-five form and championship position.</p>
      </Panel>:<Panel title="Win odds" eyebrow="REPLAY"><p>Odds are only shown before a live weekend, while the result is still unknown.</p></Panel>}
      <Panel title="Last year here" eyebrow={last?`YEAR ${last.year>=2000?Math.max(1,last.year-2025):last.year}`:'HISTORY'}>
        {last?<div className="gpw-list">{(last.podium||[]).map((item)=><div key={item.driverId}><strong>P{item.position}</strong><span><b><L kind="driver" id={item.driverId}>{name(item.driverId)}</L></b><small><L kind="team" id={item.teamId}>{getTeam(universe,item.teamId)?.name||''}</L></small></span></div>)}
          <div><strong>Pole</strong><span><b>{last.poleId?<L kind="driver" id={last.poleId}>{name(last.poleId)}</L>:'—'}</b></span></div>
          <div><strong>FL</strong><span><b>{last.fastestLapDriverId?<L kind="driver" id={last.fastestLapDriverId}>{name(last.fastestLapDriverId)}</L>:'—'}</b><small>{lap(last.fastestLapTime)}</small></span></div>
        </div>:<p>First edition.</p>}
      </Panel>
      {pre&&<Panel title="Championship" eyebrow="BEFORE THIS RACE" action={<L kind="series" id="F1" className="link">Standings ›</L>}>
        <div className="gpw-list">{drivers.map((driver,i)=><div key={driver.id}><strong>P{i+1}</strong><span><b><L kind="driver" id={driver.id}>{driver.name}</L></b><small><L kind="team" id={driver.teamId}>{getTeam(universe,driver.teamId)?.name}</L></small></span><em>{driver.season.points}{drivers[0].season.points>driver.season.points?<small className="gap"> −{drivers[0].season.points-driver.season.points}</small>:null}</em></div>)}</div>
        <div className="gpw-list teams">{teams.map((team,i)=><div key={team.id}><strong>P{i+1}</strong><span><b><L kind="team" id={team.id}>{team.name}</L></b></span><em>{team.seasonPoints}{teams[0].seasonPoints>team.seasonPoints?<small className="gap"> −{teams[0].seasonPoints-team.seasonPoints}</small>:null}</em></div>)}</div>
      </Panel>}
    </div>
    <NextButton label="Go to qualifying ›" onClick={next}/>
  </>;
}

// Rows appear slowest-first over about 2.5s so pole is the last to show.
function useReveal(count,key,instant){
  // State is tagged with its key so a tab switch never reuses the previous tab's count.
  const [state,setState]=useState({key,shown:instant?count:0});
  useEffect(()=>{
    if(instant){setState({key,shown:count});return undefined;}
    setState({key,shown:0});const every=Math.max(70,2500/Math.max(1,count));
    const timer=window.setInterval(()=>setState((value)=>{if(value.shown>=count){window.clearInterval(timer);return value;}return{key,shown:value.shown+1};}),every);
    return()=>window.clearInterval(timer);
  },[key,count,instant]);
  const shown=state.key===key?state.shown:(instant?count:0);
  return[shown,()=>setState({key,shown:count})];
}

function QualiRound({universe,rows,cut,combined,round,reveal,Flag}){
  const [shown]=reveal;
  return <div className="gpw-qround" role="table" aria-label={`${round} times`}>
    {rows.map((row,index)=>{
      const visible=index>=rows.length-shown;const driver=getDriver(universe,row.driverId);const team=getTeam(universe,row.teamId||driver?.teamId);
      const out=cut!=null&&index>=cut;const info=combined.get(row.driverId);const pole=round==='Q3'&&index===0;
      return <React.Fragment key={row.driverId}>
        {cut!=null&&index===cut&&<div className="quali-cut" role="separator"><span>{round} cut · P{cut}</span></div>}
        <div role="row" className={`gpw-qrow ${visible?'shown':'hidden'} ${out?'out':''} ${pole&&visible?'pole':''}`}>
          <strong>{index+1}</strong>
          {visible?<><span className="gpw-qdriver"><i style={{background:teamColor(team)}}/><Flag driver={driver}/><b><L kind="driver" id={driver?.id}>{driver?.name||'Unknown'}</L></b></span>
            <em>{lap(row.time)}</em><small>{out?(info?.reason||`Out in ${round}`):pole?'Pole':index===0?'Fastest':row.gap}</small></>
          :<span className="gpw-qdriver"><b>…</b></span>}
        </div>
      </React.Fragment>;
    })}
  </div>;
}

const qualiMemory=new Map();
function Qualifying({universe,record,ui,next}){
  const {Flag,Panel,QualifyingTable}=ui;const links=useLinks();
  const memory=qualiMemory.get(record.id);
  const [tab,setTab]=useState(memory?.tab||'Q1');const [done,setDone]=useState(()=>new Set(memory?.done||[]));
  useEffect(()=>{qualiMemory.set(record.id,{tab,done:[...done]});},[tab,done,record.id]);
  const reduced=prefersReducedMotion();
  const combinedRows=record.sessions.QUALI?.rows||[];
  const cuts=record.sessions.QUALI?.cuts||qualifyingCuts(combinedRows.length);
  const combined=useMemo(()=>new Map(combinedRows.map((row)=>[row.driverId,row])),[combinedRows]);
  const rows=[...(record.sessions[tab]?.rows||[])].sort((a,b)=>a.time-b.time);
  const cut=tab==='Q1'?cuts.q1Cut:tab==='Q2'?cuts.q2Cut:null;
  const reveal=useReveal(rows.length,tab,reduced||done.has(tab));
  const complete=reveal[0]>=rows.length;
  useEffect(()=>{if(complete&&!done.has(tab))setDone((current)=>new Set([...current,tab]));},[complete,tab]);
  const pole=getDriver(universe,combinedRows[0]?.driverId);
  const q3Done=done.has('Q3');
  return <>
    <div className="gpw-hero slim"><small>QUALIFYING · {record.sessions.QUALI?.weather||'CONDITIONS'}{record.sessions.QUALI?.temperature!=null?` · ${record.sessions.QUALI.temperature}°C`:''}</small><h1>{record.event?.name}</h1></div>
    <div className="tab-row gpw-tabs" role="tablist">{['Q1','Q2','Q3'].map((key)=><button key={key} role="tab" aria-selected={tab===key} className={`pill ${tab===key?'active':''}`} onClick={()=>setTab(key)}>{key}</button>)}
      {!complete&&<button className="outline small" onClick={reveal[1]}>Show all</button>}</div>
    <Panel title={tab==='Q3'?'Top-10 shoot-out':`${tab} times`} eyebrow={tab==='Q3'?'FIGHT FOR POLE':`BOTTOM ${rows.length-(cut||0)} ARE OUT`}>
      <QualiRound universe={universe} rows={rows} cut={cut} combined={combined} round={tab} reveal={reveal} Flag={Flag}/>
    </Panel>
    {q3Done&&<Panel title="Starting grid" eyebrow={pole?`POLE: ${pole.name.toUpperCase()}`:'GRID'}>
      {pole&&<p className="gpw-pole"><Flag driver={pole}/> <b><L kind="driver" id={pole.id}>{pole.name}</L></b> starts from pole for <L kind="team" id={pole.teamId}>{getTeam(universe,pole.teamId)?.name}</L>.</p>}
      <QualifyingTable universe={universe} session={record.sessions.QUALI} openDriver={(id)=>links?.can('driver',id)&&links.open('driver',id)}/>
    </Panel>}
    {tab!=='Q3'?<NextButton label={`${tab==='Q1'?'Q2':'Q3'} ›`} onClick={()=>setTab(tab==='Q1'?'Q2':'Q3')}/>:<NextButton label={record.sessions.S?'Sprint ›':'Lights out ›'} onClick={next}/>}
  </>;
}

function Sprint({universe,record,ui,next}){
  const {Panel,QualifyingTable,RaceResultTable}=ui;const links=useLinks();const openDriver=(id)=>links?.can('driver',id)&&links.open('driver',id);
  const replay=hasReplay(record.sessions.S);
  const [view,setView]=useState('SQ');
  const sprintRecord=useMemo(()=>({...record,sessions:{R:record.sessions.S}}),[record]);
  return <>
    <div className="gpw-hero slim"><small>SPRINT</small><h1>{record.event?.name}</h1></div>
    <div className="tab-row gpw-tabs">{[['SQ','Sprint qualifying'],['S','Sprint result'],...(replay?[['W','Watch sprint']]:[])].map(([key,label])=><button key={key} className={`pill ${view===key?'active':''}`} onClick={()=>setView(key)}>{label}</button>)}</div>
    {view==='SQ'&&<Panel title="Sprint qualifying" eyebrow="SPRINT GRID">{record.sessions.SQUALI?<QualifyingTable universe={universe} session={record.sessions.SQUALI} openDriver={openDriver}/>:<p>No sprint qualifying data.</p>}</Panel>}
    {view==='S'&&<Panel title="Sprint" eyebrow="RESULT"><RaceResultTable universe={universe} session={record.sessions.S} openDriver={openDriver}/></Panel>}
    {view==='W'&&<LiveRace universe={universe} record={sprintRecord} series="F1" pending={false} onBack={()=>setView('S')}/>}
    <NextButton label="Lights out ›" onClick={next}/>
  </>;
}

function PostRace({universe,before,record,ui,actions}){
  const {Flag,Panel}=ui;
  const race=record.sessions.R;
  const winner=getDriver(universe,record.winnerId);const winnerTeam=getTeam(universe,winner?.teamId);
  const fastest=getDriver(universe,record.fastestLapDriverId);
  const dotd=race?.moments?driverOfTheDay(race):null;const dotdDriver=getDriver(universe,dotd?.driverId);
  const eventPoints=new Map();[record.sessions.S,race].forEach((session)=>(session?.rows||[]).forEach((row)=>eventPoints.set(row.driverId,(eventPoints.get(row.driverId)||0)+(row.points||0))));
  const beforeDrivers=before?driverStandings(before,'F1'):null;const beforeTeams=before?constructorStandings(before):null;
  const drivers=driverStandings(universe,'F1').slice(0,5).map((driver,i)=>{
    if(!beforeDrivers)return{driver,gained:eventPoints.get(driver.id)||0,move:null,i};
    const idx=beforeDrivers.findIndex((item)=>item.id===driver.id);const prev=beforeDrivers[idx];
    return{driver,gained:driver.season.points-(prev?.season.points||0),move:idx<0?null:idx-i,i};
  });
  const teams=constructorStandings(universe).slice(0,5).map((team,i)=>{
    if(!beforeTeams){let gained=0;eventPoints.forEach((points,id)=>{const row=[...(race?.rows||[]),...(record.sessions.S?.rows||[])].find((item)=>item.driverId===id);if(row?.teamId===team.id)gained+=points;});return{team,gained:gained,move:null,i};}
    const idx=beforeTeams.findIndex((item)=>item.id===team.id);return{team,gained:team.seasonPoints-(beforeTeams[idx]?.seasonPoints||0),move:idx<0?null:idx-i,i};
  });
  const known=new Set((before?.stories||[]).map((story)=>story.id));
  const stories=(universe.stories||[]).filter((story)=>story.year===record.year&&story.round===record.round&&!known.has(story.id)&&!['World Results','Race Week'].includes(story.category))
    .sort((a,b)=>(b.priority||0)-(a.priority||0)).slice(0,3);
  const move=(value)=>value==null?'':value>0?<i className="up">▲{value}</i>:value<0?<i className="down">▼{-value}</i>:<i>–</i>;
  return <>
    <div className="gpw-hero winner" style={{'--team':teamColor(winnerTeam)}}>
      <small>WINNER · {record.event?.name?.toUpperCase()}</small>
      <h1><Flag driver={winner}/> <L kind="driver" id={winner?.id}>{winner?.name||'—'}</L></h1>
      <p><L kind="team" id={winnerTeam?.id}>{winnerTeam?.name}</L>{winner?.career?` · ${winner.career.f1Wins||1} career ${winner.career.f1Wins===1?'win':'wins'} · ${winner.season?.wins||1} this season`:''}</p>
    </div>
    <div className="gpw-podium">{(record.podium||[]).map((item)=>{const driver=getDriver(universe,item.driverId);const team=getTeam(universe,item.teamId);return <div key={item.driverId} className={`p${item.position}`} style={{'--team':teamColor(team)}}><strong>P{item.position}</strong><b><L kind="driver" id={driver?.id}>{driver?.name}</L></b><small><L kind="team" id={team?.id}>{team?.name}</L></small></div>;})}</div>
    <div className="gpw-facts">
      <div><small>FASTEST LAP</small><b><L kind="driver" id={fastest?.id}>{fastest?.name||'—'}</L></b><span>{lap(record.fastestLapTime)}</span></div>
      {dotdDriver&&<div><small>DRIVER OF THE DAY</small><b><L kind="driver" id={dotdDriver.id}>{dotdDriver.name}</L></b><span>{dotd.gained>0?`+${dotd.gained} places · `:''}{dotd.position?`P${dotd.position}`:'DNF'}</span></div>}
    </div>
    <div className="gpw-grid two">
      <Panel title="Drivers" eyebrow={before?'STANDINGS AFTER THIS RACE':'CURRENT STANDINGS'} action={<L kind="series" id="F1" className="link">Championship ›</L>}><div className="gpw-list">{drivers.map(({driver,gained,move:m,i})=><div key={driver.id}><strong>P{i+1}</strong><span><b><L kind="driver" id={driver.id}>{driver.name}</L></b><small><L kind="team" id={driver.teamId}>{getTeam(universe,driver.teamId)?.name}</L></small></span><em>{driver.season.points}<small> +{gained}</small></em>{move(m)}</div>)}</div></Panel>
      <Panel title="Teams" eyebrow={before?'STANDINGS AFTER THIS RACE':'CURRENT STANDINGS'} action={<L kind="series" id="F1" className="link">Championship ›</L>}><div className="gpw-list">{teams.map(({team,gained,move:m,i})=><div key={team.id}><strong>P{i+1}</strong><span><b><L kind="team" id={team.id}>{team.name}</L></b></span><em>{team.seasonPoints}<small> +{gained}</small></em>{move(m)}</div>)}</div></Panel>
    </div>
    {stories.length>0&&<Panel title="Headlines" eyebrow="FROM THIS RACE"><div className="gpw-stories">{stories.map((story)=><article key={story.id}><small>{story.category}</small><b>{story.headline}</b><p>{story.dek}</p></article>)}</div></Panel>}
    <div className="gpw-next actions"><button className="outline" onClick={actions.fullResults}>Full results</button>{actions.nextGP&&<button className="primary" onClick={actions.nextGP} disabled={actions.busy}>Next GP ›</button>}<button className="outline" onClick={actions.home}>Back to Home</button></div>
  </>;
}

/**
 * live: {record, pending, before, reason, reached}
 * pending: the universe with the race done but not committed yet (null for a replay or after commit).
 * before: the committed universe from just before the race (null for a replay).
 */
export function GrandPrixWeekend({universe,live,step,go,onCommit,onSkip,actions,ui}){
  const record=live?.record;
  const steps=weekendSteps(record);
  const current=steps.includes(step)?step:'pre';
  const index=steps.indexOf(current);
  const reached=live?.pending?Math.max(live.reached||0,index):steps.length-1;
  const timer=useRef(null);
  useEffect(()=>{if(current==='post'&&live?.pending)onCommit();},[current,live?.pending]);
  useEffect(()=>()=>window.clearTimeout(timer.current),[current]);
  useEffect(()=>{restoreScroll();},[current]);
  if(!record)return <section className="page"><div className="empty"><b>F1</b><h3>No weekend open</h3><p>Use Next GP to simulate up to the next Grand Prix and follow the weekend.</p></div></section>;
  const viewUniverse=live.pending||universe;
  const preUniverse=live.before;
  const event=(preUniverse||universe).calendar?.find((item)=>item.id===record.eventId)||null;
  const nextStep=()=>go(steps[Math.min(steps.length-1,index+1)]);
  return <section className="page gpw-page">
    <Crumbs steps={steps} step={current} reached={reached} go={go} onSkip={onSkip} canSkip={Boolean(live.pending)}/>
    {current==='pre'&&<PreRace universe={universe} pre={preUniverse} record={record} event={event} pendingReason={live.reason} ui={ui} next={nextStep}/>}
    {current==='quali'&&<Qualifying universe={viewUniverse} record={record} ui={ui} next={nextStep}/>}
    {current==='sprint'&&<Sprint universe={viewUniverse} record={record} ui={ui} next={nextStep}/>}
    {current==='race'&&<LiveRace universe={viewUniverse} record={record} series="F1" pending={Boolean(live.pending)}
      onComplete={()=>{timer.current=window.setTimeout(()=>go('post'),2200);}} onSkip={onSkip} onBack={()=>go(steps[index-1])}/>}
    {current==='race'&&<NextButton label="Post-race ›" onClick={nextStep}/>}
    {current==='post'&&<PostRace universe={universe} before={preUniverse} record={record} ui={ui} actions={actions}/>}
  </section>;
}
