import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { createUniverse, RARITY, SERIES_META, getDriver, getTeam, getStaff, getEngine, getSponsor, SCHEMA_VERSION } from './data.js';
import {
  SESSION_TEMPLATES, simulateNextSession, simulateWeekend, simulateToSeasonEnd, advanceToNextSeason,
  driverStandings, constructorStandings, seriesStandings, powerRankings, goatLeaderboard,
  circuitFitRanking, performanceOverExpected, sponsorFit,
} from './sim.js';
import { saveSlot, loadSlot, deleteSlot, listSlots, exportUniverse, importUniverse } from './storage.js';

const GLYPHS={home:'⌂',schedule:'▦',weekend:'◉',results:'⚑',standings:'♛',drivers:'●',teams:'◆',paddock:'▤',world:'◎',almanac:'≋',more:'☰',weather:'☂',play:'▶',save:'▣',settings:'⚙',search:'⌕',money:'$',engine:'ϟ',staff:'♟',calendar:'▦',close:'×'};
const NAV=[['home','Home'],['schedule','Schedule'],['weekend','Weekend'],['results','Results'],['standings','Standings'],['drivers','Drivers'],['teams','Teams'],['paddock','Paddock'],['world','World'],['almanac','Almanac'],['more','More']];
const fmt=(value,digits=0)=>Number(value||0).toLocaleString(undefined,{maximumFractionDigits:digits});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function Icon({name,size=16}){return <span className="icon" style={{fontSize:size}} aria-hidden="true">{GLYPHS[name]||name}</span>}
function CountryTag({code,name}){return <span className="country-tag" title={name}>{code||name?.slice(0,3).toUpperCase()}</span>}
function RarityTag({rarity}){return <span className={`rarity rarity-${rarity.toLowerCase()}`} style={{'--rarity':RARITY[rarity]?.color}}>{rarity}</span>}
function Progress({value,max=100,label}){return <div className="progress-wrap"><div className="progress-label"><span>{label}</span><b>{Math.round(value)}</b></div><div className="progress"><i style={{width:`${clamp(value/max*100,0,100)}%`}}/></div></div>}
function Pill({children,active,onClick}){return <button className={`pill ${active?'active':''}`} onClick={onClick}>{children}</button>}
function Empty({title,body}){return <div className="empty"><div className="empty-mark">F1</div><h2>{title}</h2><p>{body}</p></div>}
function Panel({title,eyebrow,children,className='',action}){return <section className={`panel ${className}`}><div className="panel-head"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2></div>{action}</div>{children}</section>}
function TeamBar({team}){return <span className="team-bar" style={{background:`linear-gradient(180deg,${team.primary},${team.secondary})`}}/>}
function Livery({team,universe,compact=false}){
  const sponsors=team.sponsorIds?.map((id)=>getSponsor(universe,id)).filter(Boolean)||[];
  return <div className={`livery ${compact?'compact':''}`} style={{'--primary':team.primary,'--secondary':team.secondary}}>
    <div className="livery-nose"/><div className="livery-cockpit"/><div className="livery-wing front"/><div className="livery-wing rear"/>
    <strong>{team.short}</strong>{!compact&&<div className="livery-sponsors">{sponsors.slice(0,2).map((s)=><span key={s.id}>{s.name}</span>)}</div>}
  </div>
}

function App(){
  const [universe,setUniverse]=useState(()=>createUniverse());
  const [page,setPage]=useState('home');
  const [selectedDriver,setSelectedDriver]=useState(null);
  const [selectedTeam,setSelectedTeam]=useState(null);
  const [selectedCircuit,setSelectedCircuit]=useState(null);
  const [toast,setToast]=useState('');
  const [busy,setBusy]=useState(false);
  const [slots,setSlots]=useState([]);
  const autosaveReady=useRef(false);

  const currentEvent=universe.calendar[Math.min(universe.currentRound,universe.calendar.length-1)];
  const currentTemplate=currentEvent?.sprint?SESSION_TEMPLATES.sprint:SESSION_TEMPLATES.standard;
  const currentSession=currentEvent?.sessions?.[universe.currentSession]||currentTemplate?.[universe.currentSession]||null;
  const titleLeader=driverStandings(universe,'F1')[0];
  const constructorLeader=constructorStandings(universe)[0];

  const showToast=(message)=>{setToast(message);window.setTimeout(()=>setToast(''),2600);};
  const perform=(fn,message)=>{
    setBusy(true);
    window.setTimeout(()=>{
      try{setUniverse((previous)=>fn(previous));if(message)showToast(message);}finally{setBusy(false);}
    },40);
  };
  const nextSession=()=>perform(simulateNextSession,'Session simulated');
  const fullWeekend=()=>perform(simulateWeekend,'Weekend completed');
  const fullSeason=()=>{if(window.confirm('Simulate every remaining session in the season?'))perform(simulateToSeasonEnd,'Season completed');};
  const nextSeason=()=>perform(advanceToNextSeason,`Welcome to ${universe.year+1}`);

  useEffect(()=>{listSlots().then(setSlots).catch(()=>{});},[]);
  useEffect(()=>{
    if(!universe.settings.autoSave)return;
    if(!autosaveReady.current){autosaveReady.current=true;return;}
    const timer=window.setTimeout(()=>saveSlot(1,universe,'Autosave').then(()=>listSlots().then(setSlots)).catch(()=>{}),700);
    return()=>window.clearTimeout(timer);
  },[universe]);

  const save=async(slot)=>{try{await saveSlot(slot,universe,slot===1?'Autosave':`Universe ${slot}`);setSlots(await listSlots());showToast(`Saved to slot ${slot}`);}catch(error){showToast(error.message);}};
  const load=async(slot)=>{try{const loaded=await loadSlot(slot);if(loaded){setUniverse(loaded);setPage('home');showToast(`Loaded slot ${slot}`);}}catch(error){showToast(error.message);}};
  const remove=async(slot)=>{if(!window.confirm(`Delete save slot ${slot}?`))return;await deleteSlot(slot);setSlots(await listSlots());showToast('Save deleted');};
  const importRef=useRef(null);
  const doImport=async(event)=>{const file=event.target.files?.[0];if(!file)return;try{const imported=await importUniverse(file);setUniverse(imported);showToast('Save imported');}catch(error){showToast(error.message);}event.target.value='';};

  const renderPage=()=>{
    const props={universe,setUniverse,setPage,setSelectedDriver,setSelectedTeam,setSelectedCircuit,nextSession,fullWeekend,fullSeason,nextSeason,busy};
    switch(page){
      case'home':return <Home {...props}/>;
      case'schedule':return <Schedule {...props}/>;
      case'weekend':return <Weekend {...props}/>;
      case'results':return <Results {...props}/>;
      case'standings':return <Standings {...props}/>;
      case'drivers':return <Drivers {...props}/>;
      case'teams':return <Teams {...props}/>;
      case'paddock':return <Paddock {...props}/>;
      case'world':return <World {...props}/>;
      case'almanac':return <Almanac {...props}/>;
      default:return <More {...props} slots={slots} save={save} load={load} remove={remove} exportSave={()=>exportUniverse(universe)} importRef={importRef}/>;
    }
  };

  return <div className="app">
    <header className="topbar">
      <button className="brand" onClick={()=>setPage('home')}><span className="f1mark">F1</span><span>WORLD CHRONICLE</span></button>
      <nav>{NAV.map(([id,label])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><Icon name={id}/><span>{label}</span></button>)}</nav>
      <div className="season-chip">{universe.year}</div>
    </header>
    <div className="event-ticker">
      <div><span className="round-kicker">{universe.phase==='Season complete'?'SEASON COMPLETE':`R${Math.min(universe.currentRound+1,universe.calendar.length)}`}</span><b>{currentEvent?.country}</b><small>{currentSession?.label||universe.phase}</small></div>
      <div className="ticker-leaders"><span><small>DRIVERS</small>{titleLeader?.name} · {titleLeader?.season.points||0}</span><span><small>TEAMS</small>{constructorLeader?.name} · {constructorLeader?.seasonPoints||0}</span></div>
      <div className="ticker-actions">
        {universe.phase==='Season complete'?<button className="primary small" onClick={nextSeason} disabled={busy}><Icon name="calendar"/>Begin {universe.year+1}</button>:<>
          <button className="ghost" onClick={nextSession} disabled={busy}><Icon name="play"/>Next session</button>
          <button className="primary small" onClick={fullWeekend} disabled={busy}>Sim weekend</button>
        </>}
      </div>
    </div>
    <main>{renderPage()}</main>
    <div className="mobile-action">{universe.phase==='Season complete'?<button onClick={nextSeason}>Begin {universe.year+1}</button>:<button onClick={nextSession} disabled={busy}><Icon name="play"/> Sim {currentSession?.label||'next session'}</button>}</div>
    {selectedDriver&&<DriverModal universe={universe} driver={getDriver(universe,selectedDriver)} close={()=>setSelectedDriver(null)} setSelectedTeam={setSelectedTeam}/>} 
    {selectedTeam&&<TeamModal universe={universe} team={getTeam(universe,selectedTeam)} close={()=>setSelectedTeam(null)} setSelectedDriver={setSelectedDriver}/>} 
    {selectedCircuit&&<CircuitModal universe={universe} circuit={universe.circuitPool.find((c)=>c.id===selectedCircuit)} close={()=>setSelectedCircuit(null)}/>} 
    {toast&&<div className="toast">{toast}</div>}
    <input ref={importRef} type="file" accept="application/json" hidden onChange={doImport}/>
  </div>;
}

function Home({universe,setPage,setSelectedDriver,setSelectedTeam,nextSession,fullWeekend,busy}){
  const event=universe.calendar[Math.min(universe.currentRound,universe.calendar.length-1)];
  const sessions=event.sessions.length?event.sessions:(event.sprint?SESSION_TEMPLATES.sprint:SESSION_TEMPLATES.standard).map((s)=>({...s,status:'Pending',weather:{forecastChance:event.rain,state:'Forecast'}}));
  const leader=driverStandings(universe,'F1')[0];const teams=constructorStandings(universe);const leadStory=universe.stories[0];
  const prospect=driverStandings(universe,'F2')[0];const prospectTeam=getTeam(universe,prospect?.teamId);
  const rankings=powerRankings(universe,'drivers').slice(0,5);
  return <>
    <section className="home-hero">
      <div className="hero-copy"><div className="eyebrow">{universe.phase.toUpperCase()} · {universe.year}</div><h1>{event.country}<br/><em>Grand Prix</em></h1><p>{event.name} · {event.city}. {event.class}. The weekend forecast carries a {event.rain}% baseline rain risk, with each session modeled separately.</p><div className="hero-actions"><button className="primary" onClick={nextSession} disabled={busy}><Icon name="play"/>Sim next session</button><button className="outline" onClick={()=>setPage('weekend')}>Open weekend hub</button></div></div>
      <div className="hero-event-card"><div className="circuit-line"><i/><i/><i/></div><div className="weather-big"><Icon name="weather" size={34}/><b>{event.rain}%</b><span>RAIN BASELINE</span></div><div className="event-traits"><span><b>{event.traits.high}</b>High speed</span><span><b>{event.traits.overtake}</b>Overtaking</span><span><b>{event.traits.tyre}</b>Tyre stress</span></div></div>
    </section>
    <div className="dashboard-grid">
      <Panel title="This weekend" eyebrow={`ROUND ${event.round}`} className="span-2">
        <div className="session-strip">{sessions.map((session,index)=><div key={session.key} className={`session-mini ${session.status==='Complete'?'done':''} ${index===universe.currentSession?'current':''}`}><span>{session.label}</span><b>{session.status==='Complete'?'Complete':session.weather?.state||`${session.weather?.forecastChance}% rain`}</b><small>{session.weather?.forecastChance??event.rain}% rain</small></div>)}</div>
      </Panel>
      <Panel title="Championship" eyebrow="TITLE SNAPSHOT">
        {leader?<button className="leader-card" onClick={()=>setSelectedDriver(leader.id)}><CountryTag code={leader.countryCode}/><div><b>{leader.name}</b><span>{getTeam(universe,leader.teamId)?.name}</span></div><strong>{leader.season.points}</strong></button>:<p>Season yet to begin.</p>}
        <div className="mini-table">{driverStandings(universe,'F1').slice(1,5).map((driver,index)=><button key={driver.id} onClick={()=>setSelectedDriver(driver.id)}><span>{index+2}</span><b>{driver.name}</b><em>{driver.season.points}</em></button>)}</div>
      </Panel>
      <Panel title={leadStory?.headline||'Paddock'} eyebrow={leadStory?.category||'MAGAZINE'} className="story-panel span-2" action={<button className="text-button" onClick={()=>setPage('paddock')}>All stories ›</button>}><p>{leadStory?.dek}</p><div className="thread-label">SYSTEM THREAD · {leadStory?.thread||'current season'}</div></Panel>
      <Panel title="Team order" eyebrow="POWER RANKING">
        <div className="power-list">{teams.slice(0,5).map((team,index)=><button key={team.id} onClick={()=>setSelectedTeam(team.id)}><span>{index+1}</span><TeamBar team={team}/><b>{team.name}</b><em>{team.seasonPoints}</em></button>)}</div>
      </Panel>
      <Panel title="Prospect watch" eyebrow="FORMULA 2"><button className="prospect-card" onClick={()=>setSelectedDriver(prospect.id)}><RarityTag rarity={prospect.rarity}/><h3>{prospect.name}</h3><p>{prospect.age} · {prospect.country} · {prospectTeam?.name}</p><div><span><b>{prospect.baseTalent}</b>Base talent</span><span><b>{prospect.season.points}</b>F2 points</span><span><b>{prospect.age<20?'FAST TRACK':'LADDER'}</b>Path</span></div></button></Panel>
      <Panel title="Driver form" eyebrow="MODEL, NOT STANDINGS"><div className="power-list">{rankings.map((driver,index)=><button key={driver.id} onClick={()=>setSelectedDriver(driver.id)}><span>{index+1}</span><CountryTag code={driver.countryCode}/><b>{driver.name}</b><em>{driver.powerScore.toFixed(1)}</em></button>)}</div></Panel>
    </div>
  </>;
}

function Schedule({universe,setSelectedCircuit,setPage}){
  const [filter,setFilter]=useState('All');
  const events=universe.calendar.filter((event)=>filter==='All'||event.class===filter);
  return <section className="page-section"><PageTitle eyebrow={`${universe.year} SEASON`} title="Race calendar" subtitle="A modern global calendar with protected classics, commercial anchors and a conservative rotation pool."/>
    <div className="filter-row">{['All','Protected classic','Heritage regular','Commercial anchor','Street project'].map((item)=><Pill key={item} active={filter===item} onClick={()=>setFilter(item)}>{item}</Pill>)}</div>
    <div className="calendar-grid">{events.map((event)=><button key={event.id} className={`race-card ${event.status.toLowerCase()} ${event.round===universe.currentRound+1?'next':''}`} onClick={()=>setSelectedCircuit(event.id)}>
      <div className="race-top"><span>ROUND {event.round}</span><CountryTag code={event.country.slice(0,3).toUpperCase()}/></div><h3>{event.country}</h3><p>{event.city} · {event.name}</p>
      <div className="race-card-track"><i style={{transform:`rotate(${event.round*13}deg)`}}/></div><div className="race-footer"><span><Icon name="weather"/>{event.rain}%</span><span>{event.sprint?'SPRINT':'STANDARD'}</span><span>{event.status}</span></div>
    </button>)}</div>
    <button className="outline wide" onClick={()=>setPage('more')}>Open calendar commissioner settings</button>
  </section>;
}

function PageTitle({eyebrow,title,subtitle,action}){return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>}

function Weekend({universe,nextSession,fullWeekend,busy,setSelectedDriver,setSelectedTeam,setSelectedCircuit}){
  const event=universe.calendar[Math.min(universe.currentRound,universe.calendar.length-1)];
  const sessions=event.sessions.length?event.sessions:(event.sprint?SESSION_TEMPLATES.sprint:SESSION_TEMPLATES.standard).map((s,index)=>({...s,index,status:'Pending',weather:{state:'Forecast',forecastChance:clamp(event.rain+(index-2)*3,2,85),temperature:event.temp}}));
  const fit=circuitFitRanking(universe,event).slice(0,6);
  const completed=universe.sessionResults.filter((r)=>r.year===universe.year&&r.round===event.round);
  const latest=completed.at(-1);
  return <section className="page-section">
    <PageTitle eyebrow={`ROUND ${event.round} · ${event.class.toUpperCase()}`} title={`${event.country} Grand Prix`} subtitle={`${event.name}, ${event.city}. The forecast is session-specific; rain in qualifying can create a grid order that does not survive a dry Grand Prix.`} action={<button className="outline" onClick={()=>setSelectedCircuit(event.id)}>Circuit profile</button>}/>
    <div className="weekend-banner"><div><b>{event.city}</b><span>{event.sprint?'SPRINT WEEKEND':'STANDARD WEEKEND'}</span></div><div className="weather-big"><Icon name="weather" size={30}/><b>{event.rain}%</b><span>BASE RAIN RISK</span></div><div className="weekend-actions"><button className="ghost" onClick={fullWeekend} disabled={busy}>Sim full weekend</button><button className="primary" onClick={nextSession} disabled={busy}><Icon name="play"/>Sim next session</button></div></div>
    <div className="session-cards">{sessions.map((session,index)=><div key={session.key} className={`session-card ${session.status==='Complete'?'done':''} ${index===universe.currentSession?'current':''}`}><div><span>{session.key}</span><b>{session.label}</b></div><strong>{session.status}</strong><p><Icon name="weather"/>{session.weather?.summary||session.weather?.state} · {session.weather?.forecastChance}% rain · {session.weather?.temperature||event.temp}°C</p>{session.status==='Complete'&&<small>{universe.sessionResults.find((r)=>r.id===session.resultId)?.data?.headline}</small>}</div>)}</div>
    <div className="two-col">
      <Panel title="Circuit fit" eyebrow="EXPECTED CAR ORDER"><div className="ranking-table">{fit.map((team,index)=><button key={team.id} onClick={()=>setSelectedTeam(team.id)}><span>{index+1}</span><TeamBar team={team}/><b>{team.name}</b><em>{team.fitScore.toFixed(1)}</em></button>)}</div><p className="explain">Circuit fit uses high/low-speed aero, straight-line efficiency, mechanical balance, tyre stress, engine characteristics, team concept and practice setup.</p></Panel>
      <Panel title="Latest session" eyebrow={latest?.sessionLabel?.toUpperCase()||'NO RUNNING YET'}>{latest?<MiniClassification universe={universe} result={latest} setSelectedDriver={setSelectedDriver}/>:<Empty title="The track is quiet" body="Simulate Practice 1 to reveal pace, setup gains and reliability warnings."/>}</Panel>
    </div>
    <Panel title="Weekend technical notes" eyebrow="UPGRADES & SETUP"><div className="upgrade-grid">{universe.teams.slice().sort((a,b)=>(b.weekendSetup||0)-(a.weekendSetup||0)).slice(0,8).map((team)=><button key={team.id} onClick={()=>setSelectedTeam(team.id)}><TeamBar team={team}/><b>{team.name}</b><span>Setup +{(team.weekendSetup||0).toFixed(2)}</span><small>{team.upgrades.at(-1)?.status||'Baseline package'}</small></button>)}</div></Panel>
  </section>;
}

function MiniClassification({universe,result,setSelectedDriver}){
  const rows=result.data.rows?.slice(0,8)||[];
  return <div className="mini-classification">{rows.map((row)=><button key={row.driverId} onClick={()=>setSelectedDriver(row.driverId)}><span>{row.position}</span><TeamBar team={getTeam(universe,row.teamId)}/><b>{getDriver(universe,row.driverId)?.name}</b><em>{row.gap||row.time?.toFixed(3)}</em></button>)}</div>;
}

function Results({universe,setSelectedDriver}){
  const [round,setRound]=useState(()=>Math.max(1,universe.raceResults.at(-1)?.round||universe.currentRound+1));
  const event=universe.calendar[round-1];
  const results=universe.sessionResults.filter((r)=>r.year===universe.year&&r.round===round);
  const [sessionKey,setSessionKey]=useState(()=>results.at(-1)?.sessionKey||'R');
  useEffect(()=>{const available=universe.sessionResults.filter((r)=>r.year===universe.year&&r.round===round);if(available.length&&!available.some((r)=>r.sessionKey===sessionKey))setSessionKey(available.at(-1).sessionKey);},[round,universe.sessionResults]);
  const result=results.find((r)=>r.sessionKey===sessionKey)||results.at(-1);
  return <section className="page-section"><PageTitle eyebrow="SESSION ARCHIVE" title="Results" subtitle="Open every practice, qualifying round, Sprint and Grand Prix result. Recent races retain stints, weather segments and key incidents."/>
    <div className="results-controls"><select value={round} onChange={(e)=>setRound(Number(e.target.value))}>{universe.calendar.map((c)=><option key={c.round} value={c.round}>R{c.round} · {c.country}</option>)}</select><div className="filter-row compact">{results.map((r)=><Pill key={r.id} active={result?.id===r.id} onClick={()=>setSessionKey(r.sessionKey)}>{r.sessionKey}</Pill>)}</div></div>
    {!result?<Empty title="No session results" body="This event has not been simulated yet. Open the Weekend hub to begin."/>:<SessionResult universe={universe} result={result} event={event} setSelectedDriver={setSelectedDriver}/>} 
  </section>;
}

function SessionResult({universe,result,event,setSelectedDriver}){
  const data=result.data;
  if(data.kind==='Qualifying')return <QualifyingResult universe={universe} result={result} setSelectedDriver={setSelectedDriver}/>;
  return <div className="results-layout"><Panel title={data.headline} eyebrow={`${event.country.toUpperCase()} · ${result.sessionLabel.toUpperCase()}`} className="result-main"><div className="weather-ribbon"><span><Icon name="weather"/>{result.weather.state}</span><span>{result.weather.temperature}°C</span><span>{result.weather.wind} km/h wind</span>{data.timeline&&<div className="weather-timeline">{data.timeline.map((state,index)=><i key={index} className={state.toLowerCase()} title={`Segment ${index+1}: ${state}`}/>)}</div>}</div><ClassificationTable universe={universe} rows={data.rows} setSelectedDriver={setSelectedDriver} race={['Race','Sprint'].includes(data.kind)}/></Panel>
    <aside>{data.events?.length>0&&<Panel title="Key moments" eyebrow="WHY IT HAPPENED"><div className="event-log">{data.events.map((event,index)=><div key={`${event.lap}-${index}`}><span>{event.lap?`L${event.lap}`:'•'}</span><b>{event.type}</b><p>{event.text}</p></div>)}</div></Panel>}{data.safetyCar!==undefined&&<Panel title="Race model" eyebrow="STRATEGY LAYER"><div className="fact-grid"><span><b>{data.laps}</b>Laps</span><span><b>{data.safetyCar?'Yes':'No'}</b>Safety Car</span><span><b>{new Set(data.timeline).size}</b>Track states</span><span><b>{data.rows.reduce((s,r)=>s+r.pitStops,0)}</b>Total stops</span></div><p className="explain">Tyres react to changing track states. Strategy staff, driver tyre skill and team operations determine crossover timing and pit losses.</p></Panel>}</aside></div>;
}

function ClassificationTable({universe,rows,setSelectedDriver,race}){
  return <div className="table-scroll"><table className="classification"><thead><tr><th>Pos</th><th>Driver</th><th>Team</th>{race&&<th>Grid</th>}<th>{race?'Time / status':'Time'}</th>{race&&<><th>Tyres</th><th>Stops</th><th>Pts</th></>}</tr></thead><tbody>{rows.map((row)=><tr key={row.driverId} className={row.status&&row.status!=='Running'?'retired':''}><td><b>{row.position}</b></td><td><button className="driver-link" onClick={()=>setSelectedDriver(row.driverId)}><CountryTag code={getDriver(universe,row.driverId)?.countryCode}/><span><b>{getDriver(universe,row.driverId)?.name}</b><small>{row.tags?.slice(0,2).join(' · ')}</small></span></button></td><td><span className="team-cell"><TeamBar team={getTeam(universe,row.teamId)}/>{getTeam(universe,row.teamId)?.short}</span></td>{race&&<td>{row.grid}</td>}<td>{row.gap||row.time?.toFixed(3)}</td>{race&&<><td><div className="stints">{row.stints?.map((stint,index)=><i key={index} className={`tyre ${stint.compound.toLowerCase()}`} title={`${stint.compound}: laps ${stint.from}-${stint.to}`}>{stint.compound[0]}</i>)}</div></td><td>{row.pitStops}</td><td><b>{row.points}</b></td></>}</tr>)}</tbody></table></div>;
}

function QualifyingResult({universe,result,setSelectedDriver}){
  const [round,setRound]=useState('Q3');const rows=result.data.rounds[round]||[];
  return <div className="results-layout"><Panel title={result.data.headline} eyebrow={`${result.sessionLabel.toUpperCase()} · ${result.weather.state.toUpperCase()}`} className="result-main"><div className="filter-row compact">{['Q1','Q2','Q3'].map((q)=><Pill key={q} active={round===q} onClick={()=>setRound(q)}>{q}</Pill>)}</div><ClassificationTable universe={universe} rows={rows} setSelectedDriver={setSelectedDriver}/></Panel><aside><Panel title="Run conditions" eyebrow="SESSION LOGIC"><div className="fact-grid"><span><b>{result.weather.state}</b>Track</span><span><b>{result.weather.forecastChance}%</b>Forecast</span><span><b>{result.weather.accuracy}%</b>Accuracy</span><span><b>{rows.filter((r)=>r.deleted).length}</b>Deleted laps</span></div><p className="explain">Q1, Q2 and Q3 are simulated independently. Traffic, track evolution, run timing, tyre availability, deleted laps and weather can change the order between rounds.</p></Panel><Panel title="Session notes" eyebrow="PADDOCK FEED"><div className="event-log">{result.data.events.map((event,index)=><div key={index}><span>•</span><b>{event.type}</b><p>{event.text}</p></div>)}</div></Panel></aside></div>;
}

function Standings({universe,setSelectedDriver,setSelectedTeam}){
  const [tab,setTab]=useState('Drivers');
  const drivers=driverStandings(universe,'F1');const constructors=constructorStandings(universe);
  const rookie=drivers.filter((d)=>d.rookie||d.age<=22);const form=[...drivers].sort((a,b)=>averageForm(a)-averageForm(b));const qualifying=[...drivers].sort((a,b)=>b.season.qualifyingPoints-a.season.qualifyingPoints);
  const data=tab==='Rookies'?rookie:tab==='Form'?form:tab==='Qualifying'?qualifying:drivers;
  return <section className="page-section"><PageTitle eyebrow={`${universe.year} CHAMPIONSHIP`} title="Standings" subtitle="Official points plus model views for form, qualifying, rookies and teammate performance."/><div className="filter-row">{['Drivers','Constructors','Rookies','Form','Qualifying','Teammates'].map((item)=><Pill key={item} active={tab===item} onClick={()=>setTab(item)}>{item}</Pill>)}</div>
    {tab==='Constructors'?<StandingsTable teams={constructors} setSelectedTeam={setSelectedTeam}/>:tab==='Teammates'?<TeammateTable universe={universe} setSelectedDriver={setSelectedDriver}/>:<DriverStandingsTable universe={universe} drivers={data} tab={tab} setSelectedDriver={setSelectedDriver}/>} 
  </section>;
}
const averageForm=(driver)=>driver.season.form.length?driver.season.form.reduce((a,b)=>a+b,0)/driver.season.form.length:99;
function DriverStandingsTable({universe,drivers,tab,setSelectedDriver}){return <Panel title={tab==='Drivers'?'World Championship':tab} eyebrow="DRIVERS"><div className="standings-list">{drivers.map((driver,index)=><button key={driver.id} onClick={()=>setSelectedDriver(driver.id)}><strong>{index+1}</strong><CountryTag code={driver.countryCode}/><TeamBar team={getTeam(universe,driver.teamId)}/><div><b>{driver.name}</b><small>{getTeam(universe,driver.teamId)?.name}</small></div><span>{tab==='Form'?(driver.season.form.length?`Avg P${averageForm(driver).toFixed(1)}`:'No races'):tab==='Qualifying'?`${driver.season.poles} poles`:tab==='Rookies'?`${driver.age} years`:`${driver.season.wins} wins`}</span><em>{driver.season.points}</em></button>)}</div></Panel>}
function StandingsTable({teams,setSelectedTeam}){return <Panel title="Constructors’ Championship" eyebrow="TEAMS"><div className="standings-list teams">{teams.map((team,index)=><button key={team.id} onClick={()=>setSelectedTeam(team.id)}><strong>{index+1}</strong><TeamBar team={team}/><div><b>{team.name}</b><small>{team.engineId.replace('-pu','').toUpperCase()} · {team.seasonWins} wins</small></div><span>{team.season.podiums} podiums</span><em>{team.seasonPoints}</em></button>)}</div></Panel>}
function TeammateTable({universe,setSelectedDriver}){return <div className="teammate-grid">{universe.teams.map((team)=>{const drivers=universe.drivers.filter((d)=>d.series==='F1'&&d.teamId===team.id&&d.role==='Race driver');return <Panel key={team.id} title={team.name} eyebrow="TEAMMATE BATTLE"><div className="teammate-card">{drivers.map((d)=><button key={d.id} onClick={()=>setSelectedDriver(d.id)}><CountryTag code={d.countryCode}/><b>{d.name}</b><strong>{d.season.points}</strong><small>{d.season.qualifyingPoints} qualifying · {d.season.positionsGained} gained</small></button>)}</div></Panel>})}</div>}

function Drivers({universe,setSelectedDriver}){
  const [series,setSeries]=useState('F1');const[rarity,setRarity]=useState('All');const[status,setStatus]=useState('Race drivers');const[query,setQuery]=useState('');
  const filtered=universe.drivers.filter((driver)=>driver.series===series&&(rarity==='All'||driver.rarity===rarity)&&(status==='All'||(status==='Race drivers'&&driver.role==='Race driver')||(status==='Reserves'&&driver.role==='Reserve driver')||(status==='Retired'&&!driver.active))&&(`${driver.name} ${driver.country}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>b.baseTalent-a.baseTalent);
  return <section className="page-section"><PageTitle eyebrow="PEOPLE" title="Drivers" subtitle="Procedural careers with immutable rarity and base talent, pre-generated career curves, form, confidence, contracts and cross-series paths."/><div className="control-bar"><div className="search"><Icon name="search"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search drivers or countries"/></div><select value={series} onChange={(e)=>setSeries(e.target.value)}>{Object.keys(SERIES_META).map((key)=><option key={key}>{key}</option>)}</select><select value={rarity} onChange={(e)=>setRarity(e.target.value)}><option>All</option>{Object.keys(RARITY).map((r)=><option key={r}>{r}</option>)}</select><select value={status} onChange={(e)=>setStatus(e.target.value)}><option>Race drivers</option><option>Reserves</option><option>Retired</option><option>All</option></select></div>
    <div className="driver-grid">{filtered.map((driver)=><DriverCard key={driver.id} universe={universe} driver={driver} open={()=>setSelectedDriver(driver.id)}/>)}</div>
  </section>;
}
function DriverCard({universe,driver,open}){const team=getTeam(universe,driver.teamId);return <button className="driver-card" onClick={open}><div className="driver-card-top"><RarityTag rarity={driver.rarity}/><span className="driver-number">{driver.number}</span></div><CountryTag code={driver.countryCode} name={driver.country}/><h3>{driver.name}</h3><p>{driver.age} · {driver.style}</p><div className="driver-team"><TeamBar team={team}/><span>{team?.name}</span></div><div className="driver-values"><span><b>{driver.baseTalent}</b>Base</span><span><b>{driver.careerMultiplier.toFixed(3)}</b>Curve</span><span><b>{driver.season.points}</b>Points</span></div><div className="curve-spark">{driver.careerCurve.slice(0,12).map((v,i)=><i key={i} style={{height:`${(v-.75)*260}%`}} className={i===driver.curveIndex?'active':''}/>)}</div></button>}

function Teams({universe,setSelectedTeam}){
  const standings=constructorStandings(universe);
  return <section className="page-section"><PageTitle eyebrow="CONSTRUCTORS" title="Teams" subtitle="Heritage, ownership, commercial identity, engine, staff, sponsors and sporting operation are separate layers, allowing plausible change without random history loss."/><div className="team-grid">{standings.map((team)=><button key={team.id} className="team-card" onClick={()=>setSelectedTeam(team.id)}><div className="team-card-head"><span>{team.country}</span><strong>{team.short}</strong></div><Livery team={team} universe={universe}/><h3>{team.name}</h3><p>{team.stability} · {getEngine(universe,team.engineId)?.name}</p><div className="team-metrics"><span><b>{team.seasonPoints}</b>Points</span><span><b>{Math.round(team.baseline)}</b>Car</span><span><b>${team.finances.cash}m</b>Cash</span></div><div className="sponsor-row">{team.sponsorIds.slice(0,3).map((id)=><span key={id}>{getSponsor(universe,id)?.name}</span>)}</div></button>)}</div></section>;
}

function Paddock({universe,setSelectedDriver,setSelectedTeam}){
  const [category,setCategory]=useState('All');const categories=['All','Race Week','After the Flag','Prospect Watch','Technical Notebook','Driver Market','Business','Calendar','Power Rankings','History','Season Review','Pre-season'];
  const stories=universe.stories.filter((story)=>category==='All'||story.category===category).sort((a,b)=>b.year-a.year||b.priority-a.priority);
  const openSubject=(story)=>{const id=story.subjects?.[0];if(!id)return;if(getDriver(universe,id))setSelectedDriver(id);else if(getTeam(universe,id))setSelectedTeam(id);};
  return <section className="page-section"><PageTitle eyebrow="F1 UNLOCKED, REIMAGINED" title="Paddock" subtitle="The emotional layer: race analysis, prospects, technology, contracts, business, power rankings and remembered narrative threads."/><div className="filter-row scroll">{categories.map((item)=><Pill key={item} active={category===item} onClick={()=>setCategory(item)}>{item}</Pill>)}</div>
    <div className="paddock-layout"><div className="magazine-grid">{stories.length?stories.map((story,index)=><article key={story.id} className={index===0&&category==='All'?'lead-story':''}><div className="story-meta"><span>{story.category}</span><em>{story.year}{story.round?` · R${story.round}`:''}</em></div><h2>{story.headline}</h2><p>{story.dek}</p><div className="story-bottom">{story.thread&&<span>THREAD · {story.thread.replaceAll('-',' ')}</span>}<button onClick={()=>openSubject(story)}>Open subject ›</button></div></article>):<Empty title="No stories in this section" body="Simulate more sessions or select another magazine desk."/>}</div><aside><Panel title="Live story threads" eyebrow="LONG-TERM MEMORY"><div className="thread-list">{universe.threads.map((thread)=><div key={thread.id}><span className="heat"><i style={{width:`${thread.heat}%`}}/></span><b>{thread.title}</b><small>{thread.status} · Heat {thread.heat}</small></div>)}</div></Panel><Panel title="Editorial rule" eyebrow="WHY THIS MATTERS"><p className="explain">Stories prioritize deviation from expectation, then connect it to long-term context. A P4 by the slowest car can outrank an easy win by the favorite.</p></Panel></aside></div>
  </section>;
}

function World({universe,setSelectedDriver}){
  const [series,setSeries]=useState('F2');const standings=seriesStandings(universe,series);const teams=universe.feederTeams[series];
  const prospects=universe.drivers.filter((d)=>['F2','F3'].includes(d.series)&&d.active).map((d)=>({...d,prospectScore:d.baseTalent*1.2+(23-d.age)*2+d.adaptability*.18+d.season.points*.08})).sort((a,b)=>b.prospectScore-a.prospectScore).slice(0,12);
  return <section className="page-section"><PageTitle eyebrow="MOTORSPORT PYRAMID" title="World" subtitle="F2 and F3 create the F1 pipeline; Formula E and WEC provide elite alternative careers, veteran refuge and cross-series legacy."/><div className="series-tabs">{['F2','F3','FE','WEC'].map((key)=><button key={key} className={series===key?'active':''} style={{'--series':SERIES_META[key].color}} onClick={()=>setSeries(key)}><b>{key}</b><span>{SERIES_META[key].name}</span><small>{SERIES_META[key].detail} detail</small></button>)}</div>
    <div className="two-col world-columns"><Panel title={`${SERIES_META[series].name} standings`} eyebrow={`${universe.year} SEASON`}><div className="standings-list world">{standings.slice(0,16).map((driver,index)=><button key={driver.id} onClick={()=>setSelectedDriver(driver.id)}><strong>{index+1}</strong><CountryTag code={driver.countryCode}/><div><b>{driver.name}</b><small>{teams.find((t)=>t.id===driver.teamId)?.name}</small></div><span>{driver.season.wins} wins</span><em>{driver.season.points}</em></button>)}</div></Panel><Panel title="Prospect ranking" eyebrow="F1 PATHWAY"><div className="prospect-list">{prospects.map((driver,index)=><button key={driver.id} onClick={()=>setSelectedDriver(driver.id)}><span>{index+1}</span><RarityTag rarity={driver.rarity}/><div><b>{driver.name}</b><small>{driver.age} · {driver.series} · {driver.academy?`${getTeam(universe,driver.academy)?.short} Academy`:'Independent'}</small></div><em>{driver.prospectScore.toFixed(0)}</em></button>)}</div></Panel></div>
    <div className="world-movement"><Panel title="Career movement ecosystem" eyebrow="PATHS"><div className="path-diagram"><span>Karting</span><i>→</i><span>Regional / F4</span><i>→</i><span>F3</span><i>→</i><span>F2</span><i>→</i><strong>F1</strong><b>↘</b><span>Formula E</span><span>WEC</span></div><p className="explain">Fast-track phenoms may skip a tier with an experience penalty. Stalled prospects can become reserves or pivot. F1 veterans can rebuild reputation elsewhere and return.</p></Panel></div>
  </section>;
}

function Almanac({universe,setSelectedDriver,setSelectedTeam,setSelectedCircuit}){
  const [tab,setTab]=useState('GOAT');const[mode,setMode]=useState('F1');const goats=goatLeaderboard(universe,mode).slice(0,30);
  return <section className="page-section"><PageTitle eyebrow="HISTORY" title="Almanac" subtitle="Every season adds a permanent sporting archive: drivers, teams, staff, circuits, countries, manufacturers, records, awards and lineages."/><div className="filter-row">{['GOAT','Awards','Seasons','Teams','Circuits','Staff'].map((item)=><Pill key={item} active={tab===item} onClick={()=>setTab(item)}>{item}</Pill>)}</div>
    {tab==='GOAT'&&<><div className="filter-row compact">{['F1','All Motorsport','Peak','Longevity'].map((item)=><Pill key={item} active={mode===item} onClick={()=>setMode(item)}>{item}</Pill>)}</div><div className="almanac-layout"><Panel title="All-time driver index" eyebrow={`${mode.toUpperCase()} MODEL`}><div className="goat-list">{goats.map((driver,index)=><button key={driver.id} onClick={()=>setSelectedDriver(driver.id)}><strong>{index+1}</strong><CountryTag code={driver.countryCode}/><RarityTag rarity={driver.rarity}/><div><b>{driver.name}</b><small>{driver.career.titles} titles · {driver.career.f1Wins} wins · {driver.career.f1Podiums} podiums</small></div><em>{driver.goat.toFixed(1)}</em></button>)}</div></Panel><aside><Panel title="Transparent formula" eyebrow="HOW LEGACY WORKS"><Formula mode={mode}/></Panel><Panel title="Current-era records" eyebrow="LIVE"><div className="record-list"><span><b>{Math.max(...universe.drivers.map((d)=>d.career.f1Wins))}</b>Most wins</span><span><b>{Math.max(...universe.drivers.map((d)=>d.career.titles))}</b>Most titles</span><span><b>{universe.seasonArchive.length}</b>Archived seasons</span><span><b>{universe.raceResults.length}</b>Current races</span></div></Panel></aside></div></>}
    {tab==='Awards'&&<Awards universe={universe} setSelectedDriver={setSelectedDriver} setSelectedTeam={setSelectedTeam}/>} 
    {tab==='Seasons'&&<Seasons universe={universe}/>} 
    {tab==='Teams'&&<TeamHistory universe={universe} setSelectedTeam={setSelectedTeam}/>} 
    {tab==='Circuits'&&<CircuitHistory universe={universe} setSelectedCircuit={setSelectedCircuit}/>} 
    {tab==='Staff'&&<StaffHistory universe={universe}/>} 
  </section>;
}
function Formula({mode}){return <div className="formula"><p><b>Titles</b> × 180</p><p><b>Wins</b> × 12</p><p><b>Podiums</b> × 3.8</p><p><b>Poles</b> × 4</p><p><b>Points / starts</b> longevity value</p><p><b>Wet excellence + overperformance</b> context</p>{mode==='All Motorsport'&&<p><b>FE, WEC & Le Mans</b> cross-series value</p>}<p><b>Rarity multiplier</b> preserves era-defining ceilings</p></div>}
function Awards({universe,setSelectedDriver,setSelectedTeam}){const awards=[...universe.awards].reverse();return awards.length?<div className="award-grid">{awards.map((award,index)=><button key={`${award.year}-${award.type}-${index}`} onClick={()=>getDriver(universe,award.winnerId)?setSelectedDriver(award.winnerId):setSelectedTeam(award.winnerId)}><span>{award.year}</span><Icon name="standings" size={30}/><h3>{award.type}</h3><b>{award.winnerName}</b><p>{award.reason}</p></button>)}</div>:<Empty title="No annual awards yet" body="Complete the season to award World Champion, Driver of the Year, Rookie, Qualifier, Overtaker, Wet-Weather Driver, Pit Crew and Technical Innovation."/>}
function Seasons({universe}){return universe.seasonArchive.length?<div className="season-archive">{[...universe.seasonArchive].reverse().map((season)=><Panel key={season.year} title={`${season.year} Season`} eyebrow={`${season.calendar.length} RACES`}><div className="season-champions"><span><small>DRIVER</small><b>{season.championName}</b></span><span><small>CONSTRUCTOR</small><b>{season.constructorName}</b></span></div><div className="mini-table">{season.standings.slice(0,5).map((d,index)=><div key={d.id}><span>{index+1}</span><b>{d.name}</b><em>{d.points}</em></div>)}</div></Panel>)}</div>:<Empty title="The first season is still being written" body="Finish the year to archive champions, top standings, calendar and defining stories."/>}
function TeamHistory({universe,setSelectedTeam}){return <div className="lineage-grid">{universe.teams.map((team)=><button key={team.id} onClick={()=>setSelectedTeam(team.id)}><Livery team={team} universe={universe} compact/><h3>{team.name}</h3><p>{team.stability} · Heritage {team.heritage}</p><div>{team.lineage.map((entry,index)=><span key={index}><b>{entry.year}</b>{entry.name} · {entry.owner}</span>)}</div></button>)}</div>}
function CircuitHistory({universe,setSelectedCircuit}){return <div className="circuit-history">{universe.circuitPool.map((circuit)=><button key={circuit.id} onClick={()=>setSelectedCircuit(circuit.id)}><span>{circuit.reserve?'ROTATION POOL':`R${universe.calendar.find((e)=>e.id===circuit.id)?.round||'—'}`}</span><h3>{circuit.country}</h3><p>{circuit.name}</p><small>{circuit.class} · Protection {circuit.protected}</small></button>)}</div>}
function StaffHistory({universe}){const staff=[...universe.staff].sort((a,b)=>b.rating-a.rating);return <Panel title="Staff leaderboard" eyebrow="VALUE OVER EXPECTED"><div className="staff-table">{staff.map((member,index)=><div key={member.id}><span>{index+1}</span><CountryTag code={member.country.slice(0,3).toUpperCase()}/><div><b>{member.name}</b><small>{member.role} · {getTeam(universe,member.teamId)?.name}</small></div><em>{member.rating}</em><strong>{member.rarity}</strong></div>)}</div></Panel>}

function More({universe,setUniverse,fullSeason,nextSeason,busy,slots,save,load,remove,exportSave,importRef}){
  const updateSetting=(key,value)=>setUniverse((previous)=>({...previous,settings:{...previous.settings,[key]:value}}));
  return <section className="page-section"><PageTitle eyebrow="UNIVERSE DIRECTOR" title="More" subtitle="Save management, commissioner-level controls and simulation settings. Results remain simulation-driven."/>
    <div className="two-col settings-columns"><Panel title="Save universe" eyebrow="INDEXEDDB · 3 SLOTS"><div className="save-grid">{[1,2,3].map((slot)=>{const meta=slots.find((s)=>s.slot===slot);return <div key={slot} className="save-slot"><span>SLOT {slot}</span>{meta?<><b>{meta.label}</b><p>{meta.year} · Round {meta.round+1} · {meta.phase}</p><small>{new Date(meta.updatedAt).toLocaleString()}</small></>:<><b>Empty</b><p>No universe stored.</p></>}<div><button onClick={()=>save(slot)}><Icon name="save"/>Save</button><button onClick={()=>load(slot)} disabled={!meta}>Load</button><button onClick={()=>remove(slot)} disabled={!meta}>Delete</button></div></div>})}</div><div className="button-row"><button className="outline" onClick={exportSave}>Export JSON</button><button className="outline" onClick={()=>importRef.current?.click()}>Import JSON</button></div><p className="explain">Large saves use IndexedDB instead of localStorage. Exported snapshots provide manual cross-device transfer without a backend.</p></Panel>
      <Panel title="Commissioner settings" eyebrow="PLAUSIBLE INSTABILITY"><Setting label="Calendar churn" value={universe.settings.calendarChurn} options={['Locked','Conservative','Aggressive']} onChange={(v)=>updateSetting('calendarChurn',v)} help="Normally 0–1 permanent change per season; classics are protected."/><Setting label="Team dynamism" value={universe.settings.teamDynamism} options={['Static','Plausible']} onChange={(v)=>updateSetting('teamDynamism',v)} help="Allows rare manufacturer acquisitions and one major rebrand in an off-season."/><Setting label="Protected identity lock" value={universe.settings.authenticLock?'On':'Off'} options={['On','Off']} onChange={(v)=>updateSetting('authenticLock',v==='On')} help="Keeps heritage colors and identities resistant to sponsor-driven redesign."/><Setting label="Autosave" value={universe.settings.autoSave?'On':'Off'} options={['On','Off']} onChange={(v)=>updateSetting('autoSave',v==='On')} help="Autosaves into Slot 1 after meaningful state changes."/></Panel>
    </div>
    <div className="two-col"><Panel title="Season controls" eyebrow="SIMULATION"><div className="button-stack">{universe.phase==='Season complete'?<button className="primary" onClick={nextSeason} disabled={busy}>Run off-season and begin {universe.year+1}</button>:<button className="primary" onClick={fullSeason} disabled={busy}>Simulate to season end</button>}<button className="outline" onClick={()=>{if(window.confirm('Create a completely new procedural universe?'))setUniverse(createUniverse(Date.now()%100000000));}}>Create new universe</button></div></Panel><Panel title="Build coverage" eyebrow={`SCHEMA V${SCHEMA_VERSION}`}><div className="coverage-list">{['F1/F2/F3/FE/WEC world','Practice, Q1/Q2/Q3, Sprint and race','Dynamic weather, tyres and crossover strategy','Cars, engines, staff, development and reliability','Contracts, academies, reserves and off-season seat market','Sponsors, country links and livery history','Dynamic teams and conservative calendar rotation','Paddock narratives, awards, records and GOAT','Multi-season archive and IndexedDB saves'].map((item)=><span key={item}>✓ {item}</span>)}</div></Panel></div>
  </section>;
}
function Setting({label,value,options,onChange,help}){return <div className="setting"><div><b>{label}</b><p>{help}</p></div><select value={value} onChange={(e)=>onChange(e.target.value)}>{options.map((option)=><option key={option}>{option}</option>)}</select></div>}

function DriverModal({universe,driver,close,setSelectedTeam}){
  if(!driver)return null;const team=getTeam(universe,driver.teamId);const engineer=getStaff(universe,driver.engineerId);const results=universe.raceResults.map((r)=>r.data.rows.find((row)=>row.driverId===driver.id)).filter(Boolean);
  const marketFit=team?sponsorFit(universe,team,driver):0;
  return <div className="modal" onMouseDown={close}><div className="sheet" onMouseDown={(e)=>e.stopPropagation()}><button className="close" onClick={close}>×</button><div className="profile-hero" style={{'--team':team?.primary||'#444'}}><CountryTag code={driver.countryCode}/><RarityTag rarity={driver.rarity}/><h1>{driver.name}</h1><p>{driver.country} · {driver.age} · {driver.style}</p>{team&&<button className="team-profile-link" onClick={()=>setSelectedTeam(team.id)}><TeamBar team={team}/>{team.name}</button>}</div>
    <div className="profile-stat-grid"><span><b>{driver.baseTalent}</b>Base talent</span><span><b>{driver.careerMultiplier.toFixed(3)}</b>Career year</span><span><b>{driver.annualForm.toFixed(3)}</b>Annual form</span><span><b>{driver.confidence}</b>Confidence</span><span><b>{driver.season.points}</b>Points</span><span><b>{driver.career.titles}</b>F1 titles</span></div>
    <h3 className="section-title">Driver skills</h3><div className="skill-grid">{Object.entries(driver.skills).map(([key,value])=><Progress key={key} label={key.replace(/([A-Z])/g,' $1')} value={value}/>)}</div>
    <h3 className="section-title">Career arc</h3><div className="career-chart">{driver.careerCurve.map((value,index)=><div key={index} className={index===driver.curveIndex?'current':''}><i style={{height:`${(value-.72)*300}%`}}/><span>{driver.debutAge+index}</span></div>)}</div><p className="explain">Rarity and base talent never change. The pre-generated curve, annual form, experience, confidence and context alter yearly performance.</p>
    <div className="profile-columns"><div><h3 className="section-title">Contract & market</h3><div className="detail-list"><span><b>Through</b>{driver.contract.through}</span><span><b>Salary</b>${driver.contract.salary}m</span><span><b>Commercial value</b>{driver.commercial}</span><span><b>Sponsor fit</b>{marketFit.toFixed(0)}</span><span><b>Academy</b>{driver.academy?getTeam(universe,driver.academy)?.name:'Independent'}</span><span><b>Race engineer</b>{engineer?.name||'Not assigned'}</span></div></div><div><h3 className="section-title">Career record</h3><div className="detail-list"><span><b>Starts</b>{driver.career.f1Starts}</span><span><b>Wins</b>{driver.career.f1Wins}</span><span><b>Podiums</b>{driver.career.f1Podiums}</span><span><b>Points</b>{driver.career.f1Points}</span><span><b>Best finish</b>{driver.career.bestFinish?`P${driver.career.bestFinish}`:'—'}</span><span><b>Over expected</b>{driver.series==='F1'?performanceOverExpected(universe,driver).toFixed(1):'—'}</span></div></div></div>
    <h3 className="section-title">{universe.year} race history</h3>{results.length?<div className="history-table">{results.map((row,index)=><div key={index}><b>R{index+1}</b><span>P{row.position} from P{row.grid}</span><span>{row.points} pts</span><small>{row.tags?.join(' · ')}</small></div>)}</div>:<p className="explain">No Grand Prix results in the current season.</p>}
  </div></div>;
}

function TeamModal({universe,team,close,setSelectedDriver}){
  if(!team)return null;const drivers=universe.drivers.filter((d)=>d.teamId===team.id&&d.series==='F1');const staff=team.staffIds.map((id)=>getStaff(universe,id)).filter(Boolean);const engine=getEngine(universe,team.engineId);const sponsors=team.sponsorIds.map((id)=>getSponsor(universe,id)).filter(Boolean);
  return <div className="modal" onMouseDown={close}><div className="sheet wide-sheet" onMouseDown={(e)=>e.stopPropagation()}><button className="close" onClick={close}>×</button><div className="team-modal-hero" style={{background:`linear-gradient(125deg,${team.primary},#111 72%)`}}><div><div className="eyebrow">{team.country.toUpperCase()} · {team.stability.toUpperCase()}</div><h1>{team.name}</h1><p>{team.owner} · {engine?.name} power · Heritage {team.heritage}</p></div><Livery team={team} universe={universe}/></div>
    <div className="profile-stat-grid"><span><b>{Math.round(team.baseline)}</b>Car average</span><span><b>{team.season.points}</b>Points</span><span><b>{team.season.wins}</b>Wins</span><span><b>${team.finances.cash}m</b>Cash</span><span><b>${team.finances.sponsorIncome}m</b>Sponsors</span><span><b>{team.concept}</b>Concept</span></div>
    <h3 className="section-title">Car and power unit</h3><div className="car-grid">{Object.entries(team.car).map(([key,value])=><Progress key={key} label={key} value={value}/>)}</div><div className="engine-card"><Icon name="engine" size={30}/><div><b>{engine?.name}</b><span>{engine?.country} · {team.engineId===`${team.id}-pu`?'Works':'Supply contract'}</span></div>{[['Power',engine?.peak],['Efficiency',engine?.efficiency],['Reliability',engine?.reliability],['Trajectory',engine?.trajectory]].map(([label,value])=><span key={label}><b>{value}</b>{label}</span>)}</div>
    <div className="profile-columns"><div><h3 className="section-title">Race drivers & reserves</h3><div className="people-list">{drivers.map((driver)=><button key={driver.id} onClick={()=>setSelectedDriver(driver.id)}><CountryTag code={driver.countryCode}/><div><b>{driver.name}</b><small>{driver.role} · {driver.rarity}</small></div><em>{driver.baseTalent}</em></button>)}</div></div><div><h3 className="section-title">Leadership</h3><div className="people-list">{staff.map((member)=><div key={member.id}><CountryTag code={member.country.slice(0,3).toUpperCase()}/><div><b>{member.name}</b><small>{member.role} · {member.specialty}</small></div><em>{member.rating}</em></div>)}</div></div></div>
    <h3 className="section-title">Sponsors and visual identity</h3><div className="sponsor-cards">{sponsors.map((sponsor,index)=><div key={sponsor.id} style={{'--sponsor':sponsor.colors[0]}}><span>{index===0?'TITLE':index===1?'MAJOR':'TECHNICAL'}</span><b>{sponsor.name}</b><p>{sponsor.country} · {sponsor.industry}</p><small>${sponsor.value}m fictional universe value</small></div>)}</div>
    <h3 className="section-title">Facilities</h3><div className="car-grid">{Object.entries(team.facilities).map(([key,value])=><Progress key={key} label={key} value={value}/>)}</div>
    <h3 className="section-title">Lineage and upgrades</h3><div className="lineage-timeline">{team.lineage.map((entry,index)=><div key={index}><b>{entry.year}</b><span>{entry.name}</span><small>{entry.owner} · {getEngine(universe,entry.engineId)?.name}</small></div>)}</div>{team.upgrades.length>0&&<div className="history-table">{team.upgrades.slice(-8).reverse().map((upgrade,index)=><div key={index}><b>R{upgrade.round}</b><span>{upgrade.dimension}</span><span>{upgrade.gain>0?'+':''}{upgrade.gain}</span><small>{upgrade.status}</small></div>)}</div>}
  </div></div>;
}

function CircuitModal({universe,circuit,close}){
  if(!circuit)return null;const active=universe.calendar.find((e)=>e.id===circuit.id);const winners=universe.raceResults.filter((r)=>r.eventId===circuit.id).map((r)=>getDriver(universe,r.data.winnerId));
  return <div className="modal" onMouseDown={close}><div className="sheet" onMouseDown={(e)=>e.stopPropagation()}><button className="close" onClick={close}>×</button><div className="circuit-profile"><div className="circuit-art"><i/><i/><i/></div><div className="eyebrow">{circuit.class.toUpperCase()}</div><h1>{circuit.name}</h1><p>{circuit.city}, {circuit.country}</p></div><div className="profile-stat-grid"><span><b>{active?`R${active.round}`:'Pool'}</b>Calendar</span><span><b>{circuit.protected}</b>Protection</span><span><b>{circuit.contract||'—'}</b>Contract</span><span><b>{circuit.rain}%</b>Rain</span></div><h3 className="section-title">Circuit characteristics</h3><div className="skill-grid">{Object.entries(circuit.traits).map(([key,value])=><Progress key={key} label={key} value={value}/>)}</div><h3 className="section-title">Calendar evaluation</h3><div className="detail-list"><span><b>Heritage value</b>{circuit.protected}</span><span><b>Race quality</b>{Math.round((circuit.traits.overtake+circuit.traits.tyre)/2)}</span><span><b>Street risk</b>{circuit.traits.street}</span><span><b>Status</b>{active?'Active calendar':'Rotation pool'}</span></div><h3 className="section-title">Winners in this universe</h3>{winners.length?<div className="history-table">{winners.map((driver,index)=><div key={index}><b>{universe.year}</b><span>{driver?.name}</span><span>{getTeam(universe,driver?.teamId)?.name}</span></div>)}</div>:<p className="explain">No completed edition in the current saved history.</p>}</div></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
