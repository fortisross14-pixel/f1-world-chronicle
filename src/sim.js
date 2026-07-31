import { RARITY, MAIN_BRANDS, makeRng, getTeam, getDriver, getStaff, getEngine, getSponsor, getMainBrand, COUNTRIES, createProceduralDriver } from './data.js';

export const GRAND_PRIX_POINTS = [25,18,15,12,10,8,6,4,2,1];
export const SPRINT_POINTS = [8,7,6,5,4,3,2,1];
export const SESSION_TEMPLATES = {
  standard: [
    { key:'FP1', label:'Practice 1', type:'Practice' },
    { key:'FP2', label:'Practice 2', type:'Practice' },
    { key:'FP3', label:'Practice 3', type:'Practice' },
    { key:'Q', label:'Qualifying', type:'Qualifying' },
    { key:'R', label:'Grand Prix', type:'Race' },
  ],
  sprint: [
    { key:'FP1', label:'Practice 1', type:'Practice' },
    { key:'SQ', label:'Sprint Qualifying', type:'Sprint Qualifying' },
    { key:'S', label:'Sprint', type:'Sprint' },
    { key:'Q', label:'Grand Prix Qualifying', type:'Qualifying' },
    { key:'R', label:'Grand Prix', type:'Race' },
  ],
};

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const avg=(values)=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
const seconds=(value)=>`${Math.floor(value/60)}:${(value%60).toFixed(3).padStart(6,'0')}`;
const deepClone=(value)=>structuredClone(value);
const idNumber=(id)=>[...String(id)].reduce((sum,ch)=>sum+ch.charCodeAt(0),0);

export function currentF1Drivers(universe) {
  return universe.drivers.filter((driver)=>driver.series==='F1' && driver.role==='Race driver' && driver.active);
}
export function driverStandings(universe, series='F1') {
  return universe.drivers.filter((driver)=>driver.series===series && driver.role==='Race driver' && driver.active)
    .sort((a,b)=>b.season.points-a.season.points || b.season.wins-a.season.wins || b.season.podiums-a.season.podiums || b.baseTalent-a.baseTalent);
}
export function constructorStandings(universe) {
  return universe.teams.map((team)=>({
    ...team,
    seasonPoints:currentF1Drivers(universe).filter((driver)=>driver.teamId===team.id).reduce((sum,driver)=>sum+driver.season.points,0),
    seasonWins:currentF1Drivers(universe).filter((driver)=>driver.teamId===team.id).reduce((sum,driver)=>sum+driver.season.wins,0),
  })).sort((a,b)=>b.seasonPoints-a.seasonPoints || b.seasonWins-a.seasonWins || b.baseline-a.baseline);
}
export function seriesStandings(universe, series) {
  return driverStandings(universe,series);
}

function careerMultiplier(driver) {
  return driver.careerCurve?.[driver.curveIndex] || driver.careerMultiplier || 0.92;
}
function driverLevel(driver, key, weather='Dry') {
  const wetWeight = weather==='Wet' ? .38 : weather==='Damp' ? .18 : 0;
  const core = driver.skills?.[key] ?? driver.baseTalent;
  const wet = driver.skills?.wet ?? driver.baseTalent;
  return (core*(1-wetWeight)+wet*wetWeight)*careerMultiplier(driver)*driver.annualForm + (driver.confidence-60)*.07;
}
function observedDriverValue(driver) {
  const skills=Object.values(driver.skills||{pace:driver.baseTalent});
  const visibleSkill=avg(skills);
  const recent=driver.season?.form?.length?avg(driver.season.form.map((position)=>Math.max(0,24-position)))*.32:0;
  return visibleSkill*careerMultiplier(driver)*driver.annualForm + (driver.confidence-60)*.08 + recent;
}
function testDriverContribution(universe,team){
  const tests=(team.testDriverIds||[]).map((id)=>getDriver(universe,id)).filter((driver)=>driver?.active);
  if(!tests.length)return 65;
  return avg(tests.map((driver)=>driver.skills.feedback*.55+driver.skills.consistency*.2+driver.experience*.25));
}
function teamPrincipal(universe,team){
  return (team.staffIds||[]).map((id)=>getStaff(universe,id)).find((member)=>member?.role==='Team Principal');
}
function teamStaffRating(universe, team, role) {
  const members=team.staffIds.map((id)=>getStaff(universe,id)).filter(Boolean).filter((member)=>member.role===role);
  return members.length?avg(members.map((member)=>member.rating)):75;
}
function carFit(universe, team, circuit, mode='race') {
  const engine=getEngine(universe,team.engineId);
  const traits=circuit.traits;
  const high=team.car.high*(traits.high/100);
  const low=team.car.low*(traits.low/100);
  const straight=(team.car.straight*.62+(engine?.peak||82)*.38)*(traits.straight/100);
  const mechanical=team.car.mechanical*((100-traits.high+traits.low)/150);
  const tyre=team.car.tyre*(mode==='race'?.65:.2);
  const operations=team.car.operations*(mode==='race'?.18:.1);
  const energy=(team.car.energy*.5+(engine?.efficiency||82)*.5)*(traits.straight/130);
  const conceptBonus = (
    (team.concept==='Maximum downforce' && traits.high>82) ||
    (team.concept==='High downforce' && traits.low>82) ||
    (team.concept==='Low drag' && traits.straight>88) ||
    (team.concept==='Tyre-friendly' && traits.tyre>76) ||
    (team.concept==='Qualifying-focused' && mode==='qualifying') ||
    (team.concept==='Race-focused' && mode==='race') || team.concept==='Balanced'
  ) ? 2.1 : 0;
  const setup = team.weekendSetup || 0;
  return (high+low+straight+mechanical+tyre+operations+energy)/((traits.high+traits.low+traits.straight+((100-traits.high+traits.low)/150)*100)+(mode==='race'?103:30)+(mode==='race'?18:10)+(traits.straight/130)*100) * 100 + conceptBonus + setup;
}

function weatherForSession(event, sessionKey, rng) {
  const sessionBias={FP1:-.06,FP2:.02,FP3:.03,SQ:.04,S:.08,Q:.06,R:.11}[sessionKey]||0;
  const base=clamp(event.rain/100+sessionBias+(rng.next()-.5)*.16,0.01,.88);
  const roll=rng.next();
  let state='Dry';
  if(roll<base*.27) state='Wet'; else if(roll<base) state='Damp';
  const forecastAccuracy=clamp(.58+rng.next()*.33,.58,.91);
  const forecastChance=Math.round(clamp((base+(rng.next()-.5)*(1-forecastAccuracy)*.45)*100,1,94));
  const temperature=Math.round(event.temp+(rng.next()-.5)*7);
  const wind=Math.round(5+rng.next()*24);
  return {state,forecastChance,temperature,wind,accuracy:Math.round(forecastAccuracy*100),summary:state==='Dry'?(forecastChance>35?'Dry, rain nearby':'Dry'):state==='Damp'?'Intermittent rain':'Heavy rain'};
}

function raceWeatherTimeline(event, weather, rng, segments=8) {
  const states=[];
  let state=weather.state;
  for(let i=0;i<segments;i+=1){
    if(i===0 && state==='Damp' && rng.chance(.45)) state='Dry';
    const localRisk=event.rain/100 + (i>2&&i<6?.08:0);
    if(state==='Dry' && rng.chance(localRisk*.22)) state='Damp';
    else if(state==='Damp' && rng.chance(localRisk*.24)) state='Wet';
    else if(state==='Wet' && rng.chance(.22)) state='Damp';
    else if(state==='Damp' && rng.chance(.2)) state='Dry';
    states.push(state);
  }
  if(weather.state==='Dry' && event.rain>35 && rng.chance(.46)){
    const start=rng.int(2,5); states[start]='Damp'; if(rng.chance(.52)) states[Math.min(segments-1,start+1)]='Wet';
    if(start+2<segments) states[start+2]='Damp';
  }
  return states;
}

function ensureWeekend(universe,eventIndex) {
  const event=universe.calendar[eventIndex];
  if(event.sessions?.length) return event;
  const rng=makeRng(event.weekendSeed+universe.year*13);
  const template=event.sprint?SESSION_TEMPLATES.sprint:SESSION_TEMPLATES.standard;
  event.sessions=template.map((session,index)=>({
    ...session, index, status:'Pending', weather:weatherForSession(event,session.key,rng), resultId:null,
  }));
  event.status='Current'; event.teamSetup={}; event.upgrades=[];
  universe.teams.forEach((team)=>{ team.weekendSetup=0; });
  return event;
}

function lapTimeFromScore(score,circuit,phase,rng) {
  const base=phase==='Practice'?95:phase.includes('Qualifying')?91:93;
  const circuitDelta=(circuit.traits.high+circuit.traits.low+circuit.traits.straight)/300*12;
  return base+circuitDelta-(score-70)*.39+(rng.next()-.5)*.45;
}

function simulatePractice(universe,event,session,rng) {
  const rows=currentF1Drivers(universe).map((driver)=>{
    const team=getTeam(universe,driver.teamId);
    const setupDirector=teamStaffRating(universe,team,'Technical Director');
    const driverFeedback=driver.skills.feedback;
    const fit=carFit(universe,team,event,'practice');
    const weather=session.weather.state;
    const score=fit*.52+driverLevel(driver,'racePace',weather)*.32+driverFeedback*.08+setupDirector*.08+(rng.next()-.5)*5;
    const testWork=testDriverContribution(universe,team);
    const setupGain=clamp((driverFeedback+setupDirector+team.facilities.simulator+testWork)/400*.95+rng.next()*.42,0.25,1.35);
    team.weekendSetup=clamp((team.weekendSetup||0)+setupGain/3,0,2.8);
    const issue=rng.chance(clamp((95-team.car.reliability)/420,0.004,.06))?rng.pick(['hydraulic leak','sensor problem','gearbox warning','cooling issue']):null;
    return {driverId:driver.id,teamId:team.id,score,time:lapTimeFromScore(score,event,'Practice',rng),laps:rng.int(19,32),compound:rng.pick(['Soft','Medium','Hard']),issue,setupGain:Number(setupGain.toFixed(2))};
  }).sort((a,b)=>a.time-b.time);
  const leader=rows[0]?.time||0; rows.forEach((row,index)=>{row.position=index+1;row.gap=index===0?'—':`+${(row.time-leader).toFixed(3)}`;});
  const surprise=rows.find((row,index)=>index<5 && universe.teams.findIndex((team)=>team.id===row.teamId)>6);
  return {kind:'Practice',rows,headline:surprise?`${getDriver(universe,surprise.driverId).name} puts a midfield car into the top five`:`${getDriver(universe,rows[0].driverId).name} sets the early pace`,events:rows.filter((row)=>row.issue).map((row)=>({type:'Issue',text:`${getDriver(universe,row.driverId).name}: ${row.issue}`}))};
}

function qualifyingRun(universe,event,drivers,weather,roundName,rng,cut) {
  const rows=drivers.map((driver)=>{
    const team=getTeam(universe,driver.teamId);
    const strategy=teamStaffRating(universe,team,'Head of Strategy');
    const trackEvolution=(roundName==='Q3'?1.6:roundName==='Q2'?.9:0);
    const runTiming=(strategy-70)*.025+(rng.next()-.5)*2.2;
    const trafficPenalty=rng.chance(roundName==='Q1'?.12:.06)?rng.next()*2.1:0;
    const deleted=rng.chance(clamp((96-driver.skills.consistency)/850,0.003,.045));
    const score=carFit(universe,team,event,'qualifying')*.52+driverLevel(driver,'oneLap',weather)*.42+driver.skills.composure*.04+runTiming+trackEvolution-trafficPenalty+(rng.next()-.5)*2.8;
    return {driverId:driver.id,teamId:team.id,score,time:lapTimeFromScore(score,event,'Qualifying',rng)+(deleted?.75:0),deleted,compound:'Soft'};
  }).sort((a,b)=>a.time-b.time);
  const leader=rows[0].time;
  rows.forEach((row,index)=>{ row.position=index+1;row.gap=index===0?'—':`+${(row.time-leader).toFixed(3)}`;row.advanced=index<cut; });
  return rows;
}

function simulateQualifying(universe,event,session,rng) {
  const all=currentF1Drivers(universe);
  const weather=session.weather.state;
  const q1=qualifyingRun(universe,event,all,weather,'Q1',rng,15);
  const q2=qualifyingRun(universe,event,q1.filter((row)=>row.advanced).map((row)=>getDriver(universe,row.driverId)),weather,'Q2',rng,10);
  const q3=qualifyingRun(universe,event,q2.filter((row)=>row.advanced).map((row)=>getDriver(universe,row.driverId)),weather,'Q3',rng,10);
  const eliminatedQ1=q1.slice(15).sort((a,b)=>a.time-b.time);
  const eliminatedQ2=q2.slice(10).sort((a,b)=>a.time-b.time);
  const final=[...q3,...eliminatedQ2,...eliminatedQ1].map((row,index)=>({...row,position:index+1}));
  const pole=getDriver(universe,final[0].driverId); pole.season.poles+=1; pole.season.qualifyingPoints+=25; pole.career.f1Poles+=1; const poleTeam=getTeam(universe,pole.teamId); if(poleTeam){poleTeam.season.poles+=1;poleTeam.career.poles+=1;}
  final.slice(1).forEach((row,index)=>{const d=getDriver(universe,row.driverId);d.season.qualifyingPoints+=Math.max(0,18-index);});
  const wetStar=weather!=='Dry'?[...final].slice(0,6).sort((a,b)=>getDriver(universe,b.driverId).skills.wet-getDriver(universe,a.driverId).skills.wet)[0]:null;
  return {kind:'Qualifying',rounds:{Q1:q1,Q2:q2,Q3:q3},rows:final,grid:final.map((row)=>row.driverId),headline:`${pole.name} claims pole${weather!=='Dry'?' in a rain-affected session':''}`,events:[
    ...(q1.filter((row)=>row.deleted).slice(0,2).map((row)=>({type:'Deleted lap',text:`${getDriver(universe,row.driverId).name} lost a lap to track limits`}))),
    ...(wetStar?[{type:'Wet qualifying',text:`${getDriver(universe,wetStar.driverId).name} exploited ${weather.toLowerCase()} conditions`}]:[]),
  ]};
}

function tyreForState(state,aggression=false) {
  if(state==='Wet') return 'Wet';
  if(state==='Damp') return 'Intermediate';
  return aggression?'Soft':'Medium';
}
function strategyQuality(universe,driver,team) {
  return teamStaffRating(universe,team,'Head of Strategy')*.52+team.car.operations*.2+driver.skills.tyre*.18+driver.skills.composure*.1;
}
function reliabilityRisk(universe,driver,team,event,rng,isSprint=false) {
  const engine=getEngine(universe,team.engineId);
  const reliability=team.car.reliability*.5+(engine?.reliability||82)*.35+driver.skills.sympathy*.15;
  const stress=(event.traits.tyre+event.traits.high)/200;
  return clamp((101-reliability)/130*(isSprint?.35:1)*(0.7+stress*.5)+(rng.next()-.5)*.015,.004,.18);
}

function simulateRace(universe,event,session,rng,isSprint=false) {
  const lastQual=[...universe.sessionResults].reverse().find((result)=>result.year===universe.year&&result.round===event.round&&((isSprint&&result.sessionKey==='SQ')||(!isSprint&&result.sessionKey==='Q')));
  let grid=lastQual?.data?.grid || currentF1Drivers(universe).sort((a,b)=>b.baseTalent-a.baseTalent).map((driver)=>driver.id);
  const segments=isSprint?4:8;
  const timeline=raceWeatherTimeline(event,session.weather,rng,segments);
  const laps=isSprint?Math.round(22+event.traits.high/8):Math.round(48+event.traits.low/5);
  const states=grid.map((driverId,index)=>{
    const driver=getDriver(universe,driverId); const team=getTeam(universe,driver.teamId);
    const startSkill=driverLevel(driver,'starts',timeline[0]);
    const startDelta=clamp(Math.round((startSkill-82)/12+(rng.next()-.5)*2),-2,2);
    return {driverId,teamId:team.id,grid:index+1,virtualPos:clamp(index+1-startDelta,1,grid.length),time:0,status:'Running',laps,lapsCompleted:laps,tyre:tyreForState(timeline[0],driver.style==='Aggressive attacker'),stints:[],pitStops:0,penalty:0,tags:[],events:[],paceScore:0};
  });
  const raceEvents=[];
  let safetyCar=false;
  let virtualSafetyCar=false;
  let redFlag=false;
  const teamOrders=[];
  states.forEach((state)=>{
    const driver=getDriver(universe,state.driverId); const team=getTeam(universe,state.teamId);
    const quality=strategyQuality(universe,driver,team);
    let previousTyre=state.tyre; let stintStart=1; let totalPerformance=0; let tyreAge=0;
    for(let segment=0;segment<segments;segment+=1){
      const track=timeline[segment]; const ideal=tyreForState(track,driver.style==='Aggressive attacker');
      const lapStart=Math.max(1,Math.round(segment*laps/segments)+1);
      const lapEnd=Math.min(laps,Math.round((segment+1)*laps/segments));
      const transition=ideal!==previousTyre;
      let reactDelay=0;
      if(transition){
        const strategyRoll=quality+(rng.next()-.5)*24;
        reactDelay=strategyRoll<75?1:0;
        if(reactDelay){state.tags.push('Late tyre call'); state.time+=7.5;}
        state.stints.push({from:stintStart,to:lapStart-1,compound:previousTyre});
        state.pitStops+=1; state.time+=(isSprint?17.5:20.5)+(100-team.facilities.pitCrew)*.055+(rng.next()-.5)*1.2;
        previousTyre=ideal; stintStart=lapStart;
        if(!reactDelay && track!=='Dry'){state.tags.push('Perfect crossover call');state.time-=2.8;}
      } else if(track==='Dry' && !isSprint && segment>1 && segment<segments-1 && tyreAge>1 && rng.chance(clamp((88-driver.skills.tyre)/120+.16,.08,.35))){
        state.stints.push({from:stintStart,to:lapStart-1,compound:previousTyre}); state.pitStops+=1; state.time+=20.5+(100-team.facilities.pitCrew)*.055; previousTyre=driver.skills.tyre>86?'Hard':'Medium'; stintStart=lapStart; tyreAge=0;
      }
      tyreAge+=1;
      const fit=carFit(universe,team,event,'race');
      const pace=fit*.46+driverLevel(driver,'racePace',track)*.34+driver.skills.racecraft*.1+driver.skills.tyre*.06+driver.skills.consistency*.04;
      let tyrePenalty=0;
      if((track==='Wet'&&previousTyre!=='Wet')||(track==='Damp'&&!['Intermediate','Wet'].includes(previousTyre))) tyrePenalty=12;
      if(track==='Dry'&&['Intermediate','Wet'].includes(previousTyre)) tyrePenalty=7;
      const degradation=Math.max(0,(event.traits.tyre-driver.skills.tyre)*.035*tyreAge);
      const traffic=(state.virtualPos>8?event.traits.overtake<55?1.4:.4:0);
      const variability=(rng.next()-.5)*(8-driver.skills.consistency/18);
      totalPerformance+=pace-tyrePenalty-degradation-traffic+variability;
      state.time+=(lapEnd-lapStart+1)*(96-(pace-70)*.24)+tyrePenalty+degradation;
      if(state.status==='Running' && rng.chance(reliabilityRisk(universe,driver,team,event,rng,isSprint)/segments)){
        state.status='DNF'; state.lapsCompleted=Math.max(2,lapEnd-rng.int(1,4)); state.tags.push('Mechanical DNF');
        const reason=rng.pick(['power unit failure','hydraulic failure','gearbox failure','electrical shutdown','overheating']);
        state.events.push({lap:state.lapsCompleted,type:'Retirement',text:`${driver.name} retires with ${reason}`}); raceEvents.push(state.events.at(-1));
      }
      const incidentChance=clamp((94-driver.skills.consistency)/1100+(driver.style==='Aggressive attacker'?.006:0)+(track!=='Dry'?.008:0),.001,.026);
      if(state.status==='Running' && rng.chance(incidentChance)){
        if(rng.chance(.28)){
          state.status='DNF'; state.lapsCompleted=lapEnd; state.tags.push('Crash DNF');
          state.events.push({lap:lapEnd,type:'Incident',text:`${driver.name} crashes out in ${track.toLowerCase()} conditions`}); raceEvents.push(state.events.at(-1)); safetyCar=true;
        } else {
          state.time+=rng.int(8,24); state.tags.push('Costly mistake');
          state.events.push({lap:lapEnd,type:'Mistake',text:`${driver.name} loses time after a driving error`}); raceEvents.push(state.events.at(-1));
        }
      }
      if(state.status==='Running' && rng.chance(.006)){
        state.penalty+=5; state.tags.push('Five-second penalty');
        state.events.push({lap:lapEnd,type:'Penalty',text:`${driver.name} receives a five-second penalty`}); raceEvents.push(state.events.at(-1));
      }
      if(state.status!=='Running') break;
    }
    if(state.status==='Running') state.stints.push({from:stintStart,to:laps,compound:previousTyre});
    state.tyre=previousTyre; state.paceScore=totalPerformance/segments; state.time+=state.penalty;
  });
  // Late-race team orders are possible, but only when a clear title priority exists.
  if(!isSprint && event.round>Math.round(universe.calendar.length*.55)){
    universe.teams.forEach((team)=>{
      const pair=states.filter((state)=>state.teamId===team.id&&state.status==='Running');
      if(pair.length!==2)return;
      const [a,b]=pair; const da=getDriver(universe,a.driverId); const db=getDriver(universe,b.driverId);
      const contender=da.season.points>=db.season.points?{state:a,driver:da,other:b,otherDriver:db}:{state:b,driver:db,other:a,otherDriver:da};
      const gap=contender.state.time-contender.other.time;
      const principal=team.staffIds.map((id)=>getStaff(universe,id)).find((member)=>member?.role==='Team Principal');
      const orderChance=clamp(.38+(principal?.rating||75)/250+(team.finances.pressure||40)/300,.45,.9);
      if(gap>0&&gap<6&&contender.driver.season.points-contender.otherDriver.season.points>=15&&rng.chance(orderChance)){
        const previous=contender.other.time; contender.state.time=previous-.15; contender.other.time+=1.25;
        contender.state.tags.push('Team-order priority'); contender.other.tags.push('Team order obeyed');
        const order={lap:Math.max(1,laps-rng.int(3,10)),type:'Team Order',text:`${team.name} asks ${contender.otherDriver.name} to release title contender ${contender.driver.name}`};
        raceEvents.push(order);teamOrders.push(order);
      }
    });
  }
  if(safetyCar){
    const lap=rng.int(Math.round(laps*.25),Math.round(laps*.8));
    raceEvents.push({lap,type:'Safety Car',text:'The Safety Car compresses the field and reshapes the pit window'});
    states.filter((state)=>state.status==='Running').forEach((state)=>{state.time-=Math.min(18,Math.max(0,state.time%21)); if(rng.chance(.18))state.tags.push('Safety-car beneficiary');});
    redFlag=!isSprint&&timeline.some((state)=>state==='Wet')&&rng.chance(.16);
    if(redFlag){
      const redLap=Math.min(laps-2,lap+rng.int(1,4));raceEvents.push({lap:redLap,type:'Red Flag',text:'The race is stopped in dangerous conditions; the field restarts on freely chosen tyres'});
      states.filter((state)=>state.status==='Running').forEach((state)=>{state.time-=Math.min(9,Math.max(0,state.time%12));state.tags.push('Red-flag restart');});
    }
  } else if(raceEvents.some((eventItem)=>['Retirement','Mistake'].includes(eventItem.type))&&rng.chance(.32)){
    virtualSafetyCar=true;const lap=rng.int(Math.round(laps*.2),Math.round(laps*.85));raceEvents.push({lap,type:'Virtual Safety Car',text:'A Virtual Safety Car neutralizes the pace and opens a cheaper pit-stop window'});
    states.filter((state)=>state.status==='Running').forEach((state)=>{if(state.pitStops>0&&rng.chance(.22)){state.time-=5.5;state.tags.push('VSC pit-stop gain');}});
  }
  const running=states.filter((state)=>state.status==='Running').sort((a,b)=>a.time-b.time);
  const retired=states.filter((state)=>state.status!=='Running').sort((a,b)=>b.lapsCompleted-a.lapsCompleted||a.time-b.time);
  const sorted=[...running,...retired]; const leaderTime=running[0]?.time||sorted[0]?.time||0;
  sorted.forEach((state,index)=>{
    state.position=index+1; state.points=state.status==='Running'?((isSprint?SPRINT_POINTS:GRAND_PRIX_POINTS)[index]||0):0;
    state.gap=index===0?seconds(leaderTime):state.status==='Running'?`+${(state.time-leaderTime).toFixed(3)}s`:`DNF (${state.lapsCompleted} laps)`;
    const driver=getDriver(universe,state.driverId); const team=getTeam(universe,state.teamId);
    driver.season.points+=state.points; driver.season.starts+=isSprint?0:1; driver.season.wins+=(!isSprint&&index===0)?1:0; driver.season.podiums+=(!isSprint&&index<3)?1:0; driver.season.dnfs+=(!isSprint&&state.status!=='Running')?1:0;
    driver.season.positionsGained+=state.grid-state.position; driver.season.form.push(state.position); driver.season.form=driver.season.form.slice(-5);
    if(timeline.some((weather)=>weather!=='Dry')) driver.season.wetScore+=Math.max(0,12-state.position);
    driver.season.bestFinish=driver.season.bestFinish==null?state.position:Math.min(driver.season.bestFinish,state.position);
    if(!isSprint){driver.career.f1Starts+=1;driver.career.f1Points+=state.points;driver.career.f1Wins+=index===0?1:0;driver.career.f1Podiums+=index<3?1:0;driver.career.bestFinish=driver.career.bestFinish==null?state.position:Math.min(driver.career.bestFinish,state.position);}
    team.season.points+=state.points; team.season.wins+=(!isSprint&&index===0)?1:0; team.season.podiums+=(!isSprint&&index<3)?1:0; team.season.dnfs+=state.status!=='Running'?1:0; team.season.pitScore+=Math.max(0,100-state.pitStops*3-(state.tags.includes('Late tyre call')?8:0));
    team.career.points+=state.points; if(!isSprint){team.career.entries+=1;team.career.wins+=index===0?1:0;team.career.podiums+=index<3?1:0;}
    driver.confidence=clamp(driver.confidence+(index<3?3:index>15?-2:0),30,96);
  });
  const winner=getDriver(universe,sorted[0].driverId);
  const winnerTeam=getTeam(universe,winner.teamId);
  if(!isSprint&&winnerTeam){winnerTeam.staffIds.map((id)=>getStaff(universe,id)).filter(Boolean).forEach((member)=>{member.wins=(member.wins||0)+1;});}
  const fastest=[...sorted].filter((state)=>state.status==='Running').sort((a,b)=>b.paceScore-a.paceScore)[0];
  if(!isSprint&&fastest){universe.records.fastestLaps.unshift({year:universe.year,round:event.round,eventId:event.id,driverId:fastest.driverId,driverName:getDriver(universe,fastest.driverId).name});universe.records.fastestLaps=universe.records.fastestLaps.slice(0,120);}
  if(!isSprint&&winner){
    const priorYoungest=universe.records.youngestWins[0];
    if(!priorYoungest||winner.age<priorYoungest.age){universe.records.youngestWins.unshift({year:universe.year,eventId:event.id,driverId:winner.id,driverName:winner.name,age:winner.age});}
    if(event.class==='Protected classic'){universe.records.classicRaces.unshift({year:universe.year,eventId:event.id,eventName:event.name,winnerId:winner.id,winnerName:winner.name,weather:[...new Set(timeline)].join(' → ')});universe.records.classicRaces=universe.records.classicRaces.slice(0,120);}
    if([1,5,10,20,30,50].includes(winner.career.f1Wins)){universe.records.driverMilestones.unshift({year:universe.year,round:event.round,driverId:winner.id,text:`${winner.name} reaches ${winner.career.f1Wins} Formula 1 wins`});}
  }
  const biggestGain=[...sorted].sort((a,b)=>(b.grid-b.position)-(a.grid-a.position))[0];
  if(biggestGain && biggestGain.grid-biggestGain.position>=6) biggestGain.tags.push('Comeback drive');
  const weatherChanged=new Set(timeline).size>1;
  return {kind:isSprint?'Sprint':'Race',rows:sorted,grid,timeline,laps,safetyCar,virtualSafetyCar,redFlag,teamOrders,fastestLapDriverId:fastest?.driverId||null,events:raceEvents.sort((a,b)=>a.lap-b.lap).slice(0,20),headline:`${winner.name} wins ${isSprint?'the Sprint':`the ${event.country} Grand Prix`}${weatherChanged?' after changing conditions':''}`,winnerId:winner.id};
}

function createStory(universe,{category,headline,dek,priority=70,subjects=[],thread=null,round=null}){
  universe.storyCounter=(universe.storyCounter||0)+1;
  universe.stories.unshift({id:`story-${universe.year}-${String(universe.storyCounter).padStart(5,'0')}`,year:universe.year,round:round??universe.currentRound+1,category,headline,dek,priority,subjects,thread,createdAt:`${universe.year}-R${round??universe.currentRound+1}-${universe.storyCounter}`});
  universe.stories=universe.stories.slice(0,180);
}
function resultStory(universe,event,session,result){
  if(result.kind==='Practice'){
    createStory(universe,{category:'Race Week',headline:result.headline,dek:`${session.label} at ${event.name} delivered the first setup clues. Teams converted feedback into small weekend-specific gains.`,priority:54,round:event.round});
    return;
  }
  if(result.kind==='Qualifying'){
    const pole=getDriver(universe,result.rows[0].driverId); const expected=[...currentF1Drivers(universe)].sort((a,b)=>b.baseTalent-a.baseTalent).findIndex((d)=>d.id===pole.id)+1;
    createStory(universe,{category:'Race Week',headline:result.headline,dek:session.weather.state!=='Dry'?`Rain rewarded wet-weather skill and run timing. ${pole.name} now starts from a position that may be harder to defend if Sunday is dry.`:`${pole.name} combined one-lap pace, circuit fit and track evolution to lead Q3.`,priority:82,subjects:[pole.id,pole.teamId],round:event.round});
    if(expected>8) createStory(universe,{category:'Power Rankings',headline:`A pole that changes the weekend's expected order`,dek:`The model ranked ${pole.name} only ${expected}th on raw expectation. Grid position now creates a genuine upset opportunity without rewriting season-long pace.`,priority:88,subjects:[pole.id],round:event.round});
    return;
  }
  const winner=getDriver(universe,result.winnerId); const team=getTeam(universe,winner.teamId); const winnerRow=result.rows.find((row)=>row.driverId===winner.id);
  const standout=[...result.rows].sort((a,b)=>(b.grid-b.position)-(a.grid-a.position))[0];
  const weather=result.timeline.some((state)=>state!=='Dry');
  createStory(universe,{category:'After the Flag',headline:result.headline,dek:`${team.name} converted ${winnerRow?.grid===1?'pole':`a P${winnerRow?.grid||'—'} start`} into victory. ${weather?'Tyre timing and wet-weather execution were central to the result.':'Race pace, pit timing and tyre life decided the order.'}`,priority:100,subjects:[winner.id,team.id],round:event.round});
  if(standout && standout.grid-standout.position>=5){const d=getDriver(universe,standout.driverId);createStory(universe,{category:'After the Flag',headline:`${d.name} charges from P${standout.grid} to P${standout.position}`,dek:`A ${standout.grid-standout.position}-place gain made this one of the strongest drives relative to starting position. ${standout.tags.join(', ') || 'Clean overtaking and consistent pace did the work.'}`,priority:83,subjects:[d.id],round:event.round});}
  const dnf=result.rows.find((row)=>row.status!=='Running'&&getDriver(universe,row.driverId).rarity==='Generational');
  if(dnf){const d=getDriver(universe,dnf.driverId);createStory(universe,{category:'After the Flag',headline:`Reliability stops ${d.name}, not raw pace`,dek:`The Generational ceiling remains intact, but another lost result can reshape the title fight. Greatness can be delayed by machinery without being erased.`,priority:86,subjects:[d.id,d.teamId],thread:'title-rivalry',round:event.round});}
}

function simulateFeederRound(universe,series,seed){
  const rng=makeRng(seed+series.charCodeAt(1)*271); const drivers=universe.drivers.filter((driver)=>driver.series===series&&driver.role==='Race driver'&&driver.active); const teams=universe.feederTeams[series];
  const rows=drivers.map((driver)=>{const team=teams.find((item)=>item.id===driver.teamId);const experiencePenalty=driver.age<18?2.5:0;const score=driver.baseTalent*careerMultiplier(driver)*.68+(team?.rating||75)*.25+driver.skills.racecraft*.07-experiencePenalty+(rng.next()-.5)*8;return{driverId:driver.id,teamId:driver.teamId,score};}).sort((a,b)=>b.score-a.score);
  const points=series==='FE'?[25,18,15,12,10,8,6,4,2,1]:[25,18,15,12,10,8,6,4,2,1];
  rows.forEach((row,index)=>{row.position=index+1;row.points=points[index]||0;const driver=getDriver(universe,row.driverId);driver.season.points+=row.points;driver.season.wins+=index===0?1:0;driver.season.podiums+=index<3?1:0;driver.season.starts+=1;driver.season.form.push(index+1);driver.season.form=driver.season.form.slice(-5);const team=teams.find((item)=>item.id===row.teamId);if(team){team.points+=row.points;team.wins+=index===0?1:0;}});
  universe.feederResults[series].push({year:universe.year,round:universe.currentRound+1,rows,winnerId:rows[0].driverId});
  return rows;
}

function applyDevelopment(universe,event,rng){
  if(event.round%3!==0) return;
  const candidates=universe.teams.map((team)=>{const tech=teamStaffRating(universe,team,'Technical Director');const test=testDriverContribution(universe,team);const confidence=(team.facilities.aero+team.facilities.simulator+tech+test)/4;const gain=clamp((confidence-70)/68+rng.next()*.62,.05,1.25);const risk=clamp((100-confidence)/180,.03,.22);return{team,gain,failed:rng.chance(risk)};});
  candidates.forEach(({team,gain,failed})=>{
    const dimension=rng.pick(['high','low','straight','tyre','mechanical','energy','reliability','operations']);
    const applied=failed?-gain*.35:gain; team.car[dimension]=clamp(team.car[dimension]+applied,60,99);team.season.development+=applied;
    team.upgrades.push({year:universe.year,round:event.round,dimension,gain:Number(applied.toFixed(2)),status:failed?'Correlation issue':'Successful'});
  });
  const best=[...candidates].sort((a,b)=>b.gain-a.gain)[0];
  createStory(universe,{category:'Technical Notebook',headline:`${best.team.name} brings the strongest development package`,dek:`The upgrade cycle targets the car's ${best.team.upgrades.at(-1).dimension} performance. Wind-tunnel confidence was high, but correlation remains a live risk for every team.`,priority:67,subjects:[best.team.id],thread:'technical-race',round:event.round});
}

function updatePowerRankings(universe,event){
  if(event.round%4!==0) return;
  const ranking=powerRankings(universe,'teams'); const lead=ranking[0];
  createStory(universe,{category:'Power Rankings',headline:`${lead.name} leads the model after Round ${event.round}`,dek:`This is not the constructors' table. The ranking combines recent form, circuit-independent car strength, reliability, strategy and development trajectory.`,priority:64,subjects:[lead.id],round:event.round});
}

function manageInjuriesAndReserves(universe){
  // Restore race drivers when their recovery round is reached.
  universe.drivers.filter((driver)=>driver.role==='Injured'&&driver.injuryUntilRound!==null&&universe.currentRound>=driver.injuryUntilRound).forEach((driver)=>{
    driver.role='Race driver';driver.injuryUntilRound=null;
    const cover=universe.drivers.find((candidate)=>candidate.coveringFor===driver.id);
    if(cover){cover.role='Test driver';cover.coveringFor=null;}
    createStory(universe,{category:'Driver Market',headline:`${driver.name} is cleared to return`,dek:`The regular driver retakes the race seat after the test programme covered the absence.`,priority:61,subjects:[driver.id,driver.teamId],round:universe.currentRound+1});
  });
  universe.drivers.filter((driver)=>driver.role==='Injured'&&driver.injuryUntilRound>universe.currentRound).forEach((driver)=>{
    const existing=universe.drivers.find((candidate)=>candidate.coveringFor===driver.id&&candidate.role==='Race driver');
    if(existing)return;
    const team=getTeam(universe,driver.teamId);
    const cover=(team?.testDriverIds||[]).map((id)=>getDriver(universe,id)).filter((candidate)=>candidate?.active&&candidate.role==='Test driver').sort((a,b)=>observedDriverValue(b)-observedDriverValue(a))[0];
    if(cover){
      cover.role='Race driver';cover.coveringFor=driver.id;cover.rookie=false;
      createStory(universe,{category:'Driver Market',headline:`${cover.name} steps in for ${driver.name}`,dek:`The ${team.name} test driver becomes the emergency race replacement. Strong test drivers therefore provide both development value and competitive insurance.`,priority:79,subjects:[cover.id,driver.id,team.id],round:universe.currentRound+1});
    }
  });
}
function maybeCreateDriverInjury(universe,result,rng){
  if(rng.chance(.9))return;
  const candidates=result.rows.filter((row)=>row.status!=='Running').map((row)=>getDriver(universe,row.driverId)).filter((driver)=>driver?.role==='Race driver');
  const driver=candidates[0]||rng.pick(currentF1Drivers(universe));
  if(!driver)return;
  driver.role='Injured';driver.injuryUntilRound=universe.currentRound+1+rng.int(1,2);
  createStory(universe,{category:'Medical Update',headline:`${driver.name} will miss at least one Grand Prix`,dek:`A minor racing injury opens the door for one of ${getTeam(universe,driver.teamId)?.name}'s test drivers.`,priority:84,subjects:[driver.id,driver.teamId],round:universe.currentRound+1});
}

export function simulateNextSession(sourceUniverse){
  const universe=deepClone(sourceUniverse);
  if(universe.phase==='Season complete') return universe;
  manageInjuriesAndReserves(universe);
  const eventIndex=universe.currentRound;
  const event=ensureWeekend(universe,eventIndex);
  const session=event.sessions[universe.currentSession];
  if(!session) return universe;
  universe.phase='In season';
  const rng=makeRng(event.weekendSeed+universe.year*10007+session.index*997);
  let data;
  if(session.type==='Practice') data=simulatePractice(universe,event,session,rng);
  else if(session.type==='Qualifying'||session.type==='Sprint Qualifying') data=simulateQualifying(universe,event,session,rng);
  else if(session.type==='Sprint') data=simulateRace(universe,event,session,rng,true);
  else data=simulateRace(universe,event,session,rng,false);
  const result={id:`${universe.year}-${event.round}-${session.key}`,year:universe.year,round:event.round,eventId:event.id,sessionKey:session.key,sessionLabel:session.label,weather:session.weather,data};
  universe.sessionResults.push(result); session.status='Complete'; session.resultId=result.id;
  resultStory(universe,event,session,data);
  if(session.type==='Race'){
    universe.raceResults.push(result); event.status='Complete';
    maybeCreateDriverInjury(universe,data,rng);
    ['F2','F3','F4'].forEach((series)=>simulateFeederRound(universe,series,event.weekendSeed+universe.year));
    if(event.round%2===0) simulateFeederRound(universe,'FE',event.weekendSeed+universe.year+57);
    if(event.round%3===0) simulateFeederRound(universe,'WEC',event.weekendSeed+universe.year+91);
    applyDevelopment(universe,event,rng); updatePowerRankings(universe,event);
    universe.currentRound+=1; universe.currentSession=0;
    if(universe.currentRound>=universe.calendar.length){
      universe.phase='Season complete'; universe.currentRound=universe.calendar.length-1; universe.currentSession=event.sessions.length;
      finalizeSeasonAwards(universe);
    }
  } else {
    universe.currentSession+=1;
  }
  return universe;
}

export function simulateWeekend(sourceUniverse){
  let universe=sourceUniverse; const startRound=universe.currentRound; let guard=0;
  while(universe.phase!=='Season complete'&&universe.currentRound===startRound&&guard<8){universe=simulateNextSession(universe);guard+=1;}
  return universe;
}
export function simulateToSeasonEnd(sourceUniverse){
  let universe=sourceUniverse; let guard=0;
  while(universe.phase!=='Season complete'&&guard<180){universe=simulateNextSession(universe);guard+=1;}
  return universe;
}

function awardEntry(type,winner,reason){return{type,winnerId:winner?.id||null,winnerName:winner?.name||'—',reason};}
export function finalizeSeasonAwards(universe){
  if(universe.awards.some((award)=>award.year===universe.year)) return;
  const standings=driverStandings(universe,'F1'); const constructors=constructorStandings(universe); const champion=standings[0]; const teamChampion=constructors[0];
  champion.career.titles+=1; champion.trophies.push(`${universe.year} Formula 1 World Champion`); teamChampion.career.constructorTitles+=1;
  teamChampion.staffIds.map((id)=>getStaff(universe,id)).filter(Boolean).forEach((member)=>{member.titles=(member.titles||0)+1;});
  if(champion.engineerId){const engineer=getStaff(universe,champion.engineerId);if(engineer&&!teamChampion.staffIds.includes(engineer.id))engineer.titles=(engineer.titles||0)+1;}
  const supportChampions=['F2','F3','F4','FE','WEC'].map((series)=>({series,winner:driverStandings(universe,series)[0]})).filter((item)=>item.winner);
  supportChampions.forEach(({series,winner})=>{winner.career.seriesTitles+=1;if(series==='FE')winner.career.feTitles+=1;if(series==='WEC')winner.career.wecTitles+=1;winner.trophies.push(`${universe.year} ${series} Champion`);});
  const performance=[...standings].sort((a,b)=>performanceOverExpected(universe,b)-performanceOverExpected(universe,a));
  const rookies=standings.filter((driver)=>driver.rookie); const qualifier=[...standings].sort((a,b)=>b.season.poles-a.season.poles||b.season.qualifyingPoints-a.season.qualifyingPoints)[0];
  const overtaker=[...standings].sort((a,b)=>b.season.positionsGained-a.season.positionsGained)[0]; const wet=[...standings].sort((a,b)=>b.season.wetScore-a.season.wetScore)[0];
  const pit=[...universe.teams].sort((a,b)=>b.season.pitScore-a.season.pitScore)[0]; const development=[...universe.teams].sort((a,b)=>b.season.development-a.season.development)[0];
  const awards=[
    awardEntry('World Champion',champion,`${champion.season.points} points and ${champion.season.wins} wins`),
    awardEntry('Constructors’ Champion',teamChampion,`${teamChampion.season.points} points`),
    awardEntry('Driver of the Year',performance[0],`${performanceOverExpected(universe,performance[0]).toFixed(1)} performance-over-expected score`),
    awardEntry('Rookie of the Year',rookies[0]||standings.find((d)=>d.age<23),'Best first-year impact'),
    awardEntry('Qualifier of the Year',qualifier,`${qualifier.season.poles} poles`),
    awardEntry('Overtaker of the Year',overtaker,`${overtaker.season.positionsGained} net positions gained`),
    awardEntry('Wet-Weather Driver',wet,`${wet.season.wetScore} wet-weather impact points`),
    awardEntry('Pit Crew Award',pit,'Highest operational pit score'),
    awardEntry('Technical Innovation',development,'Largest successful development gain'),
    ...supportChampions.map(({series,winner})=>awardEntry(`${series} Champion`,winner,`${winner.season.points} points and ${winner.season.wins} wins`)),
  ].map((award)=>({...award,year:universe.year}));
  universe.awards.push(...awards);
  createStory(universe,{category:'Season Review',headline:`${champion.name} is the ${universe.year} World Champion`,dek:`${teamChampion.name} takes the constructors’ crown. The awards model separately recognizes performance relative to machinery, qualifying, overtaking, wet-weather excellence and technical execution.`,priority:110,subjects:[champion.id,teamChampion.id],round:universe.calendar.length});
}

export function performanceOverExpected(universe,driver){
  const team=getTeam(universe,driver.teamId); const teamRank=[...universe.teams].sort((a,b)=>b.baseline-a.baseline).findIndex((item)=>item.id===team?.id)+1; const driverRank=driverStandings(universe,'F1').findIndex((item)=>item.id===driver.id)+1;
  return (teamRank-driverRank)*7+driver.season.positionsGained*.25+driver.season.podiums*2.2-driver.season.dnfs*1.5;
}

export function powerRankings(universe,type='drivers'){
  if(type==='teams') return universe.teams.map((team)=>{
    const form=avg(currentF1Drivers(universe).filter((d)=>d.teamId===team.id).flatMap((d)=>d.season.form.map((p)=>23-p)));
    const staff=avg(team.staffIds.map((id)=>getStaff(universe,id)?.rating||70)); const car=avg(Object.values(team.car)); const score=car*.52+staff*.16+form*.45+team.car.reliability*.12+team.season.development*2;
    return{...team,powerScore:score};
  }).sort((a,b)=>b.powerScore-a.powerScore);
  return currentF1Drivers(universe).map((driver)=>{
    const team=getTeam(universe,driver.teamId); const form=avg(driver.season.form.map((p)=>23-p)); const score=driver.baseTalent*careerMultiplier(driver)*.47+avg(Object.values(driver.skills))*.22+avg(Object.values(team.car))*.22+form*.45+driver.confidence*.09;
    return{...driver,powerScore:score};
  }).sort((a,b)=>b.powerScore-a.powerScore);
}

export function goatScore(universe,driver,mode='F1'){
  const c=driver.career; const rarity=RARITY[driver.rarity]?.legacy||1;
  const f1=c.titles*180+c.f1Wins*12+c.f1Podiums*3.8+c.f1Poles*4+c.f1Points*.12+c.f1Starts*.08;
  const context=(driver.season.positionsGained||0)*.25+(driver.season.wetScore||0)*.35+driver.skills.wet*.15+driver.skills.consistency*.12;
  const cross=c.feTitles*70+c.wecTitles*75+c.leMansWins*48+c.seriesTitles*24;
  const peak=driver.baseTalent*careerMultiplier(driver)*2.4+driver.fame*.7;
  if(mode==='Peak') return (peak+context)*rarity;
  if(mode==='Longevity') return (c.f1Starts*1.2+c.f1Points*.08+c.f1Podiums*3+c.titles*100)*rarity;
  if(mode==='All Motorsport') return (f1+cross+context+peak*.35)*rarity;
  return (f1+context+peak*.35)*rarity;
}
export function goatLeaderboard(universe,mode='F1'){
  return universe.drivers.filter((driver)=>driver.career.f1Starts>0||driver.series==='F1').map((driver)=>({...driver,goat:goatScore(universe,driver,mode)})).sort((a,b)=>b.goat-a.goat);
}

function resetSeasonStats(entity){
  if(entity.season) entity.season={points:0,wins:0,poles:0,podiums:0,starts:0,dnfs:0,bestFinish:null,qualifyingPoints:0,positionsGained:0,wetScore:0,form:[]};
}
function resetTeamSeason(team){team.season={points:0,wins:0,poles:0,podiums:0,dnfs:0,pitScore:0,strategyScore:0,development:0};team.weekendSetup=0;}

function moveDriver(universe,driver,newSeries,newTeamId,role='Race driver'){
  const oldTeam=getTeam(universe,driver.teamId);
  if(oldTeam?.driverIds) oldTeam.driverIds=oldTeam.driverIds.filter((id)=>id!==driver.id);
  if(oldTeam?.reserveIds) oldTeam.reserveIds=oldTeam.reserveIds.filter((id)=>id!==driver.id);
  if(oldTeam?.testDriverIds) oldTeam.testDriverIds=oldTeam.testDriverIds.filter((id)=>id!==driver.id);
  driver.series=newSeries;driver.teamId=newTeamId;driver.role=role;driver.rookie=newSeries==='F1'&&role==='Race driver';
  const newTeam=getTeam(universe,newTeamId);
  if(role==='Race driver'&&newTeam?.driverIds&&!newTeam.driverIds.includes(driver.id))newTeam.driverIds.push(driver.id);
  if(role==='Reserve driver'&&newTeam?.reserveIds&&!newTeam.reserveIds.includes(driver.id))newTeam.reserveIds.push(driver.id);
  if(role==='Test driver'&&newTeam?.testDriverIds&&!newTeam.testDriverIds.includes(driver.id))newTeam.testDriverIds.push(driver.id);
}
function retireDriver(universe,driver,reason='Retired'){
  const team=getTeam(universe,driver.teamId);
  if(team?.driverIds)team.driverIds=team.driverIds.filter((id)=>id!==driver.id);
  if(team?.reserveIds)team.reserveIds=team.reserveIds.filter((id)=>id!==driver.id);
  if(team?.testDriverIds)team.testDriverIds=team.testDriverIds.filter((id)=>id!==driver.id);
  driver.active=false;driver.role='Retired';driver.retirementReason=reason;driver.retiredYear=universe.year;
}
function rosterCapacity(series){return series==='WEC'?3:2;}
function clearSeriesSeat(universe,series,team,rng){
  const capacity=rosterCapacity(series);
  const roster=universe.drivers.filter((d)=>d.active&&d.series===series&&d.role==='Race driver'&&d.teamId===team.id);
  if(roster.length<capacity)return;
  const displaced=[...roster].sort((a,b)=>(a.baseTalent+a.season.points*.05)-(b.baseTalent+b.season.points*.05))[0];
  if(series==='FE'&&rng.chance(.28)){
    const wec=universe.feederTeams.WEC[rng.int(0,universe.feederTeams.WEC.length-1)];
    clearSeriesSeat(universe,'WEC',wec,rng);moveDriver(universe,displaced,'WEC',wec.id);
  }else retireDriver(universe,displaced,`${series} seat lost`);
}
function candidateScore(universe,prospect,team){
  // Teams can observe present performance, experience, salary and commercial impact.
  // Rarity and the future career curve are intentionally excluded from AI recruitment.
  const financial=team.finances.vulnerable||team.finances.projectedBalance<0||team.finances.cash<170;
  const academy=prospect.academy===team.id?8:0;
  const visible=observedDriverValue(prospect);
  const results=prospect.season.points*.12+prospect.season.wins*2.5+prospect.season.podiums*.9;
  const costPenalty=Math.max(0,(prospect.contract?.salary||0)-18)*.18;
  const commercial=financial?(prospect.commercial*.22+sponsorFit(universe,team,prospect)*.18):(prospect.commercial*.07+sponsorFit(universe,team,prospect)*.05);
  return visible*.72+results+commercial+academy-costPenalty;
}
function seatMarket(universe,rng){
  const standings=driverStandings(universe,'F1'); const f2=driverStandings(universe,'F2'); const replaceCount=rng.chance(.45)?2:1;
  const outgoing=[...standings].reverse().filter((d)=>d.age>27||d.season.points<10||d.contract.through<=universe.year).slice(0,replaceCount);
  const used=new Set();
  outgoing.forEach((driver,index)=>{
    const seatTeam=getTeam(universe,driver.teamId);
    const prospect=[...f2].filter((candidate)=>!used.has(candidate.id)).sort((a,b)=>candidateScore(universe,b,seatTeam)-candidateScore(universe,a,seatTeam))[0];
    if(!prospect)return;used.add(prospect.id);
    const careerRoll=rng.next();
    if(careerRoll<.17){
      moveDriver(universe,driver,'F1',seatTeam.id,'Reserve driver');driver.contract={through:universe.year+1,salary:Math.max(2,Math.round(driver.contract.salary*.35)),status:'Reserve'};
    }else{
      const destination=careerRoll<.62?'FE':'WEC'; const destTeams=universe.feederTeams[destination];
      const destTeam=[...destTeams].sort((a,b)=>universe.drivers.filter((d)=>d.active&&d.series===destination&&d.teamId===a.id).length-universe.drivers.filter((d)=>d.active&&d.series===destination&&d.teamId===b.id).length)[0];
      clearSeriesSeat(universe,destination,destTeam,rng);moveDriver(universe,driver,destination,destTeam.id);driver.fame+=8;
    }
    moveDriver(universe,prospect,'F1',seatTeam.id);prospect.contract={through:universe.year+2,salary:Math.round(prospect.baseTalent**2/340),status:'Signed'};prospect.confidence=72;
    createStory(universe,{category:'Driver Market',headline:`${prospect.name} earns the ${seatTeam.name} seat`,dek:`${driver.name} leaves the race seat. The decision uses visible pace, results, academy knowledge, salary and sponsor value. The team does not know the driver's hidden rarity or future career curve.`,priority:91,subjects:[prospect.id,driver.id,seatTeam.id],round:0});
  });
  const f3=driverStandings(universe,'F3').slice(0,2); const f2Bottom=driverStandings(universe,'F2').slice(-2);
  f3.forEach((driver,index)=>{const target=f2Bottom[index];if(!target)return;const teamId=target.teamId;const feTeam=universe.feederTeams.FE[(index+3)%universe.feederTeams.FE.length];clearSeriesSeat(universe,'FE',feTeam,rng);moveDriver(universe,target,'FE',feTeam.id);moveDriver(universe,driver,'F2',teamId);});
  const f4=driverStandings(universe,'F4').slice(0,3); const f3Bottom=driverStandings(universe,'F3').slice(-3);
  f4.forEach((driver,index)=>{const target=f3Bottom[index];if(!target)return;const teamId=target.teamId;moveDriver(universe,target,'FREE',null,'Free agent');target.contract.status='Available';moveDriver(universe,driver,'F3',teamId);});
}
function addNewProspects(universe,rng){
  const existingGen=universe.drivers.some((driver)=>driver.active&&['F2','F3','F4'].includes(driver.series)&&driver.rarity==='Generational');
  universe.feederTeams.F4.forEach((team)=>{
    const roster=universe.drivers.filter((driver)=>driver.active&&driver.series==='F4'&&driver.role==='Race driver'&&driver.teamId===team.id);
    while(roster.length<2){
      const roll=rng.next();let rarity='Common';
      if(!existingGen&&roll>.965)rarity='Generational';else if(roll>.91)rarity='Legend';else if(roll>.71)rarity='Epic';else if(roll>.38)rarity='Rare';else if(roll>.13)rarity='Uncommon';
      const id=`f4-rookie-${universe.year}-${team.id}-${roster.length}-${rng.int(100,999)}`;
      const academyTeam=universe.teams[rng.int(0,universe.teams.length-1)];
      const rookie=createProceduralDriver({seed:universe.seed+universe.year*10007+idNumber(id),id,series:'F4',teamId:team.id,seat:roster.length+1,rarity,age:rng.int(15,17),academy:rng.chance(.58)?academyTeam.id:null});
      universe.drivers.push(rookie);team.driverIds.push(rookie.id);roster.push(rookie);
      if(rookie.academy)academyTeam.academyIds.push(rookie.id);
      if(['Generational','Legend'].includes(rarity))createStory(universe,{category:'Prospect Watch',headline:`${rookie.name} enters F4 with a ${rarity} ceiling`,dek:`At ${rookie.age}, the driver is still several categories from F1. Every promotion, setback and team decision will remain visible in the career history.`,priority:rarity==='Generational'?99:80,subjects:[rookie.id],thread:'famous-rookie',round:0});
    }
  });
}
function fillAllSeriesSeats(universe,rng){
  // F1: teams assess only visible present value. Test drivers are legitimate emergency and promotion candidates.
  universe.teams.forEach((team)=>{
    let roster=universe.drivers.filter((driver)=>driver.active&&driver.series==='F1'&&driver.role==='Race driver'&&driver.teamId===team.id);
    while(roster.length<2){
      const tests=(team.testDriverIds||[]).map((id)=>getDriver(universe,id)).filter((driver)=>driver?.active&&driver.role==='Test driver').sort((a,b)=>observedDriverValue(b)-observedDriverValue(a));
      const prospect=driverStandings(universe,'F2').sort((a,b)=>candidateScore(universe,b,team)-candidateScore(universe,a,team))[0];
      const free=universe.drivers.filter((driver)=>driver.active&&driver.role==='Free agent').sort((a,b)=>observedDriverValue(b)-observedDriverValue(a))[0];
      const alternative=universe.drivers.filter((driver)=>driver.active&&['FE','WEC'].includes(driver.series)&&driver.role==='Race driver').sort((a,b)=>observedDriverValue(b)-observedDriverValue(a))[0];
      const candidate=tests[0]||prospect||free||alternative;
      if(!candidate)break;
      const sourceSeries=candidate.series;const sourceRole=candidate.role;
      moveDriver(universe,candidate,'F1',team.id,'Race driver');
      candidate.contract={through:universe.year+2,salary:Math.round(observedDriverValue(candidate)**2/355),status:'Signed'};
      candidate.confidence=68;roster.push(candidate);
      createStory(universe,{category:'Driver Market',headline:`${candidate.name} fills the open ${team.name} seat`,dek:`The selection comes from ${sourceRole==='Test driver'?'the constructor test programme':['FE','WEC'].includes(sourceSeries)?sourceSeries:sourceRole==='Free agent'?'the open market':'the feeder ladder'} and is based on visible current value rather than hidden potential.`,priority:74,subjects:[candidate.id,team.id],round:0});
    }
  });

  // F2 draws from F3.
  universe.feederTeams.F2.forEach((team)=>{
    let roster=universe.drivers.filter((driver)=>driver.active&&driver.series==='F2'&&driver.role==='Race driver'&&driver.teamId===team.id);
    while(roster.length<2){
      const candidate=driverStandings(universe,'F3')[0];if(!candidate)break;
      moveDriver(universe,candidate,'F2',team.id);roster.push(candidate);
    }
  });
  // F3 draws from F4.
  universe.feederTeams.F3.forEach((team)=>{
    let roster=universe.drivers.filter((driver)=>driver.active&&driver.series==='F3'&&driver.role==='Race driver'&&driver.teamId===team.id);
    while(roster.length<2){
      const candidate=driverStandings(universe,'F4')[0];if(!candidate)break;
      moveDriver(universe,candidate,'F3',team.id);roster.push(candidate);
    }
  });
  // F4 is the procedural entry point.
  universe.feederTeams.F4.forEach((team)=>{
    let roster=universe.drivers.filter((driver)=>driver.active&&driver.series==='F4'&&driver.role==='Race driver'&&driver.teamId===team.id);
    while(roster.length<2){
      const roll=rng.next();const rarity=roll>.97?'Generational':roll>.91?'Legend':roll>.72?'Epic':roll>.39?'Rare':roll>.14?'Uncommon':'Common';
      const id=`f4-arrival-${universe.year}-${team.id}-${roster.length}-${rng.int(100,999)}`;
      const arrival=createProceduralDriver({seed:universe.seed+universe.year*19001+idNumber(id),id,series:'F4',teamId:team.id,seat:roster.length+1,rarity,age:rng.int(15,17)});
      universe.drivers.push(arrival);team.driverIds.push(arrival.id);roster.push(arrival);
    }
  });

  ['FE','WEC'].forEach((series)=>{
    universe.feederTeams[series].forEach((team)=>{
      const capacity=rosterCapacity(series);let roster=universe.drivers.filter((driver)=>driver.active&&driver.series===series&&driver.role==='Race driver'&&driver.teamId===team.id);
      while(roster.length<capacity){
        const free=universe.drivers.filter((driver)=>driver.active&&driver.role==='Free agent').sort((a,b)=>observedDriverValue(b)-observedDriverValue(a))[0];
        if(free){moveDriver(universe,free,series,team.id);roster.push(free);continue;}
        const roll=rng.next();const rarity=roll>.9?'Legend':roll>.62?'Epic':roll>.25?'Rare':'Uncommon';
        const id=`${series.toLowerCase()}-arrival-${universe.year}-${team.id}-${roster.length}-${rng.int(100,999)}`;
        const arrival=createProceduralDriver({seed:universe.seed+universe.year*17011+idNumber(id),id,series,teamId:team.id,seat:roster.length+1,rarity,age:rng.int(23,35)});
        universe.drivers.push(arrival);team.driverIds.push(arrival.id);roster.push(arrival);
      }
    });
  });

  // Maintain two dedicated test drivers for every F1 constructor.
  universe.teams.forEach((team)=>{
    let tests=(team.testDriverIds||[]).map((id)=>getDriver(universe,id)).filter((driver)=>driver?.active&&driver.role==='Test driver');
    while(tests.length<2){
      const id=`test-arrival-${universe.year}-${team.id}-${tests.length}-${rng.int(100,999)}`;
      const test=createProceduralDriver({seed:universe.seed+universe.year*23003+idNumber(id),id,series:'F1',teamId:team.id,seat:0,rarity:rng.chance(.24)?'Rare':'Uncommon',age:rng.int(21,34),academy:team.id,role:'Test driver'});
      test.role='Test driver';test.isEmergencyReserve=true;test.contract.salary=Math.max(2,Math.round(test.contract.salary*.32));
      universe.drivers.push(test);team.testDriverIds=team.testDriverIds||[];team.testDriverIds.push(test.id);tests.push(test);
    }
  });
}

function snapshotDriverSeasons(universe){
  const snapshots=new Map();
  Object.keys(universe.feederTeams).concat('F1').forEach((series)=>{
    driverStandings(universe,series).forEach((driver,index)=>snapshots.set(driver.id,{year:universe.year,series,teamId:driver.teamId,points:driver.season.points,wins:driver.season.wins,podiums:driver.season.podiums,position:index+1}));
  });
  return snapshots;
}
function ageArchiveAndRetire(universe,rng,snapshots){
  universe.drivers.forEach((driver)=>{
    const snapshot=snapshots.get(driver.id);if(snapshot)driver.career.seasons.push(snapshot);
    driver.age+=1;driver.curveIndex=Math.min(driver.curveIndex+1,driver.careerCurve.length-1);driver.careerMultiplier=driver.careerCurve[driver.curveIndex]||driver.careerMultiplier;driver.annualForm=Number((.97+rng.next()*.06).toFixed(3));driver.confidence=clamp(driver.confidence*.86+60*.14,35,92);resetSeasonStats(driver);
    const naturalEnd=driver.age>=driver.debutAge+driver.careerLength;const ageLimit=driver.age>42||(driver.series==='F4'&&driver.age>20)||(driver.series==='F3'&&driver.age>23)||(driver.series==='F2'&&driver.age>26);
    if(driver.active&&(naturalEnd||ageLimit)&&rng.chance(naturalEnd?.68:.45))retireDriver(universe,driver,'Career completed');
  });
}

function updateCalendar(universe,rng){
  if(universe.settings.calendarChurn==='Locked') return;
  const probability=universe.settings.calendarChurn==='Aggressive'?.78:.38;
  if(!rng.chance(probability)) return;
  const removable=universe.calendar.filter((event)=>event.protected<70&&event.class!=='Protected classic').sort((a,b)=>a.protected-b.protected);
  const reserves=universe.circuitPool.filter((event)=>event.reserve&&!universe.calendar.some((active)=>active.id===event.id));
  if(!removable.length||!reserves.length)return;
  const outgoing=rng.pick(removable.slice(0,Math.min(6,removable.length))); const incoming=rng.pick(reserves);
  const index=universe.calendar.findIndex((event)=>event.id===outgoing.id); universe.calendar[index]={...incoming,reserve:false,round:index+1,status:'Upcoming',sessions:[],weekendSeed:universe.seed+universe.year*100+index*1009,contract:universe.year+rng.int(3,6)};
  createStory(universe,{category:'Calendar',headline:`${incoming.country} replaces ${outgoing.country} on the ${universe.year} calendar`,dek:`The championship makes one controlled change. Protected classics remain untouched, while commercial value, facilities, race quality and geographic strategy shaped the decision.`,priority:89,subjects:[incoming.id,outgoing.id],thread:'calendar-evolution',round:0});
}

function updateTeamsAndSponsors(universe,rng){
  const lastConstructors=new Map((universe.teams||[]).map((team)=>[team.id,team.career.seasons.at(-1)?.position||universe.teams.length]));
  universe.teams.forEach((team)=>{
    const tech=teamStaffRating(universe,team,'Technical Director');
    const facility=avg(Object.values(team.facilities));
    const test=testDriverContribution(universe,team);
    const reset=universe.year%4===0?.52:.18;
    Object.keys(team.car).forEach((key)=>{
      const target=tech*.31+facility*.29+test*.12+(getEngine(universe,team.engineId)?.trajectory||84)*.28;
      team.car[key]=clamp(team.car[key]*(1-reset)+target*reset+(rng.next()-.5)*2.8,62,98);
    });
    team.baseline=avg(Object.values(team.car));

    const brand=getMainBrand(universe,team.mainBrandId)||MAIN_BRANDS[0];
    const principal=teamPrincipal(universe,team);
    const raceDrivers=universe.drivers.filter((driver)=>driver.active&&driver.teamId===team.id&&driver.role==='Race driver');
    const testDrivers=(team.testDriverIds||[]).map((id)=>getDriver(universe,id)).filter(Boolean);
    const secondary=(team.sponsorIds||[]).map((id)=>getSponsor(universe,id)).filter(Boolean);
    const countryBonus=secondary.reduce((sum,sponsor)=>sum+(raceDrivers.some((driver)=>driver.country===sponsor.country)?sponsor.value*.22:0),0);
    const dealMultiplier=.72+(principal?.commercial||72)/240;
    const secondaryIncome=Math.round(secondary.reduce((sum,sponsor)=>sum+sponsor.value,0)*dealMultiplier+countryBonus);
    const position=lastConstructors.get(team.id)||universe.teams.length;
    const prizeMoney=Math.round(170-(position-1)*11+team.heritage*.28);
    const driverCost=[...raceDrivers,...testDrivers].reduce((sum,driver)=>sum+(driver.contract?.salary||0),0);
    const staffCost=(team.staffIds||[]).map((id)=>getStaff(universe,id)).filter(Boolean).reduce((sum,member)=>sum+(member.salary||8),0);
    const developmentCost=Math.round(70+avg(Object.values(team.facilities))*.75+Math.max(0,team.baseline-75)*2.2);
    const mainFunding=brand.funding;
    const projectedBalance=mainFunding+secondaryIncome+prizeMoney-driverCost-staffCost-team.finances.engineCost-developmentCost;

    team.finances.mainFunding=mainFunding;
    team.finances.secondarySponsorIncome=secondaryIncome;
    team.finances.sponsorIncome=mainFunding+secondaryIncome;
    team.finances.prizeMoney=prizeMoney;
    team.finances.driverCost=driverCost;
    team.finances.staffCost=staffCost;
    team.finances.developmentCost=developmentCost;
    team.finances.dealQuality=principal?.commercial||72;
    team.finances.projectedBalance=Math.round(projectedBalance);
    team.finances.cash=Math.round(team.finances.cash+projectedBalance*.34);
    team.finances.vulnerable=!brand.protected&&(team.finances.cash<145||projectedBalance<-45);

    resetTeamSeason(team);team.upgrades=[];

    // Secondary partners can rotate. Driver nationality increases access, while the team principal determines deal quality.
    if(rng.chance(.18)){
      const currentIds=new Set(team.sponsorIds||[]);
      const candidates=universe.sponsors.filter((sponsor)=>!currentIds.has(sponsor.id));
      const ranked=candidates.map((sponsor)=>{
        const national=raceDrivers.some((driver)=>driver.country===sponsor.country)?32:0;
        return {sponsor,score:sponsor.value+national+rng.next()*16};
      }).sort((a,b)=>b.score-a.score);
      const next=ranked[0]?.sponsor;
      if(next){
        const replaceIndex=rng.int(0,Math.max(0,(team.sponsorIds||[]).length-1));
        const oldId=team.sponsorIds[replaceIndex];team.sponsorIds[replaceIndex]=next.id;
        createStory(universe,{category:'Business',headline:`${next.name} joins ${team.name}`,dek:`The ${next.country} partner was attracted by the team's commercial leadership${raceDrivers.some((driver)=>driver.country===next.country)?` and its ${next.country} driver connection`:''}. It becomes a secondary partner; ${brand.name} remains the constructor's main identity.`,priority:68,subjects:[team.id,next.id,oldId],thread:'commercial-arms-race',round:0});
      }
    }
  });

  // Occasional power-unit market.
  if(rng.chance(.16)){
    const eligible=universe.teams.filter((team)=>team.mainBrandId!=='ferrari'&&team.mainBrandId!=='mercedes'&&team.mainBrandId!=='audi'&&team.heritage<94);
    const team=rng.pick(eligible);const options=universe.engines.filter((engine)=>engine.id!==team.engineId);
    const next=[...options].sort((a,b)=>(b.trajectory+b.reliability)-(a.trajectory+a.reliability))[rng.int(0,Math.min(2,options.length-1))];
    if(team&&next){
      const old=getEngine(universe,team.engineId);team.engineId=next.id;
      team.lineage.push({year:universe.year,name:team.name,owner:team.owner,mainBrandId:team.mainBrandId,engineId:next.id,previousEngine:old?.name});
      createStory(universe,{category:'Technical Notebook',headline:`${team.name} signs a ${next.name} power-unit deal`,dek:`The switch trades current integration knowledge for a different mix of peak power, efficiency, reliability, packaging and development trajectory.`,priority:72,subjects:[team.id,next.id],thread:'technical-race',round:0});
    }
  }

  // A grid identity changes only occasionally and only one slot can change in an off-season.
  const changeWindow=(universe.year-2026)%3===0||rng.chance(.09);
  const vulnerable=universe.teams.filter((team)=>{
    const brand=getMainBrand(universe,team.mainBrandId);
    return !brand?.protected&&(team.finances.vulnerable||team.finances.cash<120);
  }).sort((a,b)=>a.finances.cash-b.finances.cash)[0];
  if(changeWindow&&vulnerable&&universe.settings.teamDynamism!=='Static'&&rng.chance(.58)){
    const activeBrands=new Set(universe.teams.map((team)=>team.mainBrandId));
    const candidates=(universe.mainBrands||MAIN_BRANDS).filter((brand)=>!activeBrands.has(brand.id));
    const incoming=rng.pick(candidates);
    if(incoming){
      const oldName=vulnerable.name;const oldBrand=getMainBrand(universe,vulnerable.mainBrandId);
      vulnerable.mainBrandId=incoming.id;vulnerable.mainBrandName=incoming.name;
      vulnerable.owner=incoming.name;vulnerable.name=`${incoming.name} Formula Racing`;vulnerable.commercialName=vulnerable.name;
      vulnerable.primary=incoming.colors[0];vulnerable.secondary=incoming.colors[1];
      vulnerable.stability=incoming.type==='Automotive'?'Manufacturer works':'Commercial brand';
      vulnerable.heritage=Math.max(38,Math.round(vulnerable.heritage*.72));
      vulnerable.finances.mainFunding=incoming.funding;vulnerable.finances.annualBudget=incoming.funding;
      vulnerable.finances.cash+=Math.round(incoming.funding*.48);
      vulnerable.finances.vulnerable=false;
      vulnerable.lineage.push({year:universe.year,name:vulnerable.name,owner:incoming.name,mainBrandId:incoming.id,engineId:vulnerable.engineId,previous:oldName});
      vulnerable.liveryHistory.push({year:universe.year,primary:vulnerable.primary,secondary:vulnerable.secondary,titleSponsor:incoming.name,note:`Acquired ${oldBrand?.name||oldName} grid slot`});
      createStory(universe,{category:'Business',headline:`${incoming.name} acquires the ${oldName} grid slot`,dek:`The constructor lineage remains continuous, but the main brand, funding level and livery change. ${incoming.tier} backing gives the project ${incoming.funding}m in annual core funding.`,priority:100,subjects:[vulnerable.id,incoming.id],thread:'team-survival',round:0});
    }
  }
}

function updateStaffMarket(universe,rng){
  if(!rng.chance(.52))return;
  const ordered=[...universe.teams].sort((a,b)=>b.baseline-a.baseline);
  const hiring=rng.pick(ordered.slice(0,4));const source=rng.pick(ordered.slice(-5));
  const candidates=source.staffIds.map((id)=>getStaff(universe,id)).filter((member)=>member&&member.role!=='Race Engineer'&&member.ambition>62).sort((a,b)=>b.rating-a.rating);
  const recruit=candidates[0];if(!recruit)return;
  const incumbent=hiring.staffIds.map((id)=>getStaff(universe,id)).filter((member)=>member?.role===recruit.role).sort((a,b)=>a.rating-b.rating)[0];if(!incumbent)return;
  source.staffIds=source.staffIds.filter((id)=>id!==recruit.id);hiring.staffIds=hiring.staffIds.filter((id)=>id!==incumbent.id);
  source.staffIds.push(incumbent.id);hiring.staffIds.push(recruit.id);
  recruit.history.push({year:universe.year,teamId:recruit.teamId,role:recruit.role});incumbent.history.push({year:universe.year,teamId:incumbent.teamId,role:incumbent.role});
  const oldSource=recruit.teamId;recruit.teamId=hiring.id;incumbent.teamId=source.id;recruit.contractThrough=universe.year+rng.int(3,5);incumbent.contractThrough=universe.year+rng.int(1,3);
  createStory(universe,{category:'Driver Market',headline:`${hiring.name} poaches ${recruit.name} from ${source.name}`,dek:`The ${recruit.role.toLowerCase()} will complete a negotiated transition rather than an instant move. Staff rarity, ambition, specialty and organizational chemistry now reshape the technical order.`,priority:76,subjects:[hiring.id,source.id,recruit.id,oldSource],round:0});
}

export function advanceToNextSeason(sourceUniverse){
  const universe=deepClone(sourceUniverse); if(universe.phase!=='Season complete')return universe;
  finalizeSeasonAwards(universe);
  const standings=driverStandings(universe,'F1'); const constructors=constructorStandings(universe); const champion=standings[0]; const constructor=constructors[0];
  universe.teams.forEach((team)=>{const place=constructors.findIndex((item)=>item.id===team.id)+1;team.career.seasons.push({year:universe.year,position:place,points:team.season.points,wins:team.season.wins,podiums:team.season.podiums,poles:team.season.poles,engineId:team.engineId,name:team.name});});
  const compressedRaces=universe.raceResults.map((result)=>({eventId:result.eventId,round:result.round,winnerId:result.data.winnerId,winnerName:getDriver(universe,result.data.winnerId)?.name||'—',podium:result.data.rows.slice(0,3).map((row)=>({driverId:row.driverId,driverName:getDriver(universe,row.driverId)?.name||'—',teamId:row.teamId})),weather:[...new Set(result.data.timeline||[])],safetyCar:Boolean(result.data.safetyCar),virtualSafetyCar:Boolean(result.data.virtualSafetyCar),redFlag:Boolean(result.data.redFlag),fastestLapDriverId:result.data.fastestLapDriverId||null}));
  const seriesArchive={};
  ['F1','F2','F3','F4','FE','WEC'].forEach((series)=>{
    const table=driverStandings(universe,series);
    const teamTable=series==='F1'?constructors:(universe.feederTeams[series]||[]).map((team)=>({...team,seasonPoints:team.points||0,seasonWins:team.wins||0})).sort((a,b)=>b.seasonPoints-a.seasonPoints||b.seasonWins-a.seasonWins);
    seriesArchive[series]={
      championId:table[0]?.id||null,championName:table[0]?.name||'—',
      teamChampionId:teamTable[0]?.id||null,teamChampionName:teamTable[0]?.name||'—',
      standings:table.slice(0,12).map((driver)=>({id:driver.id,name:driver.name,teamId:driver.teamId,points:driver.season.points,wins:driver.season.wins,podiums:driver.season.podiums})),
      teams:teamTable.slice(0,12).map((team)=>({id:team.id,name:team.name,points:team.seasonPoints||0,wins:team.seasonWins||0})),
    };
  });
  universe.seasonArchive.push({year:universe.year,championId:champion.id,championName:champion.name,constructorId:constructor.id,constructorName:constructor.name,standings:seriesArchive.F1.standings,constructors:seriesArchive.F1.teams,series:seriesArchive,calendar:universe.calendar.map((event)=>event.id),races:compressedRaces,awards:universe.awards.filter((award)=>award.year===universe.year),stories:universe.stories.filter((story)=>story.year===universe.year).slice(0,16)});
  const rng=makeRng(universe.seed+universe.year*7919);
  const snapshots=snapshotDriverSeasons(universe);
  currentF1Drivers(universe).forEach((driver)=>{driver.rookie=false;});
  seatMarket(universe,rng);
  ageArchiveAndRetire(universe,rng,snapshots);
  addNewProspects(universe,rng);
  fillAllSeriesSeats(universe,rng);
  universe.year+=1;universe.seasonIndex+=1;
  updateTeamsAndSponsors(universe,rng); updateStaffMarket(universe,rng); updateCalendar(universe,rng);
  Object.values(universe.feederTeams).flat().forEach((team)=>{team.points=0;team.wins=0;});
  universe.calendar=universe.calendar.map((event,index)=>({...event,round:index+1,status:'Upcoming',sessions:[],weekendSeed:universe.seed+universe.year*101+index*1009}));
  universe.currentRound=0;universe.currentSession=0;universe.phase='Pre-season';universe.sessionResults=[];universe.raceResults=[];universe.feederResults={F2:[],F3:[],F4:[],FE:[],WEC:[]};
  createStory(universe,{category:'Pre-season',headline:`The ${universe.year} grid returns with a changed competitive order`,dek:`Regulation carry-over, staff quality, facilities, engine trajectories and winter correlation have reset the margins without making last year's quality irrelevant.`,priority:100,round:0,thread:'technical-race'});
  return universe;
}

export function currentWeekend(universe){const copy=deepClone(universe);ensureWeekend(copy,Math.min(copy.currentRound,copy.calendar.length-1));return copy.calendar[Math.min(copy.currentRound,copy.calendar.length-1)];}

export function circuitFitRanking(universe,event){
  return universe.teams.map((team)=>({...team,fitScore:carFit(universe,team,event,'race')})).sort((a,b)=>b.fitScore-a.fitScore);
}

export function sponsorFit(universe,team,driver){
  const sponsors=(team.sponsorIds||[]).map((id)=>getSponsor(universe,id)).filter(Boolean);
  const country=COUNTRIES.find((item)=>item.name===driver.country);
  const nationality=sponsors.some((sponsor)=>sponsor.country===driver.country)?22:0;
  const brand=getMainBrand(universe,team.mainBrandId);
  const brandLink=brand?.country===driver.country?8:0;
  const market=(country?.market||50)*.22;
  return clamp(driver.commercial*.52+market+nationality+brandLink,0,100);
}
