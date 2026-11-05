// Lap-by-lap race engine shared by Formula 1 and the support series.
//
// All cars run together and keep a cumulative race time. Every lap each car
// gets a lap time from its pace, tyre and the track state. The cars are then
// resolved front to back: a car that catches the car ahead must pass it on
// track, and the chance of that pass depends on pace, the circuit, racecraft
// and tyres. Pit stops, Safety Cars, VSCs and red flags all happen on the lap
// they are triggered, so the stored lap snapshots are the actual race.
//
// The engine only uses the rng it is given, so seeded runs stay deterministic.

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const round1=(value)=>Math.round(value*10)/10;

export const COMPOUNDS={
  Soft:{code:'S',offset:-.55,deg:.072,life:22,kind:'slick'},
  Medium:{code:'M',offset:0,deg:.046,life:33,kind:'slick'},
  Hard:{code:'H',offset:.42,deg:.029,life:48,kind:'slick'},
  Intermediate:{code:'I',offset:0,deg:.04,life:40,kind:'inter'},
  Wet:{code:'W',offset:0,deg:.03,life:50,kind:'wet'},
};
export const TYRE_BY_CODE={S:'Soft',M:'Medium',H:'Hard',I:'Intermediate',W:'Wet'};
const TRACK_OFFSET={Dry:0,Damp:4.2,Wet:8.5};
const PASS_RANGE=1.0;

function idealKind(track){return track==='Wet'?'wet':track==='Damp'?'inter':'slick';}
function wrongTyrePenalty(track,compound){
  const kind=COMPOUNDS[compound]?.kind||'slick';
  if(track==='Dry')return kind==='slick'?0:kind==='inter'?2.6:5.2;
  if(track==='Damp')return kind==='slick'?3.4:kind==='inter'?0:1.3;
  return kind==='slick'?8.5:kind==='inter'?1.9:0;
}
function compoundForKind(kind){return kind==='wet'?'Wet':kind==='inter'?'Intermediate':'Medium';}

// Which laps get a stored snapshot. Long races keep every lap at the start and
// the finish and every second lap in between, to keep saves small.
export function snapshotPolicy(laps,{everyLapUpTo=60,edge=5,middleStep=2}={}){
  if(laps<=everyLapUpTo)return()=>true;
  return(lap)=>lap<=edge||lap>laps-edge||lap%middleStep===0;
}

/**
 * entrants: [{id,name,teamId,grid,pace:[per segment],noiseAmp,racecraft,defence,
 *   composure,tyreSkill,startDelta,strategy,pitCrew,reliabilityRisk,incidentBase,
 *   aggressive,startCompound,attackBonus,defenceBonus}]
 */
export function runLapRace({
  entrants,laps,timeline,rng,traits={},lapBase=90,paceScale=.12,isSprint=false,
  mandatoryStop=false,allowDryStops=true,pitLossBase=20.5,stepLaps=1,
  snapshotEvery=null,redFlagAllowed=true,teamOrderLap=null,teamOrders=null,
  maxMoments=150,incidentScale=1,temperature=24,
}){
  const segments=timeline.length;
  const segOf=(lap)=>clamp(Math.floor((Math.max(1,lap)-1)*segments/laps),0,segments-1);
  const overtakeTrait=traits.overtake??60;
  const tyreTrait=traits.tyre??70;
  const heat=Math.max(0,(temperature||24)-30)*.03;
  const policy=snapshotEvery||snapshotPolicy(laps);
  const moments=[];
  const events=[];
  const snapshots=[];
  let overtakes=0,failedAttacks=0,contacts=0;
  const flags={safetyCar:false,virtualSafetyCar:false,redFlag:false};
  let scLeft=0,vscLeft=0,restartNext=false,redThisLap=false;
  let fastest={id:null,time:Infinity,lap:null};

  const states=entrants.map((e,index)=>{
    const compound=e.startCompound||'Medium';
    return{
      e,id:e.id,teamId:e.teamId,grid:e.grid??index+1,cum:0,newCum:0,lt:0,expected:0,
      compound,tyreAge:0,pits:0,status:'Running',lapsDone:0,stints:[],stintStart:1,
      usedDry:new Set(COMPOUNDS[compound].kind==='slick'?[compound]:[]),metRule:COMPOUNDS[compound].kind!=='slick',
      switchAt:null,switchKind:null,tags:[],events:[],penalty:0,pitted:false,lastPitLap:-9,
      best:Infinity,bestLap:null,overtakes:0,watch:null,paceSum:0,paceLaps:0,
      pitThreshold:clamp(1.25+((e.strategy||75)-75)/55+(rng.next()-.5)*.5,.85,2.2),
      degFactor:clamp(1+(tyreTrait-(e.tyreSkill||80))/100,.6,1.5)*(1+heat),
    };
  });
  const byId=new Map(states.map((s)=>[s.id,s]));
  const name=(id)=>byId.get(id)?.e?.name||'A driver';
  const pushMoment=(m)=>{moments.push(m);};
  const pushEvent=(state,lap,type,text)=>{const item={lap,type,text};state?.events.push(item);events.push(item);};

  // ---- Start: launch skill reshuffles the grid before turn one.
  const gridOrder=[...states].sort((a,b)=>a.grid-b.grid);
  gridOrder.forEach((s,index)=>{s.cum=index*.2;});
  recordSnapshot(0,'green',timeline[0],gridOrder);
  const launch=gridOrder.map((s,index)=>({s,key:index-(s.e.startDelta||0)+(rng.next()-.5)*.8}));
  launch.sort((a,b)=>a.key-b.key);
  launch.forEach(({s},index)=>{s.cum=index*.42;});

  const running=()=>states.filter((s)=>s.status==='Running');
  const ordered=()=>[...running().sort((a,b)=>a.cum-b.cum),...states.filter((s)=>s.status!=='Running').sort((a,b)=>b.lapsDone-a.lapsDone||a.cum-b.cum)];

  function recordSnapshot(lap,flag,track,orderList){
    const list=orderList||ordered();
    const leader=list.find((s)=>s.status==='Running')||list[0];
    let prev=null;
    snapshots.push({lap:lap*stepLaps,flag,track,order:list.map((s)=>{
      const out=s.status!=='Running';
      const entry={driverId:s.id,gap:out?null:round1(s.cum-leader.cum),interval:out||!prev?null:round1(s.cum-prev.cum),tyre:COMPOUNDS[s.compound].code,tyreAge:s.tyreAge*stepLaps,pits:s.pits,status:out?'out':(s.pitted&&lap>0?'pit':'run')};
      if(!out)prev=s;
      return entry;
    })});
  }

  function chooseDryCompound(state,remaining){
    const r=remaining*stepLaps;
    let choice=r>COMPOUNDS.Medium.life*1.05?'Hard':r>COMPOUNDS.Soft.life*.95?'Medium':'Soft';
    if(mandatoryStop&&!state.metRule&&state.usedDry.has(choice))choice=choice==='Hard'?'Medium':choice==='Medium'?'Hard':'Medium';
    return choice;
  }
  function doPit(state,lap,compound){
    state.stints.push({from:state.stintStart,to:Math.max(state.stintStart,(lap-1)*stepLaps),compound:state.compound});
    state.stintStart=(lap-1)*stepLaps+1;state.compound=compound;state.tyreAge=0;state.pits+=1;state.pitted=true;state.lastPitLap=lap;
    if(COMPOUNDS[compound].kind==='slick'){state.usedDry.add(compound);if(state.usedDry.size>=2)state.metRule=true;}else state.metRule=true;
    state.switchAt=null;state.switchKind=null;
  }
  function wear(state){
    const comp=COMPOUNDS[state.compound];const age=state.tyreAge*stepLaps;
    const life=comp.life*(1.25-state.degFactor*.25);
    return comp.deg*state.degFactor*age+(age>life?(age-life)*.07:0);
  }
  function lapTime(state,seg,track){
    const e=state.e;const comp=COMPOUNDS[state.compound];
    const wrong=wrongTyrePenalty(track,state.compound);
    const base=lapBase+TRACK_OFFSET[track]-((e.pace[seg]??e.pace[0])-70)*paceScale;
    const tyre=(comp.kind==='slick'&&track==='Dry'?comp.offset:0)+wear(state)*(wrong>0?1.8:1)+wrong;
    const expected=base+tyre;
    const noise=(rng.next()+rng.next()-1)*(e.noiseAmp??.35);
    state.paceSum+=e.pace[seg]??e.pace[0];state.paceLaps+=1;
    return{expected:expected*stepLaps,time:(expected+noise)*stepLaps};
  }
  function deploy(kind,lap,reason){
    if(scLeft>0||vscLeft>0||lap>=laps-1)return;
    if(kind==='sc'){
      scLeft=isSprint?2:rng.int(3,5);flags.safetyCar=true;
      pushMoment({lap:lap*stepLaps,type:'sc',driverIds:reason?.ids||[],position:null,text:`Safety Car: ${reason?.text||'an incident on track'}`});
      events.push({lap:lap*stepLaps,type:'Safety Car',text:'The Safety Car compresses the field and reshapes the pit window'});
    }else{
      vscLeft=rng.int(2,3);flags.virtualSafetyCar=true;
      pushMoment({lap:lap*stepLaps,type:'vsc',driverIds:reason?.ids||[],position:null,text:`Virtual Safety Car: ${reason?.text||'debris on track'}`});
      events.push({lap:lap*stepLaps,type:'Virtual Safety Car',text:'A Virtual Safety Car neutralizes the pace and opens a cheaper pit-stop window'});
    }
  }
  function retire(state,lap,type,text,tag){
    state.status='DNF';state.lapsDone=Math.max(0,lap-1)*stepLaps;state.tags.push(tag);
    pushEvent(state,lap*stepLaps,type,text);
  }

  for(let lap=1;lap<=laps;lap+=1){
    const seg=segOf(lap);const track=timeline[seg];const prevTrack=lap>1?timeline[segOf(lap-1)]:track;
    const flag=redThisLap?'red':scLeft>0?'sc':vscLeft>0?'vsc':'green';
    const isRestart=flag==='green'&&restartNext;
    const startOrder=running().sort((a,b)=>a.cum-b.cum);
    const position=new Map(startOrder.map((s,index)=>[s.id,index+1]));
    // Weather change: schedule each car's tyre call from its strategy quality.
    if(track!==prevTrack){
      const wetter=(track==='Wet')||(track==='Damp'&&prevTrack==='Dry');
      pushMoment({lap:lap*stepLaps,type:'rain',driverIds:[],position:null,text:wetter?(track==='Wet'?'Heavy rain hits the circuit':'Rain starts to fall'):(track==='Dry'?'The track dries: slicks are the call':'The rain eases to a damp track')});
      startOrder.forEach((s)=>{
        const want=idealKind(track);
        if(COMPOUNDS[s.compound].kind===want){s.switchAt=null;return;}
        const roll=(s.e.strategy||75)+(rng.next()-.5)*24;
        const delay=roll>=86?0:roll>=75?1:2+(rng.chance(.35)?1:0);
        s.switchAt=lap+delay;s.switchKind=want;
        if(delay>=2)s.tags.push('Late tyre call');
        else if(delay===0&&track!=='Dry')s.tags.push('Perfect crossover call');
      });
    }
    // Pit decisions and lap times.
    startOrder.forEach((s)=>{
      s.pitted=false;
      const remaining=laps-lap;let pit=null;
      if(flag==='red'){
        // Free tyre change during the stoppage.
        const want=idealKind(track);const compound=want==='slick'?chooseDryCompound(s,remaining):compoundForKind(want);
        if(compound!==s.compound||s.tyreAge>3){s.stints.push({from:s.stintStart,to:Math.max(s.stintStart,(lap-1)*stepLaps),compound:s.compound});s.stintStart=(lap-1)*stepLaps+1;s.compound=compound;if(COMPOUNDS[compound].kind==='slick'){s.usedDry.add(compound);if(s.usedDry.size>=2)s.metRule=true;}else s.metRule=true;}
        s.tyreAge=0;s.switchAt=null;s.tags.push('Red-flag restart');
      }else if(s.switchAt!=null&&lap>=s.switchAt&&remaining>=0){
        const kind=s.switchKind||idealKind(track);
        pit=kind==='slick'?chooseDryCompound(s,remaining):compoundForKind(kind);
      }else if(remaining>0&&COMPOUNDS[s.compound].kind==='slick'&&track==='Dry'&&allowDryStops&&lap-s.lastPitLap>4){
        const w=wear(s);const comp=COMPOUNDS[s.compound];
        if((flag==='sc'||flag==='vsc')&&remaining*stepLaps>8&&s.tyreAge*stepLaps>=comp.life*.4&&rng.chance(clamp(((s.e.strategy||75)-55)/45,.25,.9)))pit=chooseDryCompound(s,remaining);
        else if(w>s.pitThreshold&&remaining*stepLaps>5)pit=chooseDryCompound(s,remaining);
        else if(mandatoryStop&&!s.metRule&&remaining<=2)pit=chooseDryCompound(s,remaining);
      }
      const t=flag==='green'?lapTime(s,seg,track):null;
      let lt=t?t.time:(flag==='sc'||flag==='red'?(lapBase+TRACK_OFFSET[track])*1.4:(lapBase+TRACK_OFFSET[track])*1.3)*stepLaps;
      s.expected=t?t.expected:lt;
      if(pit){
        const crew=(10-(s.e.pitCrew??5))*.55;
        let loss=pitLossBase+crew+(rng.next()-.5)*1.2;
        const slow=rng.chance(.02);if(slow)loss+=rng.int(3,8);
        loss*=flag==='sc'?.5:flag==='vsc'?.62:1;
        lt+=loss;
        const from=position.get(s.id);
        // Undercut watch: the car directly ahead, if close.
        const idx=startOrder.indexOf(s);const target=idx>0?startOrder[idx-1]:null;
        s.watch=flag==='green'&&target&&s.cum-target.cum<2.6&&lap-target.lastPitLap>3?{targetId:target.id,lap}:null;
        doPit(s,lap,pit);
        if(flag==='vsc'&&rng.chance(.5))s.tags.push('VSC pit-stop gain');
        if(flag==='sc'&&rng.chance(.4))s.tags.push('Safety-car beneficiary');
        pushMoment({lap:lap*stepLaps,type:'pit',driverIds:[s.id],position:from,text:`${name(s.id)} pits from P${from} for ${pit}${slow?' — a slow stop':''}${flag==='sc'?' under the Safety Car':flag==='vsc'?' under the VSC':''}`,slow});
      }
      if(flag==='green'&&!pit&&lap>1&&lt<s.best){s.best=lt;s.bestLap=lap;}
      s.lt=lt;s.newCum=s.cum+lt;
    });
    // Reliability, driver errors and penalties.
    if(flag==='green'){
      startOrder.forEach((s)=>{
        if(s.status!=='Running')return;
        if(rng.chance((s.e.reliabilityRisk||0)/laps)){
          const reason=rng.pick(['power unit failure','hydraulic failure','gearbox failure','electrical shutdown','overheating']);
          retire(s,lap,'Retirement',`${name(s.id)} retires with ${reason}`,'Mechanical DNF');
          pushMoment({lap:lap*stepLaps,type:'dnf',driverIds:[s.id],position:position.get(s.id),text:`${name(s.id)} retires from P${position.get(s.id)}: ${reason}`});
          if(rng.chance(.35))deploy('vsc',lap,{ids:[s.id],text:`${name(s.id)} stops on track`});
          return;
        }
        const incident=((s.e.incidentBase||.006)+(track!=='Dry'?.008:0))*8/laps*(lap===1?2.5:1)*incidentScale;
        if(rng.chance(incident)){
          if(rng.chance(.28)){
            retire(s,lap,'Incident',`${name(s.id)} crashes out in ${track.toLowerCase()} conditions`,'Crash DNF');
            pushMoment({lap:lap*stepLaps,type:'dnf',driverIds:[s.id],position:position.get(s.id),text:`${name(s.id)} crashes out from P${position.get(s.id)}`});
            if(redFlagAllowed&&!isSprint&&!flags.redFlag&&track==='Wet'&&rng.chance(.16)){
              flags.redFlag=true;flags.safetyCar=true;redThisLap=true;scLeft=1;
              pushMoment({lap:lap*stepLaps,type:'sc',driverIds:[s.id],position:null,text:'Red flag: the race is stopped in dangerous conditions'});
              events.push({lap:(lap+1)*stepLaps,type:'Red Flag',text:'The race is stopped in dangerous conditions; the field restarts on freely chosen tyres'});
            }else if(rng.chance(.72))deploy('sc',lap,{ids:[s.id],text:`${name(s.id)} is in the barrier`});
            else deploy('vsc',lap,{ids:[s.id],text:`marshals clear ${name(s.id)}'s car`});
          }else{
            const loss=rng.int(3,10)*stepLaps**.5;s.newCum+=loss;s.tags.push('Costly mistake');
            pushEvent(s,lap*stepLaps,'Mistake',`${name(s.id)} loses time after a driving error`);
          }
          return;
        }
        if(rng.chance(.006*8/laps)){
          s.penalty+=5;s.newCum+=5;s.tags.push('Five-second penalty');
          pushEvent(s,lap*stepLaps,'Penalty',`${name(s.id)} receives a five-second penalty`);
        }
      });
    }
    // Resolve the running order.
    const alive=startOrder.filter((s)=>s.status==='Running');
    const passes=[];
    if(flag==='green'){
      const F=[];
      alive.filter((s)=>!s.pitted).forEach((c)=>{
        const ahead=F[F.length-1];
        if(!ahead){F.push(c);return;}
        const interval=c.cum-ahead.cum;
        if(c.newCum<ahead.newCum+.12){
          const range=isRestart?PASS_RANGE*1.3:PASS_RANGE;
          if(lap>1&&interval<=range*stepLaps){
            const paceAdv=(ahead.expected-c.expected)/stepLaps;
            const skill=((c.e.racecraft||80)+(c.e.attackBonus||0)-(c.e.defence||80)-(ahead.e.defenceBonus||0))/12;
            const tyreEdge=clamp((ahead.tyreAge-c.tyreAge)*stepLaps/18,-1.2,1.2)+(COMPOUNDS[c.compound].offset<COMPOUNDS[ahead.compound].offset-.2?.25:0);
            const ot=overtakeTrait/100;
            const x=-6.6+ot*7.0+paceAdv*(.4+ot*4.6)+skill*.55+tyreEdge*.45+(isRestart?.45:0)+(track!=='Dry'?.25:0);
            const p=1/(1+Math.exp(-x));
            const contactRisk=(.012+(c.e.aggressive?.01:0)+(track!=='Dry'?.01:0)+((c.e.composure||80)<76?.005:0))*incidentScale;
            if(rng.chance(contactRisk)){
              contacts+=1;
              const lossA=rng.int(2,8),lossB=rng.int(1,6);c.newCum=ahead.newCum+lossA;ahead.newCum+=lossB;
              const dnfA=rng.chance(.16),dnfB=!dnfA&&rng.chance(.1);
              const pos=position.get(ahead.id);
              pushMoment({lap:lap*stepLaps,type:'contact',driverIds:[c.id,ahead.id],position:pos,gap:round1(interval),text:`Contact! ${name(c.id)} and ${name(ahead.id)} touch fighting for P${pos}${dnfA?` — ${name(c.id)} is out`:dnfB?` — ${name(ahead.id)} is out`:''}`});
              c.tags.push('Contact');ahead.tags.push('Contact');
              const victim=dnfA?c:dnfB?ahead:null;
              if(victim){
                retire(victim,lap,'Incident',`${name(victim.id)} retires after contact with ${name(victim===c?ahead.id:c.id)}`,'Crash DNF');
                pushMoment({lap:lap*stepLaps,type:'dnf',driverIds:[victim.id],position:position.get(victim.id),text:`${name(victim.id)} retires after the contact`});
                if(rng.chance(.6))deploy('sc',lap,{ids:[victim.id],text:`debris after ${name(c.id)} and ${name(ahead.id)} collide`});else deploy('vsc',lap,{ids:[victim.id],text:'a damaged car is recovered'});
              }
              if(victim===ahead){F.pop();}
              if(victim!==c){
                // Keep the order monotonic after the contact losses.
                F.sort((a,b)=>a.newCum-b.newCum);
                const last=F[F.length-1];c.newCum=Math.max(c.newCum,(last?.newCum??-Infinity)+.15);F.push(c);
              }
              return;
            }
            if(rng.chance(p)){
              const floor=F.length>=2?F[F.length-2].newCum+.1:-Infinity;
              let target=Math.min(c.newCum,ahead.newCum-.1);if(target<=floor)target=(floor+ahead.newCum)/2;
              c.newCum=target;ahead.newCum=Math.max(ahead.newCum+.1+rng.next()*.3,c.newCum+.15);
              F.splice(F.length-1,0,c);
              c.overtakes+=1;overtakes+=1;passes.push({attacker:c,defender:ahead,interval});
            }else{
              failedAttacks+=1;
              c.newCum=ahead.newCum+.2+rng.next()*.35;F.push(c);
              passes.push({attacker:c,defender:ahead,interval,failed:true});
            }
            return;
          }
          c.newCum=Math.max(c.newCum,ahead.newCum+.2+rng.next()*.3);
        }
        F.push(c);
      });
    }else{
      // Neutralised lap: nobody overtakes on track.
      const F=[];
      alive.filter((s)=>!s.pitted).forEach((c)=>{const ahead=F[F.length-1];if(ahead&&c.newCum<ahead.newCum+.2)c.newCum=ahead.newCum+.2;F.push(c);});
    }
    alive.forEach((s)=>{if(s.status!=='Running')return;s.cum=s.newCum;s.lapsDone=lap*stepLaps;s.tyreAge+=1;});
    let finalOrder=alive.filter((s)=>s.status==='Running').sort((a,b)=>a.cum-b.cum);
    if(flag==='sc'||flag==='red'){
      for(let i=1;i<finalOrder.length;i+=1){const gap=finalOrder[i].cum-finalOrder[i-1].cum;finalOrder[i].cum=finalOrder[i-1].cum+Math.max(flag==='red'?.3:.35,gap*(flag==='red'?.05:.4));}
    }
    // Team orders, if the caller asks for them on this lap.
    if(teamOrders&&teamOrderLap===lap&&flag==='green'){
      const swaps=teamOrders(finalOrder.map((s)=>({driverId:s.id,teamId:s.teamId,cum:s.cum})),rng)||[];
      swaps.forEach(({leadId,otherId,text})=>{
        const lead=byId.get(leadId),other=byId.get(otherId);if(!lead||!other)return;
        const li=finalOrder.indexOf(lead),oi=finalOrder.indexOf(other);if(oi<0||li!==oi+1)return;
        const prevCum=other.cum;lead.cum=prevCum-.15;other.cum=Math.max(prevCum+.6,lead.cum+.3);
        finalOrder.sort((a,b)=>a.cum-b.cum);
        lead.tags.push('Team-order priority');other.tags.push('Team order obeyed');
        events.push({lap:lap*stepLaps,type:'Team Order',text});
        pushMoment({lap:lap*stepLaps,type:'teamOrder',driverIds:[leadId,otherId],position:finalOrder.indexOf(lead)+1,text});
      });
    }
    const finalPos=new Map(finalOrder.map((s,index)=>[s.id,index+1]));
    passes.forEach(({attacker,defender,interval,failed})=>{
      if(failed){
        const pos=finalPos.get(defender.id)||position.get(defender.id);
        pushMoment({lap:lap*stepLaps,type:'failedAttack',driverIds:[attacker.id,defender.id],position:pos,gap:round1(interval),text:`${name(attacker.id)} attacks ${name(defender.id)} for P${pos} — ${name(defender.id)} holds on`});
      }else if(attacker.status==='Running'){
        const pos=finalPos.get(attacker.id);
        pushMoment({lap:lap*stepLaps,type:'overtake',driverIds:[attacker.id,defender.id],position:pos,gap:round1(interval),text:`${name(attacker.id)} passes ${name(defender.id)} for P${pos}`});
      }
    });
    // Undercuts resolve when the target car makes its own stop.
    alive.filter((s)=>s.pitted).forEach((target)=>{
      states.forEach((s)=>{
        if(s.watch?.targetId!==target.id||s.status!=='Running')return;
        if(lap-s.watch.lap>=1&&lap-s.watch.lap<=6&&finalPos.get(s.id)<finalPos.get(target.id)){
          pushMoment({lap:lap*stepLaps,type:'undercut',driverIds:[s.id,target.id],position:finalPos.get(s.id),text:`The undercut works: ${name(s.id)} jumps ${name(target.id)} for P${finalPos.get(s.id)}`});
        }
        s.watch=null;
      });
    });
    if(lap===1){
      const leader=finalOrder[0];
      const gainers=finalOrder.map((s)=>({s,gain:s.grid-finalPos.get(s.id)})).filter((item)=>item.gain>=2).sort((a,b)=>b.gain-a.gain).slice(0,3);
      pushMoment({lap:stepLaps,type:'start',driverIds:[leader?.id,...gainers.map((g)=>g.s.id)].filter(Boolean),position:1,text:`Lights out: ${name(leader?.id)} leads${leader&&leader.grid!==1?` from P${leader.grid}`:' from pole'}${gainers.length?`; ${gainers.map((g)=>`${name(g.s.id)} +${g.gain}`).join(', ')}`:''}`});
    }
    if(isRestart){
      pushMoment({lap:lap*stepLaps,type:'restart',driverIds:finalOrder.slice(0,2).map((s)=>s.id),position:1,text:`Green flag: ${name(finalOrder[0]?.id)} leads the restart`});
      restartNext=false;
    }
    if(policy(lap)||lap===laps)recordSnapshot(lap,flag,track);
    // Advance neutralisation counters.
    if(flag==='red'){redThisLap=false;scLeft=0;restartNext=true;}
    else if(flag==='sc'){scLeft-=1;if(scLeft<=0)restartNext=true;}
    else if(flag==='vsc'){vscLeft-=1;}
  }

  // Classification.
  const finishers=states.filter((s)=>s.status==='Running').sort((a,b)=>a.cum-b.cum);
  const retired=states.filter((s)=>s.status!=='Running').sort((a,b)=>b.lapsDone-a.lapsDone||a.cum-b.cum);
  finishers.forEach((s)=>{s.stints.push({from:s.stintStart,to:laps*stepLaps,compound:s.compound});if(s.best<fastest.time)fastest={id:s.id,time:s.best,lap:s.bestLap};});
  retired.forEach((s)=>{s.stints.push({from:s.stintStart,to:Math.max(s.stintStart,s.lapsDone),compound:s.compound});});
  const classification=[...finishers,...retired];
  if(fastest.id)pushMoment({lap:(fastest.lap||laps)*stepLaps,type:'fastestLap',driverIds:[fastest.id],position:finishers.findIndex((s)=>s.id===fastest.id)+1,text:`Fastest lap: ${name(fastest.id)}`});
  if(finishers[0]){
    const gap=finishers[1]?finishers[1].cum-finishers[0].cum:null;
    pushMoment({lap:laps*stepLaps,type:'finish',driverIds:finishers.slice(0,3).map((s)=>s.id),position:1,gap:gap!=null?round1(gap):null,text:`Chequered flag: ${name(finishers[0].id)} wins${gap!=null?` by ${gap.toFixed(1)}s`:''}`});
  }
  // Keep the moment list small: failed attacks outside the points are dropped first.
  let kept=moments;
  if(kept.length>maxMoments){
    const essential=kept.filter((m)=>m.type!=='failedAttack'&&!(m.type==='pit'&&(m.position||99)>12&&!m.slow)&&!(m.type==='overtake'&&(m.position||99)>14));
    const optional=kept.filter((m)=>!essential.includes(m)).sort((a,b)=>(a.position||99)-(b.position||99));
    kept=[...essential,...optional.slice(0,Math.max(0,maxMoments-essential.length))].sort((a,b)=>a.lap-b.lap);
    if(kept.length>maxMoments*1.4)kept=kept.filter((m)=>m.type!=='failedAttack'||(m.position||99)<=6);
  }
  kept.forEach((m)=>{delete m.slow;});
  return{classification,snapshots,moments:kept,overtakes,failedAttacks,contacts,flags,events:events.sort((a,b)=>a.lap-b.lap),fastest:fastest.id?{driverId:fastest.id,time:fastest.time/stepLaps,lap:fastest.lap*stepLaps}:null};
}
