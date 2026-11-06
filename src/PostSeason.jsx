import React, { useEffect, useState } from 'react';
import { getDriver, getTeam, getStaff, currentDriverRating } from './data.js';
import { driverStandings, constructorStandings, powerRankings } from './sim.js';

// Guided post-season review. See docs/POST_SEASON.md for which universe each step reads.
export const POSTSEASON_STEPS=['summary','people','market','preseason'];
const STEP_LABELS={summary:'Season summary',people:'Retirements & rookies',market:'Market',preseason:'Pre-season'};
const SUPPORT=['F2','F3','F4','FE','WEC'];
const RARITY_RANK={Generational:6,Legend:5,Epic:4,Rare:3,Uncommon:2,Common:1};
const ELITE=new Set(['Generational','Legend']);
const yearLabel=(year)=>{const value=Number(year)||1;return `Year ${value>=2000?Math.max(1,value-2025):value}`;};
const avg=(values)=>values.length?values.reduce((s,v)=>s+v,0)/values.length:0;
const money=(value)=>`${Number(value||0)<0?'-':''}$${Math.abs(Math.round(value||0))}m`;
const seatLabel=(to)=>!to?null:to.role==='Test driver'||to.seat===3?'Test':to.seat?`D${to.seat}`:null;

// Top N plus every elite entry: all Generational/Legend, then fill to `fill` with the highest rated.
export function eliteAndTop(items,rarityOf,ratingOf,fill=10){
  const elite=items.filter((item)=>ELITE.has(rarityOf(item)));
  const rest=items.filter((item)=>!ELITE.has(rarityOf(item))).sort((a,b)=>ratingOf(b)-ratingOf(a)).slice(0,Math.max(0,fill-elite.length));
  return[...elite,...rest].sort((a,b)=>(RARITY_RANK[rarityOf(b)]||0)-(RARITY_RANK[rarityOf(a)]||0)||ratingOf(b)-ratingOf(a));
}

// One entry per driver: where they started the window and where they ended up. Renewals are dropped.
export function driverMoves(universe){
  const byDriver=new Map();
  // marketHistory is newest first, so walk it oldest first.
  [...(universe.marketHistory||[])].filter((move)=>move.year===universe.year).reverse().forEach((move)=>{
    const current=byDriver.get(move.driverId);
    byDriver.set(move.driverId,current?{...current,to:move.to,reason:move.reason}:{...move});
  });
  return[...byDriver.values()].filter((move)=>(move.from?.teamId||null)!==(move.to?.teamId||null)||move.from?.series!==move.to?.series||move.from?.role!==move.to?.role);
}

function Crumbs({step,reached,go,onSkip}){
  const index=POSTSEASON_STEPS.indexOf(step);
  // Keep the active step visible when the breadcrumb scrolls sideways on a phone.
  useEffect(()=>{document.querySelector('.ps-page .gpw-crumbs .active')?.scrollIntoView?.({block:'nearest',inline:'nearest'});},[step]);
  return <nav className="gpw-crumbs" aria-label="Post-season review">
    <span className="gpw-count">{index+1}/{POSTSEASON_STEPS.length}</span>
    <ol>{POSTSEASON_STEPS.map((id,i)=><li key={id}><button className={`${id===step?'active':''} ${i<=reached?'reached':''}`} disabled={i>reached} aria-current={id===step?'step':undefined} onClick={()=>go(id)}>{STEP_LABELS[id]}</button>{i<POSTSEASON_STEPS.length-1&&<i aria-hidden="true">›</i>}</li>)}</ol>
    <button className="outline small gpw-skip" onClick={onSkip}>Skip review</button>
  </nav>;
}
const Next=({label,onClick})=><div className="gpw-next"><button className="primary" onClick={onClick}>{label}</button></div>;

function Leader({label,driver,value,Flag,open}){
  return <button className="ps-leader" onClick={()=>driver&&open(driver.id)} disabled={!driver}><small>{label}</small><span><Flag driver={driver}/><b>{driver?.name||'—'}</b></span><em>{value}</em></button>;
}

function Summary({before,pending,ui,open,next}){
  const {Flag,Panel,SeriesTag}=ui;
  const year=before.year;
  const table=driverStandings(before,'F1');const teams=constructorStandings(before);
  const champ=table[0];const runner=table[1];const team=teams[0];
  const titles=getDriver(pending,champ?.id)?.career?.titles??champ?.career?.titles;
  const records=(before.competitionEventResults?.F1||[]);
  const pointsFinishes=new Map();records.forEach((record)=>(record.sessions?.R?.rows||[]).forEach((row)=>{if(row.points>0)pointsFinishes.set(row.driverId,(pointsFinishes.get(row.driverId)||0)+1);}));
  const fastest=new Map();(before.records?.fastestLaps||[]).filter((item)=>item.year===year&&item.series==='F1').forEach((item)=>fastest.set(item.driverId,(fastest.get(item.driverId)||0)+1));
  const best=(score)=>{const top=[...table].sort((a,b)=>score(b)-score(a))[0];return top&&score(top)>0?top:null;};
  const leaders=[
    ['Most wins',(d)=>d.season.wins],['Most poles',(d)=>d.season.poles||0],['Most podiums',(d)=>d.season.podiums],
    ['Most points finishes',(d)=>pointsFinishes.get(d.id)||0],['Most fastest laps',(d)=>fastest.get(d.id)||0],['Most DNFs',(d)=>d.season.dnfs||0],
    ['Best qualifier',(d)=>(d.season.qualifyingPoints||0)],['Biggest climber',(d)=>d.season.positionsGained||0],
  ].map(([label,score])=>{const driver=best(score);return{label,driver,value:driver?(label==='Best qualifier'?`${driver.season.poles||0} poles · ${driver.season.qualifyingPoints||0} qp`:label==='Biggest climber'?`+${score(driver)} places`:score(driver)):'—'};});
  const awards=(pending.awards||[]).filter((award)=>award.year===year&&!SUPPORT.some((series)=>award.type===`${series} Champion`));
  return <>
    <div className="gpw-hero winner" style={{'--team':team?.primary||'#777'}}>
      <small>{yearLabel(year).toUpperCase()} · FORMULA 1 WORLD CHAMPION</small>
      <h1><Flag driver={champ}/> {champ?.name||'—'}</h1>
      <p>{getTeam(before,champ?.teamId)?.name} · {champ?.season.points} points{runner?` · by ${champ.season.points-runner.season.points} over ${runner.name}`:''}{titles?` · ${titles} ${titles===1?'title':'titles'}`:''}</p>
      <div className="gpw-tags"><span className="gpw-tag hot">Constructors: {team?.name} · {team?.seasonPoints} pts</span></div>
    </div>
    <Panel title="F1 season leaders" eyebrow={yearLabel(year).toUpperCase()}><div className="ps-leaders">{leaders.map((item)=><Leader key={item.label} {...item} Flag={Flag} open={open}/>)}</div></Panel>
    <div className="gpw-grid two">
      <Panel title="Awards" eyebrow="FORMULA 1">{awards.length?<div className="gpw-list">{awards.map((award)=><div key={award.type}><strong className="ps-award">{award.type}</strong><span><b>{award.winnerName}</b><small>{award.reason}</small></span></div>)}</div>:<p>No awards recorded.</p>}</Panel>
      <Panel title="Champions" eyebrow="EVERY SERIES"><div className="ps-champs">{SUPPORT.map((series)=>{const driver=driverStandings(before,series)[0];const teamTable=(before.feederTeams?.[series]||[]).slice().sort((a,b)=>(b.points||0)-(a.points||0)||(b.wins||0)-(a.wins||0));const t=teamTable[0];return <div key={series}><SeriesTag series={series}/><button onClick={()=>driver&&open(driver.id)}><Flag driver={driver}/><b>{driver?.name||'—'}</b></button><small>{t?.name||'—'}</small></div>;})}</div></Panel>
    </div>
    <Next label="Retirements & rookies ›" onClick={next}/>
  </>;
}

function People({before,pending,ui,open,next}){
  const {Flag,Panel,RarityTag,SeriesTag}=ui;
  const completed=before.year;const report=pending.preseasonReports?.[0]||{};
  const inductees=(pending.hallOfFame?.inductees||[]).filter((item)=>item.year===completed);
  const hof=new Set(inductees.map((item)=>item.driverId));
  const retired=[...(report.retired||[])].map((item)=>({...item,driver:getDriver(pending,item.driverId),was:getDriver(before,item.driverId)}))
    .sort((a,b)=>(hof.has(b.driverId)-hof.has(a.driverId))||((b.driver?.career?.titles||0)-(a.driver?.career?.titles||0))||((b.driver?.career?.f1Wins||0)-(a.driver?.career?.f1Wins||0))||((RARITY_RANK[b.rarity]||0)-(RARITY_RANK[a.rarity]||0)));
  const spawned=[...(report.spawned||[])].map((item)=>({...item,driver:getDriver(pending,item.driverId)})).map((item)=>({...item,rating:item.driver?currentDriverRating(item.driver):0}))
    .sort((a,b)=>(RARITY_RANK[b.rarity]||0)-(RARITY_RANK[a.rarity]||0)||b.rating-a.rating);
  const breakdown=Object.keys(RARITY_RANK).map((rarity)=>[rarity,spawned.filter((item)=>item.rarity===rarity).length]).filter(([,count])=>count);
  const career=(driver)=>{const c=driver?.career||{};return `${c.titles||0} titles · ${c.f1Wins||0} wins · ${c.f1Podiums||0} podiums`;};
  return <>
    {inductees.length>0&&<div className="ps-hof"><small>HALL OF FAME · CLASS OF {yearLabel(completed).toUpperCase()}</small>{inductees.map((item)=>{const driver=getDriver(pending,item.driverId);return <button key={item.driverId} onClick={()=>open(item.driverId)}><Flag driver={driver}/><b>{item.name}</b><span>{item.titles} titles · {item.wins} wins · {item.podiums} podiums</span></button>;})}</div>}
    <Panel title="Retirements" eyebrow={`${retired.length} DRIVERS RETIRED`}>
      {retired.length?<div className="gpw-list ps-rows">{retired.slice(0,5).map((item)=><div key={item.driverId} onClick={()=>open(item.driverId)} role="button"><Flag driver={item.driver}/><span><b>{item.name} {hof.has(item.driverId)&&<i className="ps-badge">HoF</i>}</b><small>{item.age} · {item.lastSeries}{item.was?.teamId?` · ${getTeam(before,item.was.teamId)?.name||''}`:''} · {career(item.driver)}</small></span><RarityTag rarity={item.rarity}/></div>)}</div>:<p>No retirements.</p>}
      {retired.length>5&&<p className="ps-more">+{retired.length-5} more retired</p>}
    </Panel>
    <Panel title="New prospects" eyebrow={`${spawned.length} PROSPECTS · AVG RATING ${Math.round(avg(spawned.map((item)=>item.rating)))||'—'}`}>
      {breakdown.length>0&&<p className="ps-breakdown">{breakdown.map(([rarity,count])=>`${count} ${rarity}`).join(' · ')}</p>}
      {spawned.length?<div className="gpw-list ps-rows">{spawned.slice(0,5).map((item)=><div key={item.driverId} onClick={()=>open(item.driverId)} role="button"><Flag driver={item.driver}/><span><b>{item.name}</b><small>{item.age} · {getTeam(pending,item.teamId)?.name||'Unsigned'}</small></span><SeriesTag series={item.series}/><RarityTag rarity={item.rarity}/><em>{item.rating}</em></div>)}</div>:<p>No new prospects.</p>}
    </Panel>
    <Next label="Market ›" onClick={next}/>
  </>;
}

function Market({pending,ui,open,next}){
  const {Flag,Panel,RarityTag}=ui;
  const [showBrands,setShowBrands]=useState(false);
  const moves=driverMoves(pending).map((move)=>({...move,driver:getDriver(pending,move.driverId)}));
  const topDrivers=eliteAndTop(moves,(m)=>m.driver?.rarity,(m)=>m.driver?currentDriverRating(m.driver):0);
  const staffMoves=(pending.staffMarketHistory||[]).filter((item)=>item.year===pending.year&&item.fromTeamId!==item.toTeamId).map((item)=>({...item,rating:getStaff(pending,item.staffId)?.rating||0}));
  const topStaff=eliteAndTop(staffMoves,(m)=>m.rarity,(m)=>m.rating);
  const report=pending.preseasonReports?.[0]||{};const sponsors=(report.sponsorChanges||[]).filter((item)=>item.type!=='Renewed');
  const side=(end)=>end?`${end.teamName||'Free agents'}${end.series&&end.series!=='FREE'?` (${end.series})`:''}`:'—';
  return <>
    <p className="ps-count">{moves.length} driver moves · {staffMoves.length} staff moves</p>
    <Panel title="Driver transfers" eyebrow={`${yearLabel(pending.year).toUpperCase()} GRID`}>
      {topDrivers.length?<div className="gpw-list ps-rows">{topDrivers.map((move)=><div key={move.driverId} onClick={()=>open(move.driverId)} role="button"><Flag driver={move.driver}/><span><b>{move.driverName}</b><small>{side(move.from)} → {side(move.to)}{seatLabel(move.to)?` · ${seatLabel(move.to)}`:''}</small><small className="ps-reason">{move.reason}</small></span><RarityTag rarity={move.driver?.rarity}/><em>{move.driver?currentDriverRating(move.driver):'—'}</em></div>)}</div>:<p>No driver moves.</p>}
    </Panel>
    <Panel title="Staff moves" eyebrow="PADDOCK">
      {topStaff.length?<div className="gpw-list ps-rows staff">{topStaff.map((move)=><div key={move.id||move.staffId}><span><b>{move.name}</b><small>{move.role} · {move.fromTeamName} → {move.toTeamName}{move.series?` (${move.series})`:''}</small><small className="ps-reason">{money(move.oldSalary)} → {money(move.newSalary)}</small></span><RarityTag rarity={move.rarity}/><em>{move.rating||'—'}</em></div>)}</div>:<p>No staff moves.</p>}
    </Panel>
    {((report.brandingChanges||[]).length>0||sponsors.length>0)&&<Panel title="Branding & sponsors" eyebrow={`${(report.brandingChanges||[]).length} REBRANDS · ${sponsors.length} SPONSOR CHANGES`} action={<button className="link" onClick={()=>setShowBrands((v)=>!v)}>{showBrands?'Hide':'Show'}</button>}>
      {showBrands&&<div className="gpw-list">{(report.brandingChanges||[]).map((item)=><div key={`b-${item.teamId}`}><strong>{item.series}</strong><span><b>{item.fromName} → {item.toName}</b></span></div>)}{sponsors.slice(0,20).map((item,i)=><div key={`s-${i}`}><strong>{item.series||''}</strong><span><b>{item.teamName||''}</b><small>{item.oldSponsorName} → {item.newSponsorName}</small></span></div>)}</div>}
    </Panel>}
    <Next label="Pre-season ›" onClick={next}/>
  </>;
}

function PreSeason({pending,ui,open,onStart,onNextGP,busy}){
  const {Flag,Panel,SeriesTag,TeamStripe}=ui;
  const drivers=powerRankings(pending,'drivers').slice(0,3);const teams=powerRankings(pending,'teams').slice(0,3);
  const teamRating=(team)=>team.baseline||team.rating||avg(Object.values(team.carProfile||{}));
  const first=pending.calendar?.[0];
  return <>
    <div className="gpw-hero"><small>{yearLabel(pending.year).toUpperCase()} · PRE-SEASON FORM</small><h1>The new grid</h1><p>Ranked on current ability and car strength, not last year's points.</p></div>
    <div className="gpw-grid two">
      <Panel title="F1 drivers" eyebrow="PRE-SEASON FORM"><div className="gpw-list">{drivers.map((driver,i)=><div key={driver.id} onClick={()=>open(driver.id)} role="button"><strong>P{i+1}</strong><span><b><Flag driver={driver}/> {driver.name}</b><small>{getTeam(pending,driver.teamId)?.name} · rating {currentDriverRating(driver)}</small></span></div>)}</div></Panel>
      <Panel title="F1 teams" eyebrow="PRE-SEASON FORM"><div className="gpw-list">{teams.map((team,i)=><div key={team.id}><strong>P{i+1}</strong><span><b><TeamStripe team={team}/> {team.name}</b><small>car {Math.round(avg(Object.values(team.car||{})))}</small></span></div>)}</div></Panel>
    </div>
    <Panel title="Other series" eyebrow="FAVOURITES"><div className="ps-champs">{SUPPORT.map((series)=>{
      const driver=pending.drivers.filter((d)=>d.active&&d.series===series&&d.role==='Race driver').sort((a,b)=>currentDriverRating(b)-currentDriverRating(a))[0];
      const team=[...(pending.feederTeams?.[series]||[])].sort((a,b)=>teamRating(b)-teamRating(a))[0];
      return <div key={series}><SeriesTag series={series}/><button onClick={()=>driver&&open(driver.id)}><Flag driver={driver}/><b>{driver?`${driver.name} · ${currentDriverRating(driver)}`:'—'}</b></button><small>{team?.name||'—'}</small></div>;})}</div></Panel>
    {first&&<div className="watch-cta"><div><small>ROUND 1 · {yearLabel(pending.year).toUpperCase()}</small><b>{first.name}</b><span>{first.country} · {first.city}</span></div></div>}
    <div className="gpw-next actions"><button className="outline" onClick={onStart} disabled={busy}>Start {yearLabel(pending.year)}</button>{first&&<button className="primary" onClick={onNextGP} disabled={busy}>Next GP ›</button>}</div>
  </>;
}

/**
 * review: {year, before, pending, reached}
 * before: the completed-season universe. pending: advanceToNextSeason(before), committed only by Start / Next GP / Skip.
 */
export function PostSeason({review,step,go,onSkip,onStart,onNextGP,onOpen,canOpen,openDriver,busy,ui}){
  const current=POSTSEASON_STEPS.includes(step)?step:'summary';
  const index=POSTSEASON_STEPS.indexOf(current);
  useEffect(()=>{window.scrollTo?.({top:0});},[current]);
  if(!review)return <section className="page"><div className="empty"><b>F1</b><h3>No season review open</h3><p>{canOpen?'The season is complete.':'The review opens when every championship has finished.'}</p>{canOpen&&<button className="primary" onClick={onOpen} disabled={busy}>Season review</button>}</div></section>;
  const reached=Math.max(review.reached||0,index);
  const next=()=>go(POSTSEASON_STEPS[Math.min(POSTSEASON_STEPS.length-1,index+1)]);
  const props={before:review.before,pending:review.pending,ui,open:openDriver,next};
  return <section className="page gpw-page ps-page">
    <Crumbs step={current} reached={reached} go={go} onSkip={onSkip}/>
    {current==='summary'&&<Summary {...props}/>}
    {current==='people'&&<People {...props}/>}
    {current==='market'&&<Market {...props}/>}
    {current==='preseason'&&<PreSeason {...props} onStart={onStart} onNextGP={onNextGP} busy={busy}/>}
  </section>;
}
