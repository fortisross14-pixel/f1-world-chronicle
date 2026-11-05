// Interest scores for race moments. Used by the engine when a race is stored
// and by the Live Race "director" when it picks highlights.

const TYPE_BASE={start:6,overtake:4,failedAttack:2,contact:6,pit:1,undercut:4,sc:8,vsc:4,restart:5,rain:6,dnf:4,fastestLap:2,teamOrder:5,finish:8};
const STAKE_TYPES=new Set(['overtake','failedAttack','contact','undercut','dnf','pit','teamOrder']);

// What is at stake at a given position: the win counts far more than a podium,
// and the last points place (P10/P11) is worth more than the midfield.
export function positionStake(position){
  if(!position)return 1;
  if(position===1)return 10;
  if(position<=3)return 6;
  if(position<=6)return 3.5;
  if(position===10||position===11)return 4;
  if(position<=10)return 2.5;
  return 1;
}

/**
 * ctx: {laps, contenders:Set<driverId>, isWetLap:(lap)=>bool, rivalHeat:(a,b)=>number}
 */
export function scoreMoment(moment,ctx={}){
  let score=TYPE_BASE[moment.type]||1;
  if(STAKE_TYPES.has(moment.type))score+=positionStake(moment.position)*(moment.type==='pit'?.4:1);
  const ids=(moment.driverIds||[]).filter(Boolean);
  if(ctx.contenders)score+=ids.filter((id)=>ctx.contenders.has(id)).length*2.5;
  if(ids.length>=2&&ctx.rivalHeat)score+=Math.min(6,ctx.rivalHeat(ids[0],ids[1])||0);
  if(ctx.isWetLap?.(moment.lap))score+=1.5;
  const laps=ctx.laps||0;
  if(laps&&moment.lap>=laps-5)score+=3;else if(laps&&moment.lap>=laps-10)score+=1.5;
  if(moment.gap!=null&&['overtake','failedAttack','contact'].includes(moment.type))score+=Math.max(0,Math.min(1,1-moment.gap))*1.5;
  if(moment.type==='finish'&&moment.gap!=null&&moment.gap<2)score+=4;
  return Math.round(score*10)/10;
}

export function scoreMoments(moments,ctx){
  (moments||[]).forEach((moment)=>{moment.score=scoreMoment(moment,ctx);});
  return moments;
}
