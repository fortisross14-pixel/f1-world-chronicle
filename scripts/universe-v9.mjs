import assert from 'node:assert/strict';
import { createUniverse, hydrateUniverse, PERSONALITY_TRAITS } from '../src/data.js';
import { advanceToNextSeason, driverStandings, simulateToSeasonEnd } from '../src/sim.js';

const SERIES=['F1','F2','F3','F4','FE','WEC'];
const sportingSnapshot=(universe)=>({
  results:Object.fromEntries(SERIES.map((series)=>[series,(universe.competitionEventResults?.[series]||[]).map((record)=>({
    eventId:record.eventId,
    winnerId:record.winnerId,
    poleId:record.poleId,
    fastestLapDriverId:record.fastestLapDriverId,
    podium:(record.podium||[]).map((row)=>row.driverId),
    race:(record.sessions?.R?.rows||[]).map((row)=>[row.driverId,row.position,row.points,row.status]),
  }))])),
  standings:Object.fromEntries(SERIES.map((series)=>[series,driverStandings(universe,series).map((driver)=>[driver.id,driver.season.points,driver.season.wins,driver.season.poles,driver.season.podiums])])),
});

// The universe clock is narrative time, not a fake calendar year.
let universe=createUniverse(20260809);
assert.equal(universe.year,1);
assert.equal(universe.seasonIndex,1);

// Every procedural driver gets exactly one valid value on each personality axis.
for(const driver of universe.drivers){
  assert.ok(driver.personality,'Every driver needs a personality');
  for(const [axis,values] of Object.entries(PERSONALITY_TRAITS)){
    assert.ok(values.includes(driver.personality[axis]),`${driver.name} has invalid ${axis}: ${driver.personality[axis]}`);
  }
}

// Old calendar-year saves migrate cleanly into Year N semantics.
const legacy=createUniverse(77);
legacy.schemaVersion=11;
legacy.year=2026;
legacy.seasonIndex=2026;
legacy.drivers[0].teamJoinedYear=2026;
legacy.drivers[0].contract.through=2028;
const migrated=hydrateUniverse(legacy);
assert.equal(migrated.year,1);
assert.equal(migrated.seasonIndex,1);
assert.equal(migrated.drivers[0].teamJoinedYear,1);
assert.equal(migrated.drivers[0].contract.through,3);

// Personality is flavor only. Changing every trait must not change a single
// sporting result when both universes use the same seed.
let sportingA=createUniverse(451991);
let sportingB=structuredClone(sportingA);
const flipped={communication:'Outspoken',ethics:'Dirty',temperament:'Hot-headed',social:'Rivalrous'};
for(const driver of sportingB.drivers)driver.personality={...flipped};
sportingA=simulateToSeasonEnd(sportingA);
sportingB=simulateToSeasonEnd(sportingB);
assert.deepEqual(sportingSnapshot(sportingB),sportingSnapshot(sportingA),'Personality must not alter race outcomes, points or standings');
const flavorA=sportingA.drivers.reduce((sum,d)=>sum+(d.mind?.press?.length||0),0);
const flavorB=sportingB.drivers.reduce((sum,d)=>sum+(d.mind?.press?.length||0),0);
assert.notEqual(flavorA,flavorB,'Different personalities should still produce different press behavior');

// A natural season must create a living layer of private thoughts, press and relationships.
universe=simulateToSeasonEnd(universe);
assert.equal(universe.phase,'Season complete');
const countMind=(u)=>({
  thoughts:u.drivers.reduce((sum,d)=>sum+(d.mind?.thoughts?.length||0),0),
  press:u.drivers.reduce((sum,d)=>sum+(d.mind?.press?.length||0),0),
  official:u.drivers.reduce((sum,d)=>sum+Object.values(d.mind?.official||{}).filter((item)=>item.official).length,0),
  people:u.drivers.reduce((sum,d)=>sum+Object.keys(d.mind?.people||{}).length,0),
});
let counts=countMind(universe);
assert.ok(counts.thoughts>80,`Expected a meaningful private-thought layer, got ${counts.thoughts}`);
assert.ok(counts.press>15,`Expected press leakage, got ${counts.press}`);
assert.ok(counts.official>0,'At least one repeated public stance should become official');
assert.ok((universe.rivalries||[]).length>0,'Driver relationships/rivalries should emerge');
for(const relation of universe.rivalries||[])assert.ok(relation.score>=-100&&relation.score<=100,'Relationship score out of bounds');
for(const driver of universe.drivers){
  for(const score of Object.values(driver.mind?.teamSentiments||{}))assert.ok(score>=-100&&score<=100,'Team sentiment out of bounds');
  for(const score of Object.values(driver.mind?.people||{}))assert.ok(score>=-100&&score<=100,'Person relationship out of bounds');
}

// Advancing keeps the Year N clock and archives the previous year as Year 1.
universe=advanceToNextSeason(universe);
assert.equal(universe.year,2);
assert.equal(universe.seasonIndex,2);
assert.equal(universe.seasonArchive.at(-1)?.year,1);
assert.equal(universe.preseasonReports.at(-1)?.year,2);

// By the end of a second season, the same deterministic universe should have
// built both public leadership relationships and negative driver rivalries.
universe=simulateToSeasonEnd(universe);
counts=countMind(universe);
const principalLinks=universe.staff.filter((s)=>s.role==='Team Principal').flatMap((s)=>Object.values(s.relationships||{}));
const negativeRivalries=(universe.rivalries||[]).filter((r)=>r.score<=-25);
assert.ok(principalLinks.length>0,'Press comments should create team-principal relationship records');
assert.ok(negativeRivalries.length>0,'At least one driver rivalry should become meaningfully negative');

console.log('Universe v9 personality validation passed:',{
  year:universe.year,
  thoughts:counts.thoughts,
  press:counts.press,
  officialStances:counts.official,
  relationships:universe.rivalries?.length||0,
  negativeRivalries:negativeRivalries.length,
  principalRelationships:principalLinks.length,
  sportingIsolation:'passed',
});
