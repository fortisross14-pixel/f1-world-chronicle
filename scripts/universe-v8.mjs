import assert from 'node:assert/strict';
import { createUniverse, getStaff, hydrateUniverse } from '../src/data.js';
import { advanceToNextSeason, driverStandings, simulateToSeasonEnd } from '../src/sim.js';

const SERIES=['F1','F2','F3','F4','FE','WEC'];
// v7 saves that contain the old premature-retirement bug are repaired on load.
const legacy=createUniverse(11);legacy.schemaVersion=10;const legacyYoung=legacy.drivers.find((driver)=>driver.age<30);legacyYoung.active=false;legacyYoung.role='Retired';legacyYoung.teamId=legacyYoung.teamId||legacy.teams[0].id;const migrated=hydrateUniverse(legacy);const repaired=migrated.drivers.find((driver)=>driver.id===legacyYoung.id);assert.equal(repaired.active,true);assert.equal(repaired.role,'Free agent');assert.equal(repaired.teamId,null);
let universe=createUniverse(20260808);
universe=simulateToSeasonEnd(universe);
assert.equal(universe.phase,'Season complete');

// Every championship point must be traceable to a displayed race/sprint result.
for(const series of SERIES){
  const accounted=new Map();
  for(const record of universe.competitionEventResults?.[series]||[]){
    for(const row of record.sessions?.R?.rows||[])accounted.set(row.driverId,(accounted.get(row.driverId)||0)+(row.points||0));
    for(const row of record.sessions?.S?.rows||[])accounted.set(row.driverId,(accounted.get(row.driverId)||0)+(row.points||0));
  }
  for(const driver of driverStandings(universe,series)){
    assert.equal(accounted.get(driver.id)||0,driver.season.points,`${series}: ${driver.name} points need to reconcile to event rows`);
  }
}

// Any substitute/test driver who actually raced must remain visible in F1 standings.
const f1Participants=new Set((universe.competitionEventResults?.F1||[]).flatMap((record)=>record.sessions?.R?.rows?.map((row)=>row.driverId)||[]));
const f1Standings=new Set(driverStandings(universe,'F1').map((driver)=>driver.id));
for(const id of f1Participants)assert.ok(f1Standings.has(id),`F1 participant ${id} must appear in standings`);

universe=advanceToNextSeason(universe);
assert.equal(universe.schemaVersion,12);
const archived=universe.seasonArchive.at(-1);
for(const series of SERIES){
  const history=archived.series?.[series];
  assert.ok(history?.standings?.length>=3,`${series} history needs top three`);
  assert.ok(history.standings.slice(0,3).every((row)=>row.teamName),`${series} history top three need team names`);
  assert.ok(Number.isFinite(history.teamChampionPoints),`${series} history needs winning team points`);
}

// Driver season snapshots must contain the full career-table fields.
const seasonRows=universe.drivers.flatMap((driver)=>(driver.career?.seasons||[]).map((row)=>({driver,row})));
assert.ok(seasonRows.length>0,'Driver career snapshots should exist');
for(const {driver,row} of seasonRows.slice(0,120)){
  for(const key of ['year','series','role','points','salary','wins','poles','podiums'])assert.ok(key in row,`${driver.name} season row missing ${key}`);
}
assert.ok(seasonRows.some(({row})=>row.role==='Test driver'||row.role==='Free agent'),'Career history should preserve non-race roles');

// Staff, especially team principals, receive annual organizational snapshots.
const principals=universe.staff.filter((member)=>member.role==='Team Principal');
assert.ok(principals.length>0,'Team principals must exist');
assert.ok(principals.every((member)=>(member.careerSeasons||[]).length>=1),'Every team principal needs a career season snapshot');
for(const principal of principals.slice(0,10)){
  const row=principal.careerSeasons.at(-1);
  for(const key of ['year','series','teamName','salary','teamRevenue','teamPosition','teamPoints','bestDriverPosition','bestDriverPoints','teamWins'])assert.ok(key in row,`${principal.name} career snapshot missing ${key}`);
}

// Off-season market shown in the Paddock belongs to the new/current season.
assert.ok((universe.marketHistory||[]).filter((move)=>move.year===universe.year).length>0,'Current season should have driver-market activity');
const currentMoves=(universe.marketHistory||[]).filter((move)=>move.year===universe.year);const actionCount=new Map();for(const move of currentMoves)actionCount.set(move.driverId,(actionCount.get(move.driverId)||0)+1);assert.ok([...actionCount.values()].every((count)=>count===1),'A driver can only have one off-season market action');

// Long-run retirement floor: nobody exits before age 30.
universe=simulateToSeasonEnd(universe);universe=advanceToNextSeason(universe);
const retirees=universe.drivers.filter((driver)=>!driver.active&&driver.role==='Retired');
assert.ok(retirees.length>0,'Long run should contain retired drivers');
assert.ok(retirees.every((driver)=>driver.age>=30),`No driver may retire before 30; youngest was ${Math.min(...retirees.map((driver)=>driver.age))}`);
assert.ok(retirees.every((driver)=>driver.teamId==null),'Retired drivers must not retain a current-team link');

console.log('Universe v8 validation passed:',{
  year:universe.year,
  archivedSeries:Object.keys(archived.series||{}),
  careerRows:seasonRows.length,
  principals:principals.length,
  currentMarket:(universe.marketHistory||[]).filter((move)=>move.year===archived.year+1).length,
  retirees:retirees.length,
  youngestRetirement:Math.min(...retirees.map((driver)=>driver.age)),
});
